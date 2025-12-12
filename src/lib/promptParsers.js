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
