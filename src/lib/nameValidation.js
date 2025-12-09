export const MAX_NAME_LENGTH = 50;
export const NAME_REGEX = /^[a-zA-Z\s'-]+$/;

export function normalizeNameInput(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function isNameValid(value) {
  const normalized = normalizeNameInput(value);
  if (!normalized) return false;
  if (normalized.length > MAX_NAME_LENGTH) return false;
  return NAME_REGEX.test(normalized);
}
