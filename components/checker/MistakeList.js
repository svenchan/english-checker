"use client";

import React from "react";
import { Icons } from "@/components/ui/Icons";
import { getMistakeTypeLabel, getMistakeTypeColor } from "@/lib/utils";

export function MistakeList({ mistakes, levelUp, studentText, mistakeHighlight }) {
  const { selectedMistake, setSelectedMistake, mistakeRefs } = mistakeHighlight;

  // Show level-up card only when there are no mistakes
  if (!mistakes || mistakes.length === 0) {
    if (!levelUp) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="p-4 rounded-lg border-2 border-green-500 bg-green-50">
          <div className="flex items-start mb-2">
            <Icons.TrendingUp className="h-5 w-5 mr-2 text-green-600 mt-0.5" />
            <h4 className="text-base font-semibold text-green-800">レベルアップ</h4>
          </div>
          <p className="text-sm text-gray-800 mt-2 leading-relaxed">{levelUp}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
                <p className="text-base font-medium text-red-600 bg-red-50 px-3 py-2 rounded">{mistake.original}</p>
              </div>

              <div>
                <p className="text-xs text-gray-600 mb-1">✓ 正しい英語</p>
                <p className="text-base font-medium text-green-600 bg-green-50 px-3 py-2 rounded">{mistake.corrected}</p>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-800"><strong>説明:</strong> {mistake.explanation}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}