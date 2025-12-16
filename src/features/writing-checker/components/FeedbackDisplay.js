// components/checker/FeedbackDisplay.js
"use client";

import { useState } from "react";
import { getScoreColor, buildCopyText } from "@/lib/utils";
import { Icons } from "@/shared/components/ui/Icons";
import { Tooltip } from "@/shared/components/ui/Tooltip";
import { HighlightedText } from "./HighlightedText";

export function FeedbackDisplay({ feedback, studentText, mistakeHighlight }) {
  const { tokens, handleHighlightClick, selectedMistakeId } = mistakeHighlight;

  const hasNoMistakes = (feedback?.mistakes?.length || 0) === 0;
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

      {!hasNoMistakes && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            間違いをチェック(赤い部分をクリック)
          </h3>
          <div className="p-4 bg-gray-50 rounded-lg text-lg leading-relaxed border border-gray-200 whitespace-pre-wrap break-words">
            {tokens && tokens.length > 0 ? (
              <HighlightedText
                tokens={tokens}
                activeMistakeId={selectedMistakeId}
                onMistakeClick={handleHighlightClick}
              />
            ) : (
              <span>{studentText || ""}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
