"use client";

import type { HighlightToken } from "../types/highlightTokens.js";

type HighlightedTextProps = {
  tokens: HighlightToken[];
  activeMistakeId?: string | null;
  onMistakeClick?: (mistakeId: string) => void;
  className?: string;
  appearance?: "pill" | "underline";
  activeTone?: "blue" | "red";
};

export function HighlightedText({
  tokens,
  activeMistakeId,
  onMistakeClick,
  className,
  appearance = "pill",
  activeTone = "blue"
}: HighlightedTextProps) {
  if (!tokens || tokens.length === 0) {
    return <span className={className} />;
  }

  return (
    <span className={className}>
      {tokens.map((token, index) => {
        if (token.kind === "mistake") {
          const isActive = Boolean(activeMistakeId && activeMistakeId === token.mistakeId);
          const pillClass = isActive
            ? "bg-blue-200 text-blue-900"
            : "bg-red-200 text-red-900 hover:bg-red-300";
          const underlineClass = isActive
            ? activeTone === "red"
              ? "bg-red-100 text-red-950 underline decoration-red-600 decoration-2 underline-offset-4"
              : "bg-sky-100 text-sky-950 underline decoration-red-600 decoration-2 underline-offset-4"
            : "underline decoration-red-500 decoration-2 underline-offset-4 hover:bg-red-50";
          const ringClass = appearance === "underline" && activeTone === "red"
            ? "focus-visible:ring-red-400"
            : "focus-visible:ring-blue-400";
          return (
            <button
              key={`mistake-${token.mistakeId}-${index}`}
              type="button"
              data-mistake-id={token.mistakeId}
              data-highlight-category={token.category || undefined}
              onClick={() => onMistakeClick?.(token.mistakeId)}
              className={`inline border-none whitespace-pre-wrap transition-colors focus:outline-none focus-visible:ring-2 ${ringClass} ${
                appearance === "underline"
                  ? `cursor-pointer rounded-sm px-0.5 ${underlineClass}`
                  : `rounded px-1 ${pillClass}`
              }`}
            >
              {token.value}
            </button>
          );
        }

        return (
          <span key={`text-${index}`}>
            {token.value}
          </span>
        );
      })}
    </span>
  );
}
