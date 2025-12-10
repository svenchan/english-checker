export const DEFAULT_CLASS_CODE = "CLASS11";

export function getDefaultGroqApiKey() {
  const key = process.env.GROQ_API_KEY_11 || process.env.GROQ_API_KEY_CLASS11 || process.env.GROQ_API_KEY;

  if (!key) {
    throw new Error("Missing GROQ API key for the default CLASS11 flow.");
  }

  return key;
}
