import { CLASSROOM_CODES } from "./classroomCodes";

/**
 * Class Code to API Key Mapping
 */

function getEnvKeyForClass(code) {
  if (code === "TEACHER") return "GROQ_API_KEY_TEACHER";
  return `GROQ_API_KEY_${code.replace("CLASS", "")}`;
}

export const CLASS_CODE_MAP = CLASSROOM_CODES.reduce((map, code) => {
  const envKey = getEnvKeyForClass(code);
  map[code] = process.env[envKey];
  return map;
}, {});

export function isValidClassCode(code = "") {
  return CLASS_CODE_MAP.hasOwnProperty(code.toUpperCase());
}

export function getApiKeyForClass(code) {
  const apiKey = CLASS_CODE_MAP[code.toUpperCase()];
  if (!apiKey) {
    throw new Error(`No API key found for class code: ${code}`);
  }
  return apiKey;
}

export function getAllClassCodes() {
  return [...CLASSROOM_CODES];
}
