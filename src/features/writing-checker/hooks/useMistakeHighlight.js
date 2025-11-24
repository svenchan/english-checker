// hooks/useMistakeHighlight.js
"use client";

import { useState, useRef } from "react";
import { sanitizeForRegex } from "@/lib/utils";

export function useMistakeHighlight(studentText, mistakes) {
  const [selectedMistake, setSelectedMistake] = useState(null);
  const mistakeRefs = useRef({});

  const highlightMistakes = () => {
    if (!mistakes || !mistakes.length) return studentText || "";

    let highlightedText = studentText;
    const sortedMistakes = [...mistakes].sort((a, b) => b.original.length - a.original.length);
    
    sortedMistakes.forEach((mistake, idx) => {
      if (!mistake.original) return;
      const regex = new RegExp(sanitizeForRegex(mistake.original), "gi");
      highlightedText = highlightedText.replace(
        regex,
        `<span class="bg-red-200 cursor-pointer hover:bg-red-300 transition-colors rounded px-1" data-mistake-id="${idx}">${mistake.original}</span>`
      );
    });

    return highlightedText;
  };

  const handleTextClick = (e) => {
    const mistakeId = e.target.getAttribute("data-mistake-id");
    if (mistakeId !== null) {
      const id = parseInt(mistakeId, 10);
      setSelectedMistake(id);
      if (mistakeRefs.current[id]) {
        mistakeRefs.current[id].scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  return {
    selectedMistake,
    setSelectedMistake,
    mistakeRefs,
    highlightMistakes,
    handleTextClick
  };
}