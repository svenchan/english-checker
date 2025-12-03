// hooks/useMistakeHighlight.js
"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { sanitizeForRegex } from "@/lib/utils";

export function useMistakeHighlight(studentText, mistakes) {
  const [selectedMistake, setSelectedMistake] = useState(null);
  const mistakeRefs = useRef({});

  const highlightedSegments = useMemo(() => {
    const baseText = studentText || "";
    const mistakeList = Array.isArray(mistakes) ? mistakes : [];

    if (!baseText || !mistakeList.length) {
      return baseText ? [{ type: "text", text: baseText }] : [];
    }

    const matches = [];

    mistakeList
      .map((mistake, idx) => ({ ...mistake, idx }))
      .filter((mistake) => mistake.original)
      .sort((a, b) => (b.original?.length || 0) - (a.original?.length || 0))
      .forEach((mistake) => {
        const regex = new RegExp(sanitizeForRegex(mistake.original), "gi");
        let match;
        while ((match = regex.exec(baseText)) !== null) {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            text: baseText.slice(match.index, match.index + match[0].length),
            mistakeId: mistake.idx
          });

          // Avoid infinite loops on zero-width matches
          if (match.index === regex.lastIndex) {
            regex.lastIndex++;
          }
        }
      });

    if (!matches.length) {
      return [{ type: "text", text: baseText }];
    }

    matches.sort((a, b) => {
      if (a.start === b.start) {
        return b.end - a.end;
      }
      return a.start - b.start;
    });

    const segments = [];
    let cursor = 0;

    matches.forEach((match) => {
      if (match.start < cursor) {
        return; // skip overlaps that were already consumed by longer matches
      }

      if (match.start > cursor) {
        segments.push({ type: "text", text: baseText.slice(cursor, match.start) });
      }

      segments.push({ type: "mistake", text: match.text, mistakeId: match.mistakeId });
      cursor = match.end;
    });

    if (cursor < baseText.length) {
      segments.push({ type: "text", text: baseText.slice(cursor) });
    }

    return segments;
  }, [studentText, mistakes]);

  useEffect(() => {
    setSelectedMistake(null);
    mistakeRefs.current = {};
  }, [studentText, mistakes]);

  const handleHighlightClick = useCallback(
    (mistakeId) => {
      if (typeof mistakeId !== "number" || Number.isNaN(mistakeId)) {
        return;
      }

      setSelectedMistake(mistakeId);
      const target = mistakeRefs.current[mistakeId];
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    },
    [mistakeRefs]
  );

  return {
    selectedMistake,
    setSelectedMistake,
    mistakeRefs,
    highlightedSegments,
    handleHighlightClick
  };
}