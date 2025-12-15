const CR_REGEX = /\r\n?/g;
const NBSP_REGEX = /\u00A0/g;

export function normalizeText(input?: string | null) {
  if (typeof input !== "string" || input.length === 0) {
    return "";
  }

  return input.replace(CR_REGEX, "\n").replace(NBSP_REGEX, " ");
}
