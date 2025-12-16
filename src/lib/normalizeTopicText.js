const CONTROL_CHAR_REGEX = /[\u0000-\u001F\u007F]/g;
const WHITESPACE_REGEX = /\s+/g;
const MAX_TOPIC_LENGTH = 120;

export function normalizeTopicText(input) {
  if (typeof input !== "string") {
    return null;
  }

  let normalized = input.trim();
  if (!normalized) {
    return null;
  }

  normalized = normalized.replace(CONTROL_CHAR_REGEX, "").replace(WHITESPACE_REGEX, " ");
  if (!normalized) {
    return null;
  }

  if (normalized.length > MAX_TOPIC_LENGTH) {
    normalized = normalized.slice(0, MAX_TOPIC_LENGTH);
  }

  return normalized.length ? normalized : null;
}
