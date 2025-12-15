import { normalizeText } from "../../../lib/normalizeText.ts";
import type { HighlightSpan, HighlightToken } from "../types/highlightTokens";

type InternalSpan = HighlightSpan & {
  start: number;
  end: number;
};

const START_ASC_END_DESC = (a: InternalSpan, b: InternalSpan) => {
  if (a.start === b.start) {
    if (a.end === b.end) {
      return a.id.localeCompare(b.id);
    }
    return b.end - a.end;
  }

  return a.start - b.start;
};

export function tokenizeHighlight(text: string | undefined, spans: HighlightSpan[] = []): HighlightToken[] {
  const normalizedText = normalizeText(text);
  const maxLength = normalizedText.length;

  if (!maxLength) {
    return [];
  }

  const processedSpans = spans
    .map((span) => {
      const start = clampIndex(span.start, maxLength);
      const end = clampIndex(span.end, maxLength);

      if (!Number.isFinite(start) || !Number.isFinite(end)) {
        return null;
      }

      const safeStart = Math.max(0, Math.min(start, end));
      const safeEnd = Math.max(0, Math.max(start, end));

      if (safeStart >= safeEnd) {
        return null;
      }

      return { ...span, start: safeStart, end: safeEnd } as InternalSpan;
    })
    .filter((span): span is InternalSpan => Boolean(span))
    .sort(START_ASC_END_DESC);

  if (!processedSpans.length) {
    return [{ kind: "text", value: normalizedText }];
  }

  const tokens: HighlightToken[] = [];
  let cursor = 0;

  processedSpans.forEach((span) => {
    if (span.start < cursor) {
      return;
    }

    if (span.start > cursor) {
      tokens.push({
        kind: "text",
        value: normalizedText.slice(cursor, span.start)
      });
    }

    tokens.push({
      kind: "mistake",
      value: normalizedText.slice(span.start, span.end),
      mistakeId: span.id,
      category: span.category
    });

    cursor = span.end;
  });

  if (cursor < maxLength) {
    tokens.push({
      kind: "text",
      value: normalizedText.slice(cursor)
    });
  }

  return tokens;
}

function clampIndex(value: number, max: number) {
  if (!Number.isFinite(value)) {
    return NaN;
  }

  if (value < 0) {
    return 0;
  }

  if (value > max) {
    return max;
  }

  return value;
}
