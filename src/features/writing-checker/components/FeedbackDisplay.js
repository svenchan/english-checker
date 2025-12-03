// components/checker/FeedbackDisplay.js
"use client";

import { useState } from "react";
import { getScoreColor, buildCopyText } from "@/lib/utils";
import { Icons } from "@/shared/components/ui/Icons";
import { Tooltip } from "@/shared/components/ui/Tooltip";

export function FeedbackDisplay({ feedback, studentText, mistakeHighlight }) {
  const { highlightedSegments, handleHighlightClick, selectedMistake } = mistakeHighlight;

  const hasNoMistakes = (feedback?.mistakes?.length || 0) === 0;
  const levelUp = feedback?.levelUp;
  const [copySuccess, setCopySuccess] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-4 mb-6">
        <div className={`px-6 py-3 rounded-lg text-2xl font-bold ${getScoreColor(feedback.overallScore)}`}>
          {feedback.overallScore}点
        </div>
        <div>
          <p className="text-sm text-gray-600">
            {hasNoMistakes
              ? "完璧です!間違いはありません。"
              : `${feedback.mistakes.length}個の改善点が見つかりました。`}
          </p>
        </div>
      </div>

      {hasNoMistakes && levelUp && (
        <>
          <div className="p-4 rounded-lg border-2 border-green-500 bg-green-50 mb-2">
            <div className="flex items-start mb-2">
              <Icons.TrendingUp className="h-5 w-5 mr-2 text-green-600 mt-0.5" />
              <h4 className="text-base font-semibold text-green-800">レベルアップ</h4>
            </div>
            <p className="text-sm text-gray-800 mt-2 leading-relaxed">{levelUp}</p>
          </div>
          {/* Copy button below LevelUp, bottom-right of the score box */}
          <div className="mt-2 flex justify-end">
            <Tooltip content={copySuccess ? 'コピーしました！' : 'フィードバックをコピー'} showDelay={100} hideDelay={100} position="top-right">
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(buildCopyText(studentText, feedback));
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
        </>
      )}

      {!hasNoMistakes && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            間違いをチェック(赤い部分をクリック)
          </h3>
          <div className="p-4 bg-gray-50 rounded-lg text-lg leading-relaxed border border-gray-200 whitespace-pre-wrap break-words">
            {highlightedSegments && highlightedSegments.length > 0 ? (
              highlightedSegments.map((segment, index) => {
                if (segment.type === "mistake") {
                  const isActive = selectedMistake === segment.mistakeId;
                  return (
                    <button
                      key={`mistake-${segment.mistakeId}-${index}`}
                      type="button"
                      onClick={() => handleHighlightClick(segment.mistakeId)}
                      className={`inline border-none px-1 rounded transition-colors whitespace-pre-wrap focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                        isActive
                          ? "bg-blue-200 text-blue-900"
                          : "bg-red-200 text-red-900 hover:bg-red-300"
                      }`}
                    >
                      {segment.text}
                    </button>
                  );
                }

                return (
                  <span key={`text-${index}`}>
                    {segment.text}
                  </span>
                );
              })
            ) : (
              <span>{studentText || ""}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}