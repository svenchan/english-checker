// hooks/useMistakeHighlight.js
"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { normalizeText } from "@/lib/normalizeText";
import { tokenizeHighlight } from "../lib/tokenizeHighlight";

export function useMistakeHighlight(studentText, mistakes) {
  const [selectedMistakeId, setSelectedMistakeId] = useState(null);
  const mistakeRefs = useRef({});

  const highlightModel = useMemo(() => {
    const mistakeList = Array.isArray(mistakes) ? mistakes : [];
    const normalizedText = normalizeText(studentText || "");
    const { spans, idsByIndex } = deriveHighlightSpans(normalizedText, mistakeList);
    const tokens = normalizedText
      ? tokenizeHighlight(normalizedText, spans)
      : [];

    return {
      normalizedText,
      spans,
      tokens,
      idsByIndex
    };
  }, [studentText, mistakes]);

  useEffect(() => {
    setSelectedMistakeId(null);
    mistakeRefs.current = {};
  }, [studentText, mistakes]);

  const handleHighlightClick = useCallback(
    (mistakeId) => {
      if (!mistakeId) {
        return;
      }

      setSelectedMistakeId(mistakeId);
      const target = mistakeRefs.current[mistakeId];
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    },
    []
  );

  const getMistakeIdForIndex = useCallback(
    (index) => highlightModel.idsByIndex[index] ?? String(index),
    [highlightModel.idsByIndex]
  );

  return {
    selectedMistakeId,
    setSelectedMistakeId,
    mistakeRefs,
    tokens: highlightModel.tokens,
    handleHighlightClick,
    getMistakeIdForIndex
  };
}

function deriveHighlightSpans(baseText, mistakes) {
  const idsByIndex = [];
  const spans = [];
  const substringEntries = [];
  const length = baseText.length;
  const lowerText = baseText.toLowerCase();

  mistakes.forEach((mistake, idx) => {
    const id = getMistakeIdentifier(mistake, idx);
    const category = mistake?.type;
    idsByIndex[idx] = id;

    const explicitRange = readExplicitRange(mistake);
    if (explicitRange) {
      const clamped = clampRange(explicitRange, length);
      if (clamped) {
        spans.push({ id, category, ...clamped });
      }
      return;
    }

    const normalizedOriginal = normalizeText(mistake?.original || "");
    if (!normalizedOriginal) {
      return;
    }

    substringEntries.push({
      id,
      category,
      needle: normalizedOriginal,
      needleLower: normalizedOriginal.toLowerCase()
    });
  });

  if (length && substringEntries.length) {
    const taken = spans.map((span) => ({ start: span.start, end: span.end }));
    const sortedEntries = substringEntries.sort((a, b) => {
      if (a.needle.length === b.needle.length) {
        return a.id.localeCompare(b.id);
      }
      return b.needle.length - a.needle.length;
    });

    sortedEntries.forEach((entry) => {
      const match = findFirstNonOverlappingMatch(lowerText, entry.needleLower, taken);
      if (match) {
        spans.push({
          id: entry.id,
          category: entry.category,
          start: match.start,
          end: match.end
        });
        taken.push(match);
      }
    });
  }

  return { spans, idsByIndex };
}

function getMistakeIdentifier(mistake, fallbackIndex) {
  if (mistake && typeof mistake === "object") {
    if (typeof mistake.id === "string" && mistake.id.trim()) {
      return mistake.id;
    }
    if (typeof mistake.mistakeId === "string" && mistake.mistakeId.trim()) {
      return mistake.mistakeId;
    }
    if (typeof mistake.index === "number" && Number.isFinite(mistake.index)) {
      return String(mistake.index);
    }
  }

  return String(fallbackIndex);
}

function readExplicitRange(mistake) {
  const start = readNumeric(
    mistake?.start ??
      mistake?.begin ??
      mistake?.position?.start ??
      mistake?.indices?.start
  );
  const end = readNumeric(
    mistake?.end ??
      mistake?.finish ??
      mistake?.position?.end ??
      mistake?.indices?.end
  );

  if (typeof start === "number" && typeof end === "number") {
    return { start, end };
  }

  return null;
}

function readNumeric(value) {
  if (typeof value !== "number") {
    return null;
  }
  if (!Number.isFinite(value)) {
    return null;
  }
  return value;
}

function clampRange(range, max) {
  const start = clampIndex(range.start, max);
  const end = clampIndex(range.end, max);

  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
    return null;
  }

  return { start, end };
}

function clampIndex(value, max) {
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

function findFirstNonOverlappingMatch(baseLowerText, needleLowerText, taken) {
  if (!needleLowerText) {
    return null;
  }

  let cursor = 0;
  const maxIndex = baseLowerText.length - needleLowerText.length;

  while (cursor <= maxIndex) {
    const matchIndex = baseLowerText.indexOf(needleLowerText, cursor);
    if (matchIndex === -1) {
      break;
    }

    const candidate = { start: matchIndex, end: matchIndex + needleLowerText.length };
    const overlaps = taken.some((occupied) => rangesOverlap(candidate, occupied));
    if (!overlaps) {
      return candidate;
    }

    cursor = matchIndex + 1;
  }

  return null;
}

function rangesOverlap(a, b) {
  return a.start < b.end && b.start < a.end;
}
