import { validateAndFixResponse } from "../../../lib/validators.js";
import { extractStudentTextFromPrompt } from "../../../lib/promptParsers.js";

export { extractStudentTextFromPrompt };

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
