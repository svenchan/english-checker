// components/checker/FeedbackDisplay.js
"use client";

import { useState } from "react";
import { getScoreColor, buildCopyText } from "@/lib/utils";
import { CHECKER_MODES, TEST_MODE } from "@/config/testMode";
import { Icons } from "@/shared/components/ui/Icons";
import { Tooltip } from "@/shared/components/ui/Tooltip";
import { HighlightedText } from "./HighlightedText";
import { countEffectiveWords, countSentences } from "@/lib/wordCount";

export function FeedbackDisplay({ feedback, studentText, mistakeHighlight, mode = CHECKER_MODES.PRACTICE }) {
  const { tokens, handleHighlightClick, selectedMistakeId } = mistakeHighlight;

  const hasNoMistakes = (feedback?.mistakes?.length || 0) === 0;
  const isTooShort = feedback?.status === "too_short";
  const scoreColor = isTooShort
    ? "text-amber-700 bg-amber-100"
    : getScoreColor(feedback.overallScore);
  const scoreDisplay = isTooShort ? "未採点" : `${feedback.overallScore}点`;
  const summaryText = isTooShort
    ? "15語未満のため採点できませんでした。"
    : hasNoMistakes
      ? "完璧です!間違いはありません。"
      : `${feedback.mistakes.length}個の改善点が見つかりました。`;
  const tooShortMessage =
    isTooShort &&
    (feedback?.improvementSummary ||
      feedback?.pointsForImprovement?.[0] ||
      TEST_MODE.tooShortMessage);
  const [copySuccess, setCopySuccess] = useState(false);
  const isTestMode = mode === CHECKER_MODES.TEST;
  const wordCount = countEffectiveWords(studentText || "");
  const sentenceCount = countSentences(studentText || "");
  const meetsWordTarget = wordCount >= 25;
  const wordBadgeClasses = meetsWordTarget
    ? "bg-green-100 text-green-800 border-green-200"
    : "bg-red-100 text-red-800 border-red-200";
  const meetsSentenceTarget = sentenceCount >= 3;
  const sentenceBadgeClasses = meetsSentenceTarget
    ? "bg-green-100 text-green-800 border-green-200"
    : "bg-red-100 text-red-800 border-red-200";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className={`px-6 py-3 rounded-lg text-2xl font-bold ${scoreColor}`}>
          {scoreDisplay}
        </div>
        <div className="min-w-[200px]">
          <p className="text-sm text-gray-600">{summaryText}</p>
        </div>
        {isTestMode && (
          <div className="flex items-center gap-2 ml-auto">
            <span
              className={`text-sm font-semibold px-3 py-1 rounded-full border ${wordBadgeClasses}`}
              title="テストモードでは25語以上を目指しましょう"
            >
              {wordCount}語
            </span>
            <span
              className={`text-sm font-semibold px-3 py-1 rounded-full border ${sentenceBadgeClasses}`}
              title="テストモードでは3文以上を目指しましょう"
            >
              {sentenceCount}文
            </span>
          </div>
        )}
      </div>

      {tooShortMessage && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {tooShortMessage}
        </div>
      )}

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

      {!hasNoMistakes && !isTooShort && (
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
