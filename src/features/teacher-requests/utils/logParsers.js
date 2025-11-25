import { validateAndFixResponse } from "../../../lib/validators.js";

const STUDENT_PROMPT_PREFIX = '生徒の英文: "';
const STUDENT_PROMPT_SUFFIX = '"\n\n出力仕様';

export function extractStudentTextFromPrompt(prompt = "") {
  if (typeof prompt !== "string" || prompt.length === 0) {
    return "";
  }

  const startIndex = prompt.indexOf(STUDENT_PROMPT_PREFIX);
  if (startIndex === -1) return "";

  const start = startIndex + STUDENT_PROMPT_PREFIX.length;
  const endIndex = prompt.indexOf(STUDENT_PROMPT_SUFFIX, start);

  if (endIndex === -1) {
    return prompt.slice(start).trim();
  }

  return prompt.slice(start, endIndex).trim();
}

export function parseAiResponseString(raw = "") {
  if (!raw || typeof raw !== "string") {
    return validateAndFixResponse({ mistakes: [], overallScore: 100, levelUp: "" });
  }

  let sanitized = raw.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
  let parsed;

  try {
    parsed = JSON.parse(sanitized);
  } catch (error) {
    const first = sanitized.indexOf("{");
    const last = sanitized.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      const candidate = sanitized.slice(first, last + 1);
      try {
        parsed = JSON.parse(candidate);
      } catch (innerError) {
        parsed = { mistakes: [], overallScore: 0, levelUp: "" };
      }
    } else {
      parsed = { mistakes: [], overallScore: 0, levelUp: "" };
    }
  }

  return validateAndFixResponse(parsed || { mistakes: [], overallScore: 0, levelUp: "" });
}
