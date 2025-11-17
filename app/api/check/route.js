import path from "path";
import { NextResponse } from "next/server";
import { enqueue } from "./queue";
import { getApiKeyForClass, isValidClassCode } from "../../../api/config/classCodeMap.js";
import { buildCheckPrompt, GROQ_SETTINGS, SYSTEM_MESSAGE } from "../../../api/config/checkWritingPrompt.js";
import { ERRORS, HTTP_STATUS } from "../../../api/config/errors.js";
import { validateAndFixResponse } from "../../../api/utils/responseValidator.js";
import { createServerClient } from "@/lib/supabaseServer";

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

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_SETTINGS.model,
          messages: [
            { role: "system", content: SYSTEM_MESSAGE },
            { role: "user", content: prompt },
          ],
          temperature: GROQ_SETTINGS.temperature,
          max_tokens: GROQ_SETTINGS.max_tokens,
          response_format: GROQ_SETTINGS.response_format,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          return NextResponse.json({ error: ERRORS.RATE_LIMIT_EXCEEDED }, { status: HTTP_STATUS.RATE_LIMIT });
        }
        throw new Error(errorData.error?.message || ERRORS.GROQ_API_ERROR);
      }

      const data = await response.json();
      let responseText = data.choices[0].message.content;

      responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      let parsedFeedback = JSON.parse(responseText);
      parsedFeedback = validateAndFixResponse(parsedFeedback);

      // Log to Supabase
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
