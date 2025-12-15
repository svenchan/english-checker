"use client";

import type { HighlightToken } from "../types/highlightTokens.js";

type HighlightedTextProps = {
  tokens: HighlightToken[];
  activeMistakeId?: string | null;
  onMistakeClick?: (mistakeId: string) => void;
  className?: string;
};

export function HighlightedText({ tokens, activeMistakeId, onMistakeClick, className }: HighlightedTextProps) {
  if (!tokens || tokens.length === 0) {
    return <span className={className} />;
  }

  return (
    <span className={className}>
      {tokens.map((token, index) => {
        if (token.kind === "mistake") {
          const isActive = Boolean(activeMistakeId && activeMistakeId === token.mistakeId);
          return (
            <button
              key={`mistake-${token.mistakeId}-${index}`}
              type="button"
              data-mistake-id={token.mistakeId}
              data-highlight-category={token.category || undefined}
              onClick={() => onMistakeClick?.(token.mistakeId)}
              className={`inline border-none px-1 rounded transition-colors whitespace-pre-wrap focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                isActive ? "bg-blue-200 text-blue-900" : "bg-red-200 text-red-900 hover:bg-red-300"
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
