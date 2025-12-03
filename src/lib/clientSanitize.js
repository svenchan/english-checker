"use client";

const SCRIPT_STYLE_CONTENT_REGEX = /<(script|style)[^>]*>[\s\S]*?<\/\1>/gi;
const HTML_TAG_REGEX = /<[^>]+>/g;

const CONTROL_CHAR_REGEX = /[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g;

function normalizeWhitespace(str = "") {
  return str
    .replace(CONTROL_CHAR_REGEX, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00A0/g, " ");
}

function stripHtmlTags(str) {
  return str
    .replace(SCRIPT_STYLE_CONTENT_REGEX, " ")
    .replace(HTML_TAG_REGEX, " ");
}

export function sanitizeClientInput(value, config = {}) {
  if (value === undefined || value === null) {
    return "";
  }

  const { trim = false } = config;
  const stringValue = String(value);

  const sanitized = stripHtmlTags(stringValue);
  const normalized = normalizeWhitespace(sanitized);
  return trim ? normalized.trim() : normalized;
}
