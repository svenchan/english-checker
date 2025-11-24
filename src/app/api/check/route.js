import path from "path";
import { NextResponse } from "next/server";
import { enqueue } from "./queue";
import { getApiKeyForClass, isValidClassCode } from "@/config/classCodeMap";
import { buildCheckPrompt, GROQ_SETTINGS, SYSTEM_MESSAGE } from "@/config/prompts";
import { ERRORS, HTTP_STATUS } from "@/config/errors";
import { validateAndFixResponse } from "@/lib/validators";
import { createServerClient } from "@/config/supabase";

export async function POST(req) {
  try {
    const result = await enqueue(req, async (r) => {
      const body = await r.json();
      const { text, classCode } = body;

      if (!text) {
        return NextResponse.json({ error: ERRORS.NO_TEXT }, { status: HTTP_STATUS.BAD_REQUEST });
      }

      if (!classCode) {
        return NextResponse.json({ error: ERRORS.NO_CLASS_CODE }, { status: HTTP_STATUS.BAD_REQUEST });
      }

      if (!isValidClassCode(classCode)) {
        return NextResponse.json({ error: ERRORS.INVALID_CLASS_CODE }, { status: HTTP_STATUS.UNAUTHORIZED });
      }

      const apiKey = getApiKeyForClass(classCode);
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
      const hasSupabaseEnv = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (hasSupabaseEnv) {
        try {
          const supabase = createServerClient();
          const { error } = await supabase.from("writing_logs").insert({
            student_id: body.studentId || null,
            class_code: classCode,
            prompt: prompt,
            ai_response: responseText,
            tokens_in: data.usage?.prompt_tokens || 0,
            tokens_out: data.usage?.completion_tokens || 0,
          });

          if (error) {
            console.error("Supabase logging error:", error);
          }
        } catch (logError) {
          console.error("Failed to log to Supabase:", logError);
          // Don't fail the request if logging fails
        }
      } else {
        console.warn("Supabase env not configured; skipping logging");
      }

      return NextResponse.json(parsedFeedback, { status: HTTP_STATUS.OK });
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
