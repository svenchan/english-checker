import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { enqueue } from "./queue";
import { buildCheckPrompt, GROQ_SETTINGS, SYSTEM_MESSAGE } from "@/config/prompts";
import { ERRORS, HTTP_STATUS } from "@/config/errors";
import { validateAndFixResponse } from "@/lib/validators";
import { supabaseAdmin } from "@/config/supabase";
import { MAX_CHAR_COUNT } from "@/features/writing-checker/constants";
import { sanitizeInput } from "@/lib/sanitize";
import { normalizeTopicText } from "@/lib/normalizeTopicText";

const CLASS11_API_KEY = process.env.GROQ_API_KEY_11;
const PROMPT_VERSION = "v2_topic";
const DEFAULT_SCHOOL_ID = "e769da05-74f7-493c-817d-ad4a0f676f62";
const GUEST_SESSION_COOKIE = "wc_session_id";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function sanitizeOrNull(value) {
  const sanitized = sanitizeInput(value ?? "");
  return sanitized || null;
}

function getGuestSession(req) {
  const sessionCookie = req.cookies?.get?.(GUEST_SESSION_COOKIE)?.value;
  const sessionId = sessionCookie || randomUUID();
  return {
    sessionId,
    shouldSetCookie: !sessionCookie
  };
}

function attachGuestCookie(response, sessionInfo) {
  if (!response || !sessionInfo?.shouldSetCookie) return;
  try {
    response.cookies.set(GUEST_SESSION_COOKIE, sessionInfo.sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: COOKIE_MAX_AGE_SECONDS
    });
  } catch (error) {
    console.error("Failed to attach guest session cookie:", error);
  }
}

async function updateSubmissionStatus(submissionId, status) {
  if (!supabaseAdmin || !submissionId) return;
  try {
    await supabaseAdmin.from("writing_submissions").update({ status }).eq("id", submissionId);
  } catch (statusError) {
    console.error("Failed to update submission status:", statusError);
  }
}

function resolveOwnerContext(body, sessionId) {
  const sanitizedStudentId = sanitizeInput(body?.studentId ?? "") || null;
  if (sanitizedStudentId) {
    return {
      ownerType: "student",
      studentId: sanitizedStudentId,
      guestSessionId: null
    };
  }

  return {
    ownerType: "guest",
    studentId: null,
    guestSessionId: sessionId
  };
}

export async function POST(req) {
  const sessionInfo = getGuestSession(req);

  try {
    const response = await enqueue(req, async (r) => {
      const body = await r.json().catch(() => ({}));
      const text = sanitizeInput(body?.text ?? "");

      if (!text) {
        return NextResponse.json({ error: ERRORS.NO_TEXT }, { status: HTTP_STATUS.BAD_REQUEST });
      }

      if (text.length > MAX_CHAR_COUNT) {
        return NextResponse.json({ error: ERRORS.TEXT_TOO_LONG }, { status: HTTP_STATUS.BAD_REQUEST });
      }

      if (!CLASS11_API_KEY || !supabaseAdmin) {
        console.error("Missing required server configuration");
        return NextResponse.json({ error: ERRORS.SERVER_ERROR }, { status: HTTP_STATUS.SERVER_ERROR });
      }

      const topicText = normalizeTopicText(body?.topicText ?? body?.topic);
      const prompt = buildCheckPrompt(text, topicText);
      const owner = resolveOwnerContext(body, sessionInfo.sessionId);

      const schoolId = sanitizeOrNull(body?.schoolId) || DEFAULT_SCHOOL_ID;
      const { data: submission, error: submissionError } = await supabaseAdmin
        .from("writing_submissions")
        .insert({
          owner_type: owner.ownerType,
          student_id: owner.studentId,
          guest_session_id: owner.guestSessionId,
          school_id: schoolId,
          class_id: sanitizeOrNull(body?.classId),
          topic_text: topicText,
          student_text: text,
          prompt_version: PROMPT_VERSION
        })
        .select()
        .single();

      if (submissionError || !submission) {
        console.error("Failed to insert writing_submissions:", submissionError);
        return NextResponse.json({ error: ERRORS.SERVER_ERROR }, { status: HTTP_STATUS.SERVER_ERROR });
      }

      try {
        const apiKey = CLASS11_API_KEY;

        async function callGroq(options = { useJsonResponseFormat: true }) {
          const requestBody = {
            model: GROQ_SETTINGS.model,
            messages: [
              { role: "system", content: SYSTEM_MESSAGE },
              { role: "user", content: prompt }
            ],
            temperature: GROQ_SETTINGS.temperature,
            max_tokens: GROQ_SETTINGS.max_tokens
          };

          if (options.useJsonResponseFormat) {
            requestBody.response_format = GROQ_SETTINGS.response_format;
          }

          return fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
          });
        }

        const aiStart = Date.now();
        let retries = 0;
        let groqResponse = await callGroq({ useJsonResponseFormat: true });

        if (!groqResponse.ok) {
          const errFirst = await groqResponse.json().catch(() => ({}));
          const msg = errFirst?.error?.message || "";
          if (/failed\s*_?generation/i.test(msg) || /Failed to generate JSON/i.test(msg)) {
            groqResponse = await callGroq({ useJsonResponseFormat: false });
            retries += 1;
          } else {
            await updateSubmissionStatus(submission.id, "error");
            if (groqResponse.status === 429) {
              return NextResponse.json({ error: ERRORS.RATE_LIMIT_EXCEEDED }, { status: HTTP_STATUS.RATE_LIMIT });
            }
            throw new Error(msg || ERRORS.GROQ_API_ERROR);
          }
        }

        if (!groqResponse.ok) {
          const errorData = await groqResponse.json().catch(() => ({}));
          await updateSubmissionStatus(submission.id, "error");
          if (groqResponse.status === 429) {
            return NextResponse.json({ error: ERRORS.RATE_LIMIT_EXCEEDED }, { status: HTTP_STATUS.RATE_LIMIT });
          }
          throw new Error(errorData.error?.message || ERRORS.GROQ_API_ERROR);
        }

        const data = await groqResponse.json();
        let responseText = data.choices?.[0]?.message?.content || "";

        if (typeof responseText === "string") {
          responseText = responseText.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
        }

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
        parsedFeedback = validateAndFixResponse(parsedFeedback, {
          expectTopicFeedback: Boolean(topicText)
        });

        const aiResult = {
          feedback: parsedFeedback,
          model: data.model || GROQ_SETTINGS.model,
          tokensIn: data.usage?.prompt_tokens || 0,
          tokensOut: data.usage?.completion_tokens || 0,
          latency: Date.now() - aiStart,
          retries
        };

        if (aiResult.feedback) {
          aiResult.feedback.topicText = topicText || null;
        }

        const { error: feedbackError } = await supabaseAdmin.from("ai_feedback").insert({
          submission_id: submission.id,
          feedback_json: aiResult.feedback,
          model: aiResult.model,
          tokens_in: aiResult.tokensIn,
          tokens_out: aiResult.tokensOut,
          latency_ms: aiResult.latency,
          retries: aiResult.retries ?? 0
        });

        if (feedbackError) {
          console.error("Failed to insert ai_feedback:", feedbackError);
          await updateSubmissionStatus(submission.id, "error");
          return NextResponse.json({ error: ERRORS.SERVER_ERROR }, { status: HTTP_STATUS.SERVER_ERROR });
        }

        await updateSubmissionStatus(submission.id, "ok");

        return NextResponse.json(
          {
            submissionId: submission.id,
            feedback: aiResult.feedback
          },
          { status: HTTP_STATUS.OK }
        );
      } catch (error) {
        await updateSubmissionStatus(submission.id, "error");
        throw error;
      }
    });

    attachGuestCookie(response, sessionInfo);
    return response;
  } catch (error) {
    console.error("Error:", error);
    const res = NextResponse.json(
      { error: ERRORS.SERVER_ERROR, details: error.message },
      { status: HTTP_STATUS.SERVER_ERROR }
    );
    attachGuestCookie(res, sessionInfo);
    return res;
  }
}
