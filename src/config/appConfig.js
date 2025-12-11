export const DEFAULT_CLASS_CODE = "CLASS11";
const HOLDING_CLASS_ID_ENV_KEYS = [
  "WAITING_CLASS_ID",
  "SUPABASE_WAITING_CLASS_ID",
  "NEXT_PUBLIC_WAITING_CLASS_ID"
];

function getEnvValue(keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

export function getHoldingClassIdFromEnv() {
  return getEnvValue(HOLDING_CLASS_ID_ENV_KEYS);
}

export function getDefaultGroqApiKey() {
  const key = process.env.GROQ_API_KEY_11 || process.env.GROQ_API_KEY_CLASS11 || process.env.GROQ_API_KEY;

  if (!key) {
    throw new Error("Missing GROQ API key for the default CLASS11 flow.");
  }

  return key;
}
