// components/checker/FeedbackDisplay.js
"use client";

import { getScoreColor } from "@/lib/utils";

export function FeedbackDisplay({ feedback, studentText, mistakeHighlight }) {
  const { highlightMistakes, handleTextClick } = mistakeHighlight;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-4 mb-6">
        <div className={`px-6 py-3 rounded-lg text-2xl font-bold ${getScoreColor(feedback.overallScore)}`}>
          {feedback.overallScore}点
        </div>
        <div>
          <p className="text-sm text-gray-600">
            {feedback.mistakes.length === 0
              ? "完璧です!間違いはありません。"
              : `${feedback.mistakes.length}個の改善点が見つかりました。`}
          </p>
        </div>
      </div>

      {feedback.mistakes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            間違いをチェック(赤い部分をクリック)
          </h3>
          <div
            className="p-4 bg-gray-50 rounded-lg text-lg leading-relaxed border border-gray-200"
            dangerouslySetInnerHTML={{ __html: highlightMistakes() }}
            onClick={handleTextClick}
          />
        </div>
      )}
    </div>
  );
}