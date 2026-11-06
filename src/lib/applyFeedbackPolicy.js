import { scoreFromMistakes } from "./score.js";
import { findServerMistakes } from "./surfaceRules.js";

/**
 * Add server-owned mistakes and drop a model mistake only when its edit
 * is exactly one of those rules. A wider rewrite keeps the model mistake
 * and suppresses the server mistake on the same span.
 * @param {string} text
 * @param {object} feedback
 */
export function applyFeedbackPolicy(text, feedback) {
  const source = typeof text === "string" ? text : "";
  const base = feedback && typeof feedback === "object" ? feedback : {};
  const modelMistakes = Array.isArray(base.mistakes) ? base.mistakes : [];
  const serverMistakes = findServerMistakes(source);
  const suppressed = new Set();
  const usedSpans = [];
  const keptModel = [];

  for (const mistake of modelMistakes) {
    const original = mistake?.original || "";
    const corrected = mistake?.corrected || "";
    const span = findNextUnusedSpan(source, original, usedSpans);
    if (span) {
      usedSpans.push(span);
    }

    const overlapping = serverMistakes
      .map((server, index) => ({ server, index }))
      .filter(({ server, index }) => {
        if (suppressed.has(index)) {
          return false;
        }
        if (span && rangesOverlap(span, server)) {
          return true;
        }
        return !span && server.original === original;
      });

    const overlappingMistakes = overlapping.map(({ server }) => server);
    if (overlapping.length > 0 && isExactServerEdit(original, span, overlappingMistakes, corrected)) {
      continue;
    }

    if (overlapping.length > 0) {
      for (const { index } of overlapping) {
        suppressed.add(index);
      }
    }

    keptModel.push(span ? { ...mistake, start: span.start, end: span.end } : mistake);
  }

  const mistakes = [
    ...serverMistakes.filter((_, index) => !suppressed.has(index)),
    ...keptModel
  ].sort(byStart);

  return {
    ...base,
    mistakes,
    overallScore: scoreFromMistakes(mistakes)
  };
}

function isExactServerEdit(original, span, overlapping, corrected) {
  if (!original || !corrected || original === corrected) {
    return false;
  }
  if (!span) {
    return overlapping.length === 1
      && overlapping[0].original === original
      && overlapping[0].corrected === corrected;
  }

  const ordered = [...overlapping].sort((a, b) => b.start - a.start);
  let result = original;
  for (const mistake of ordered) {
    const localStart = mistake.start - span.start;
    const localEnd = mistake.end - span.start;
    if (localStart < 0 || localEnd > result.length) {
      return false;
    }
    if (result.slice(localStart, localEnd) !== mistake.original) {
      return false;
    }
    result = result.slice(0, localStart) + mistake.corrected + result.slice(localEnd);
  }
  return result === corrected;
}

function findNextUnusedSpan(text, needle, usedSpans) {
  if (!text || !needle) {
    return null;
  }

  let from = 0;
  while (from <= text.length) {
    const start = text.indexOf(needle, from);
    if (start === -1) {
      return null;
    }
    const span = { start, end: start + needle.length };
    if (!usedSpans.some((used) => rangesOverlap(used, span))) {
      return span;
    }
    from = start + 1;
  }

  return null;
}

function rangesOverlap(a, b) {
  return a.start < b.end && b.start < a.end;
}

function byStart(a, b) {
  const aStart = Number.isFinite(a?.start) ? a.start : Number.MAX_SAFE_INTEGER;
  const bStart = Number.isFinite(b?.start) ? b.start : Number.MAX_SAFE_INTEGER;
  if (aStart !== bStart) {
    return aStart - bStart;
  }
  return 0;
}
