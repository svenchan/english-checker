import { NextResponse } from "next/server";
import { enqueue } from "./queue";
import { buildCheckPrompt, GROQ_SETTINGS, SYSTEM_MESSAGE } from "@/config/prompts";
import { ERRORS, HTTP_STATUS } from "@/config/errors";
import { validateAndFixResponse } from "@/lib/validators";
import { createServerClient } from "@/config/supabase";
import { MAX_CHAR_COUNT } from "@/features/writing-checker/constants";
import { sanitizeInput } from "@/lib/sanitize";
import { DEFAULT_CLASS_CODE, getDefaultGroqApiKey } from "@/config/appConfig";

export async function POST(req) {
  try {
    const result = await enqueue(req, async (r) => {
      const body = await r.json().catch(() => ({}));
      const text = sanitizeInput(body?.text ?? "");
      const studentId = sanitizeInput(body?.studentId ?? "");
      const guestSessionId = sanitizeInput(body?.guestSessionId ?? "");
      const hasStudentId = Boolean(studentId);
      const hasGuestId = Boolean(guestSessionId);

      if (!text) {
        return NextResponse.json({ error: ERRORS.NO_TEXT }, { status: HTTP_STATUS.BAD_REQUEST });
      }

      if (text.length > MAX_CHAR_COUNT) {
        return NextResponse.json({ error: ERRORS.TEXT_TOO_LONG }, { status: HTTP_STATUS.BAD_REQUEST });
      }

      if (!hasStudentId && !hasGuestId) {
        return NextResponse.json({ error: ERRORS.MISSING_IDENTIFIER }, { status: HTTP_STATUS.BAD_REQUEST });
      }

      if (hasStudentId && hasGuestId) {
        return NextResponse.json({ error: ERRORS.CONFLICTING_IDENTIFIERS }, { status: HTTP_STATUS.BAD_REQUEST });
      }

  const classCode = DEFAULT_CLASS_CODE;
  const apiKey = getDefaultGroqApiKey();
      const prompt = buildCheckPrompt(text);

      async function callGroq(options = { useJsonResponseFormat: true }) {
        const body = {
          model: GROQ_SETTINGS.model,
          messages: [
            { role: "system", content: SYSTEM_MESSAGE },
            { role: "user", content: prompt },
          ],
          temperature: GROQ_SETTINGS.temperature,
          max_tokens: GROQ_SETTINGS.max_tokens,
        };
        if (options.useJsonResponseFormat) body.response_format = GROQ_SETTINGS.response_format;
        return fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
        });
      }

      // First attempt: strict JSON response format
      let response = await callGroq({ useJsonResponseFormat: true });

      // If JSON generation failed, retry without response_format for resilience
      if (!response.ok) {
        const errFirst = await response.json().catch(() => ({}));
        const msg = errFirst?.error?.message || "";
        if (/failed\s*_?generation/i.test(msg) || /Failed to generate JSON/i.test(msg)) {
          response = await callGroq({ useJsonResponseFormat: false });
        } else {
          if (response.status === 429) {
            return NextResponse.json({ error: ERRORS.RATE_LIMIT_EXCEEDED }, { status: HTTP_STATUS.RATE_LIMIT });
          }
          throw new Error(msg || ERRORS.GROQ_API_ERROR);
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          return NextResponse.json({ error: ERRORS.RATE_LIMIT_EXCEEDED }, { status: HTTP_STATUS.RATE_LIMIT });
        }
        throw new Error(errorData.error?.message || ERRORS.GROQ_API_ERROR);
      }

      const data = await response.json();
      let responseText = data.choices?.[0]?.message?.content || "";
      const tokensIn = data.usage?.prompt_tokens || 0;
      const tokensOut = data.usage?.completion_tokens || 0;

      // Best-effort sanitization
      if (typeof responseText === "string") {
        responseText = responseText.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
      }

      // Try direct parse; if it fails, try to extract the first JSON object substring
      let parsedFeedback;
      try {
        parsedFeedback = JSON.parse(responseText);
      } catch (_) {
        const first = responseText.indexOf("{");
        const last = responseText.lastIndexOf("}");
        if (first !== -1 && last !== -1 && last > first) {
          const candidate = responseText.slice(first, last + 1);
          parsedFeedback = JSON.parse(candidate);
        } else {
          throw new Error(ERRORS.GROQ_API_ERROR);
        }
      }
      parsedFeedback = validateAndFixResponse(parsedFeedback);

      // Log to Supabase (only if env is configured)
      const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
      const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
      const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const canLogGuest = hasSupabaseUrl && hasServiceRole;
      const canLogStudent = hasSupabaseUrl && hasAnonKey;
      const baseLogEntry = {
        prompt,
        ai_response: responseText,
        tokens_in: tokensIn,
        tokens_out: tokensOut
      };

      if (!hasSupabaseUrl) {
        console.warn("Supabase env not configured; skipping logging");
      } else {
        try {
          if (hasStudentId && canLogStudent) {
            const supabase = createServerClient({ useServiceRole: false });
            const { data: studentRecord, error: studentLookupError } = await supabase
              .from("students")
              .select("class_id, school_id")
              .eq("id", studentId)
              .single();

            if (studentLookupError) {
              console.error("Failed to fetch student record for logging:", studentLookupError);
            }

            const logEntry = {
              ...baseLogEntry,
              student_id: studentId,
              class_id: studentRecord?.class_id ?? null,
              school_id: studentRecord?.school_id ?? null,
              guest_session_id: null,
              is_guest: false
            };

            await supabase.from("writing_logs").insert(logEntry);
          } else if (guestSessionId && canLogGuest) {
            const supabase = createServerClient();
            const logEntry = {
              ...baseLogEntry,
              student_id: null,
              class_id: null,
              school_id: null,
              guest_session_id: guestSessionId,
              is_guest: true
            };

            await supabase.from("writing_logs").insert(logEntry);
          }
        } catch (logError) {
          console.error("Failed to log to Supabase:", logError);
          // Don't fail the request if logging fails
        }
      }

      return NextResponse.json(
        {
          success: true,
          feedback: parsedFeedback,
          tokensUsed: {
            input: tokensIn,
            output: tokensOut
          }
        },
        { status: HTTP_STATUS.OK }
      );
    });

    return result;
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: ERRORS.SERVER_ERROR, details: error.message },
      { status: HTTP_STATUS.SERVER_ERROR }
    );
  }
}
