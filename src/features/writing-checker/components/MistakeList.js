"use client";

import React, { useState } from "react";
import { Icons } from "@/shared/components/ui/Icons";
import { Tooltip } from "@/shared/components/ui/Tooltip";
import { getMistakeTypeLabel, getMistakeTypeColor, buildCopyText } from "@/lib/utils";

// Bold only the corrected/added parts in the corrected text
function renderCorrectedWithBold(original, corrected) {
  if (!original || !corrected) return corrected;

  // Character-level diff to find what was added/changed
  const s1 = original.toLowerCase();
  const s2 = corrected.toLowerCase();
  
  // Find common prefix
  let prefixLen = 0;
  while (prefixLen < s1.length && prefixLen < s2.length && s1[prefixLen] === s2[prefixLen]) {
    prefixLen++;
  }
  
  // Find common suffix
  let suffixLen = 0;
  while (
    suffixLen < s1.length - prefixLen &&
    suffixLen < s2.length - prefixLen &&
    s1[s1.length - 1 - suffixLen] === s2[s2.length - 1 - suffixLen]
  ) {
    suffixLen++;
  }
  
  // If corrected is just a substring or identical, return as-is
  if (prefixLen + suffixLen >= s2.length) {
    return corrected;
  }
  
  // Extract parts from the actual corrected string (preserving case)
  const prefix = corrected.slice(0, prefixLen);
  const middle = corrected.slice(prefixLen, corrected.length - suffixLen);
  const suffix = corrected.slice(corrected.length - suffixLen);
  
  return (
    <>
      {prefix}
      <strong className="font-bold">{middle}</strong>
      {suffix}
    </>
  );
}

export function MistakeList({ mistakes, studentText, mistakeHighlight, feedback }) {
  const { selectedMistake, setSelectedMistake, mistakeRefs } = mistakeHighlight;
  const [copySuccess, setCopySuccess] = useState(false);

  // Show level-up card only when there are no mistakes
  if (!mistakes || mistakes.length === 0) {
    // LevelUp is now displayed inside the score box (FeedbackDisplay)
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <Icons.AlertCircle className="h-5 w-5 mr-2 text-red-600" />
        改善点リスト
      </h3>

      <div className="space-y-4">
        {mistakes.map((mistake, idx) => (
          <div
            key={idx}
            ref={(el) => (mistakeRefs.current[idx] = el)}
            className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
              selectedMistake === idx ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
            }`}
            onClick={() => {
              setSelectedMistake(idx);
              if (mistakeRefs.current[idx]) {
                mistakeRefs.current[idx].scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMistakeTypeColor(mistake.type)}`}>
                {getMistakeTypeLabel(mistake.type)}
              </span>
              <span className="text-sm font-semibold text-gray-600">#{idx + 1}</span>
            </div>

            <div className="space-y-2 mt-3">
              <div>
                <p className="text-xs text-gray-600 mb-1">✕ 間違い</p>
                <p className="text-base font-medium text-red-600 bg-red-50 px-3 py-2 rounded">
                  {mistake.original}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-600 mb-1">✓ 正しい英語</p>
                <p className="text-base font-medium text-green-600 bg-green-50 px-3 py-2 rounded">
                  {renderCorrectedWithBold(mistake.original, mistake.corrected)}
                </p>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-800"><strong>説明:</strong> {mistake.explanation}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Copy button at the bottom-right of the mistake list card */}
      <div className="mt-4 flex justify-end">
        <Tooltip content={copySuccess ? 'コピーしました！' : 'フィードバックをコピー'} showDelay={100} hideDelay={100} position="top-right">
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(buildCopyText(studentText, feedback || { mistakes }));
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
              } catch (err) {
                console.error("Failed to copy:", err);
              }
            }}
            className={`flex items-center justify-center px-3 py-3 rounded-lg transition-colors font-medium border ${
              copySuccess
                ? 'bg-green-600 hover:bg-green-700 text-white border-green-700'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-300'
            }`}
            aria-label={copySuccess ? 'コピーしました！' : 'フィードバックをコピー'}
          >
            <Icons.Copy className="h-5 w-5" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}