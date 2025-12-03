import sanitizeHtml from "sanitize-html";

const BASE_OPTIONS = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: "discard",
};

function normalizeWhitespace(str = "") {
  return str
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00A0/g, " ")
    .trim();
}

export function sanitizeInput(value, options = {}) {
  if (value === undefined || value === null) {
    return "";
  }

  const sanitized = sanitizeHtml(String(value), {
    ...BASE_OPTIONS,
    ...options,
  });

  return normalizeWhitespace(sanitized);
}

export function sanitizeClassCode(value) {
  const sanitized = sanitizeInput(value);
  return sanitized ? sanitized.toUpperCase() : "";
}
