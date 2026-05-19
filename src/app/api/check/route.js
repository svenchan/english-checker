import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { enqueue } from "./queue";
import { buildCheckPrompt, GROQ_SETTINGS, SYSTEM_MESSAGE } from "@/config/prompts";
import { ERRORS, HTTP_STATUS } from "@/config/errors";
import { validateAndFixResponse } from "@/lib/validators";
import { saveCheck } from "@/lib/saveCheck";
import { MAX_CHAR_COUNT } from "@/features/writing-checker/constants";
import { sanitizeInput } from "@/lib/sanitize";
import { normalizeTopicText } from "@/lib/normalizeTopicText";
import { CHECKER_MODES, TEST_MODE, buildTooShortFeedback } from "@/config/testMode";
import { countEffectiveWords, countSentences } from "@/lib/wordCount";

const CLASS11_API_KEY = process.env.GROQ_API_KEY_11;
const GUEST_SESSION_COOKIE = "wc_session_id";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

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

export async function POST(req) {
  const sessionInfo = getGuestSession(req);

  try {
    const response = await enqueue(req, async (r) => {
      const body = await r.json().catch(() => ({}));
      const text = sanitizeInput(body?.text ?? "");
      const requestedMode =
        body?.mode === CHECKER_MODES.TEST ? CHECKER_MODES.TEST : CHECKER_MODES.PRACTICE;
      const isTestMode = requestedMode === CHECKER_MODES.TEST;

      const topicText = normalizeTopicText(body?.topicText ?? body?.topic);
      if (isTestMode && !topicText) {
        return NextResponse.json({ error: ERRORS.NO_TOPIC }, { status: HTTP_STATUS.BAD_REQUEST });
      }

      if (!text && !isTestMode) {
        return NextResponse.json({ error: ERRORS.NO_TEXT }, { status: HTTP_STATUS.BAD_REQUEST });
      }

      if (text.length > MAX_CHAR_COUNT) {
        return NextResponse.json({ error: ERRORS.TEXT_TOO_LONG }, { status: HTTP_STATUS.BAD_REQUEST });
      }

      if (!CLASS11_API_KEY) {
        console.error("Missing required server configuration (Groq API key)");
        return NextResponse.json({ error: ERRORS.SERVER_ERROR }, { status: HTTP_STATUS.SERVER_ERROR });
      }

      const wordCount = countEffectiveWords(text);
      const sentenceCount = countSentences(text);
      const hasTopicContext = Boolean(topicText);
      const meetsPrepThreshold = wordCount >= 25 && sentenceCount >= 3;
      const shouldApplyPrepRule = isTestMode || hasTopicContext;
      const shouldIncludePrepFeedback = shouldApplyPrepRule && meetsPrepThreshold;

      if (isTestMode && wordCount < TEST_MODE.minWords) {
        const tooShortFeedback = buildTooShortFeedback(topicText);
        const checkId = await saveCheck({
          studentText: text,
          topicText,
          mode: requestedMode,
          status: "too_short",
          feedback: tooShortFeedback
        });
        return NextResponse.json(
          {
            submissionId: checkId,
            feedback: tooShortFeedback
          },
          { status: HTTP_STATUS.OK }
        );
      }

      const prompt = buildCheckPrompt(text, topicText, {
        includePrepFeedback: shouldIncludePrepFeedback
      });

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

        let groqResponse = await callGroq({ useJsonResponseFormat: true });

        if (!groqResponse.ok) {
          const errFirst = await groqResponse.json().catch(() => ({}));
          const msg = errFirst?.error?.message || "";
          if (/failed\s*_?generation/i.test(msg) || /Failed to generate JSON/i.test(msg)) {
            groqResponse = await callGroq({ useJsonResponseFormat: false });
          } else {
            if (groqResponse.status === 429) {
              return NextResponse.json({ error: ERRORS.RATE_LIMIT_EXCEEDED }, { status: HTTP_STATUS.RATE_LIMIT });
            }
            throw new Error(msg || ERRORS.GROQ_API_ERROR);
          }
        }

        if (!groqResponse.ok) {
          const errorData = await groqResponse.json().catch(() => ({}));
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
          expectTopicFeedback: shouldIncludePrepFeedback
        });
        parsedFeedback.mode = requestedMode;
        parsedFeedback.status = "ok";

        if (parsedFeedback) {
          parsedFeedback.topicText = topicText || null;
        }

        const checkId = await saveCheck({
          studentText: text,
          topicText,
          mode: requestedMode,
          status: "ok",
          feedback: parsedFeedback
        });

        return NextResponse.json(
          {
            submissionId: checkId,
            feedback: parsedFeedback
          },
          { status: HTTP_STATUS.OK }
        );
      } catch (error) {
        await saveCheck({
          studentText: text,
          topicText,
          mode: requestedMode,
          status: "error",
          feedback: { status: "error", mode: requestedMode, topicText: topicText || null }
        });
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
