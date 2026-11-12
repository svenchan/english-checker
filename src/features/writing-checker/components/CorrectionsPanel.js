"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CHECKER_MODES, TEST_MODE } from "@/config/testMode";
import { Icons } from "@/shared/components/ui/Icons";
import { Tooltip } from "@/shared/components/ui/Tooltip";
import { buildCopyText, getMistakeTypeColor, getMistakeTypeLabel, getScoreColor } from "@/lib/utils";
import { countEffectiveWords, countSentences } from "@/lib/wordCount";

const MISTAKE_FILTERS = [
  { id: "all", label: "すべて" },
  { id: "spelling", label: "スペル" },
  { id: "vocabulary", label: "単語" },
  { id: "grammar", label: "文法" },
  { id: "punctuation", label: "句読点" },
  { id: "capitalization", label: "大文字" }
];

function renderCorrectedWithBold(original, corrected) {
  if (!original || !corrected) return corrected;

  const s1 = original.toLowerCase();
  const s2 = corrected.toLowerCase();

  let prefixLen = 0;
  while (prefixLen < s1.length && prefixLen < s2.length && s1[prefixLen] === s2[prefixLen]) {
    prefixLen++;
  }

  let suffixLen = 0;
  while (
    suffixLen < s1.length - prefixLen &&
    suffixLen < s2.length - prefixLen &&
    s1[s1.length - 1 - suffixLen] === s2[s2.length - 1 - suffixLen]
  ) {
    suffixLen++;
  }

  if (prefixLen + suffixLen >= s2.length) {
    return corrected;
  }

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

export function CorrectionsPanel({
  feedback = null,
  studentText = "",
  mistakeHighlight,
  mode = CHECKER_MODES.PRACTICE,
  isChecking = false,
  onSelectMistake
}) {
  const isTestMode = mode === CHECKER_MODES.TEST;
  const panelRef = useRef(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [mistakeFilter, setMistakeFilter] = useState("all");
  const mistakes = feedback?.mistakes || [];
  const hasMistakes = mistakes.length > 0;
  const isTooShort = feedback?.status === "too_short";
  const {
    selectedMistakeId,
    setSelectedMistakeId,
    mistakeRefs,
    getMistakeIdForIndex
  } = mistakeHighlight || {};

  const titleClass = isTestMode ? "text-red-800" : "text-sky-800";
  const mutedClass = isTestMode ? "text-red-700/80" : "text-sky-700/80";
  const selectedCardClasses = isTestMode ? "border-red-500 bg-red-50" : "border-sky-500 bg-sky-50";
  const hoverCardClasses = isTestMode ? "hover:border-red-300" : "hover:border-sky-300";
  const topicCardClass = isTestMode
    ? "border-red-200 bg-red-50"
    : "border-sky-200 bg-sky-50";
  const topicTitleClass = isTestMode ? "text-red-900" : "text-sky-900";
  const topicIconClass = isTestMode ? "text-red-600" : "text-sky-600";
  const tipsBorder = isTestMode ? "border-red-100" : "border-sky-100";
  const tipsTitle = isTestMode ? "text-red-700" : "text-sky-700";

  const scoreColor = !feedback
    ? ""
    : isTooShort
      ? "text-amber-700 bg-amber-100"
      : getScoreColor(feedback.overallScore);
  const scoreDisplay = !feedback ? "" : isTooShort ? "未採点" : `${feedback.overallScore}点`;
  const summaryText = !feedback
    ? ""
    : isTooShort
      ? "15語未満のため採点できませんでした。"
      : hasMistakes
        ? `${mistakes.length}個の改善点が見つかりました。`
        : "完璧です!間違いはありません。";
  const tooShortMessage =
    isTooShort &&
    (feedback?.improvementSummary ||
      feedback?.pointsForImprovement?.[0] ||
      TEST_MODE.tooShortMessage);

  const wordCount = countEffectiveWords(studentText || "");
  const sentenceCount = countSentences(studentText || "");
  const wordBadgeClasses = wordCount >= 25
    ? "bg-green-100 text-green-800 border-green-200"
    : "bg-red-100 text-red-800 border-red-200";
  const sentenceBadgeClasses = sentenceCount >= 3
    ? "bg-green-100 text-green-800 border-green-200"
    : "bg-red-100 text-red-800 border-red-200";

  const topicFeedback = feedback?.topicFeedback;
  const checklistEntries = [
    { key: "point", label: "P: 主張" },
    { key: "reason", label: "R: 理由" },
    { key: "evidence", label: "E: 具体例" },
    { key: "pointSummary", label: "P: まとめ" }
  ];
  const prepChecklist = topicFeedback?.prepChecklist || {};
  const hasTopicFeedback = !!(
    topicFeedback &&
    (
      topicFeedback.onTopicSummary?.trim() ||
      topicFeedback.improvementTips?.trim() ||
      checklistEntries.some(({ key }) => prepChecklist[key])
    )
  );
  const topicContext = typeof feedback?.topicText === "string" ? feedback.topicText.trim() : "";
  const shouldShowTopicFeedback = hasMistakes && hasTopicFeedback && topicContext.length > 0;

  useEffect(() => {
    setMistakeFilter("all");
  }, [feedback]);

  useEffect(() => {
    if (!selectedMistakeId || !panelRef.current) return;
    const escaped = typeof CSS !== "undefined" && typeof CSS.escape === "function"
      ? CSS.escape(selectedMistakeId)
      : String(selectedMistakeId).replace(/"/g, '\\"');
    const card = panelRef.current.querySelector(`[data-mistake-card="${escaped}"]`);
    const scroller = panelRef.current.querySelector("[data-corrections-scroll]");
    if (!card || !scroller) return;
    const scrollerRect = scroller.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const fullyVisible = cardRect.top >= scrollerRect.top && cardRect.bottom <= scrollerRect.bottom;
    if (fullyVisible) return;
    const next = scroller.scrollTop + (cardRect.top - scrollerRect.top) - (scrollerRect.height - cardRect.height) / 2;
    scroller.scrollTo({ top: Math.max(0, next), behavior: "auto" });
  }, [selectedMistakeId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildCopyText(studentText, feedback));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <aside
      ref={panelRef}
      className="flex min-h-0 w-full flex-1 flex-col border-t border-slate-200 bg-white md:w-[340px] md:flex-none md:border-l md:border-t-0"
    >
      <div className="shrink-0 px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <Link href="/" className="flex min-w-0 items-center gap-2 text-black hover:text-slate-700">
            <Icons.BookOpen className="h-7 w-7 shrink-0 text-blue-600" />
            <span className="text-lg font-bold leading-tight">英作文チェッカー</span>
          </Link>
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowInfo((prev) => !prev)}
              className="inline-flex h-8 w-8 items-center justify-center border-0 bg-transparent p-0 text-sky-600 hover:text-sky-800"
              aria-pressed={showInfo}
              aria-label="チェッカーの説明を表示"
            >
              <Icons.Info className="h-5 w-5" />
            </button>
            {showInfo && (
              <div className="absolute right-0 top-full z-20 mt-2 w-[min(280px,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-lg">
                <p className="text-slate-800">
                  英作文をチェックして、つづり・単語・文法の間違いを伝えます。
                </p>
                <p className="mt-2 text-slate-600">
                  このチェッカーはAIを使っています。間違えることがあります。
                </p>
              </div>
            )}
          </div>
        </div>
        {feedback && (
          <div className="mt-4 flex justify-end">
            <Tooltip
              content={copySuccess ? "コピーしました！" : "フィードバックをコピー"}
              showDelay={100}
              hideDelay={100}
              position="top-right"
            >
              <button
                type="button"
                onClick={handleCopy}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border font-medium transition-colors ${
                  copySuccess
                    ? "border-green-700 bg-green-600 text-white hover:bg-green-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
                aria-label={copySuccess ? "コピーしました！" : "フィードバックをコピー"}
              >
                <Icons.Copy className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>
        )}

        {feedback && (
          <div className="mt-3 flex items-center gap-3">
            <div className={`rounded-lg px-3 py-2 text-xl font-bold ${scoreColor}`}>
              {scoreDisplay}
            </div>
            <p className="text-sm text-slate-600">{summaryText}</p>
          </div>
        )}

        {feedback && isTestMode && (
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-sm font-semibold ${wordBadgeClasses}`}
              title="テストモードでは25語以上を目指しましょう"
            >
              {wordCount}語
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-sm font-semibold ${sentenceBadgeClasses}`}
              title="テストモードでは3文以上を目指しましょう"
            >
              {sentenceCount}文
            </span>
          </div>
        )}
      </div>

      <div data-corrections-scroll className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {isChecking && (
          <div className="flex min-h-full flex-col items-center justify-center text-center" role="status">
            <div
              className={`h-8 w-8 animate-spin rounded-full border-b-2 ${
                isTestMode ? "border-red-600" : "border-sky-600"
              }`}
            />
            <p className={`mt-3 text-sm font-medium ${titleClass}`}>チェック中...</p>
          </div>
        )}

        {!isChecking && !feedback && (
          <div className="flex min-h-full flex-col items-center justify-center px-4 text-center">
            <div
              className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
                isTestMode ? "bg-red-100 text-red-600" : "bg-sky-100 text-sky-600"
              }`}
            >
              <Icons.Pen className="h-5 w-5" />
            </div>
            <p className={`text-sm font-medium ${titleClass}`}>改善点はここに表示されます</p>
            <p className={`mt-1 text-sm ${mutedClass}`}>
              {isTestMode
                ? "書き終えたら「提出する」を押してください。"
                : "英文を書いたら「チェックする」を押してください。"}
            </p>
          </div>
        )}

        {!isChecking && feedback && (
          <div className="space-y-4">
            {tooShortMessage && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                {tooShortMessage}
              </div>
            )}

            {!hasMistakes && !isTooShort && (
              <div className="rounded-xl border border-green-200 bg-white p-4 text-sm text-green-800">
                この英文に間違いはありません。
              </div>
            )}

            {hasMistakes && (
              <p className="text-xs text-slate-500">
                左の赤い下線をクリックすると、その説明がここに出ます。
              </p>
            )}

            {shouldShowTopicFeedback && (
              <div className={`rounded-xl border p-4 ${topicCardClass}`}>
                <div className="mb-3 flex items-center">
                  <Icons.BookOpen className={`mr-2 h-5 w-5 ${topicIconClass}`} />
                  <h3 className={`text-sm font-semibold ${topicTitleClass}`}>テーマへの回答フィードバック</h3>
                </div>
                {topicFeedback.onTopicSummary && (
                  <p className="mb-3 whitespace-pre-wrap break-words text-sm text-slate-800">
                    {topicFeedback.onTopicSummary}
                  </p>
                )}
                <div className="grid gap-3">
                  {checklistEntries.map(({ key, label }) => {
                    const entry = prepChecklist[key];
                    if (!entry) return null;
                    const baseClasses = entry.met
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-red-50 border-red-200 text-red-800";
                    const badgeClasses = entry.met
                      ? "bg-green-200 text-green-800"
                      : "bg-red-200 text-red-800";

                    return (
                      <div key={key} className={`rounded-md border p-3 ${baseClasses}`}>
                        <div className="mb-1 flex items-center justify-between">
                          <p className="text-xs font-semibold">{label}</p>
                          <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${badgeClasses}`}>
                            {entry.met ? "達成" : "要改善"}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap break-words text-sm">
                          {entry.note || (entry.met ? "基準を満たしています。" : "改善点を確認しましょう。")}
                        </p>
                      </div>
                    );
                  })}
                </div>
                {topicFeedback.improvementTips && (
                  <div className={`mt-3 rounded-md border bg-white p-3 ${tipsBorder}`}>
                    <p className={`mb-1 text-xs font-semibold ${tipsTitle}`}>改善のヒント</p>
                    <p className="whitespace-pre-wrap break-words text-sm text-slate-800">
                      {topicFeedback.improvementTips}
                    </p>
                  </div>
                )}
              </div>
            )}

            {hasMistakes && (
              <div className="flex flex-wrap gap-2">
                {MISTAKE_FILTERS.map((filter) => {
                  const count = filter.id === "all"
                    ? mistakes.length
                    : mistakes.filter((mistake) => mistake.type === filter.id).length;
                  if (count === 0) return null;
                  const active = mistakeFilter === filter.id;
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setMistakeFilter(filter.id)}
                      aria-pressed={active}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
                        active
                          ? "border-slate-200 bg-slate-100 font-semibold text-slate-900"
                          : "border-slate-200 bg-white font-medium text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <span>{filter.label}</span>
                      <span
                        className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs ${
                          active
                            ? "bg-slate-200 font-semibold text-slate-800"
                            : "border border-slate-200 font-medium text-slate-500"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {hasMistakes && getMistakeIdForIndex && mistakes.map((mistake, idx) => {
              if (mistakeFilter !== "all" && mistake.type !== mistakeFilter) return null;
              const mistakeId = getMistakeIdForIndex(idx);
              const isSelected = selectedMistakeId === mistakeId;
              return (
                <div
                  key={mistakeId}
                  data-mistake-card={mistakeId}
                  ref={(el) => {
                    if (!mistakeRefs) return;
                    if (el) {
                      mistakeRefs.current[mistakeId] = el;
                    } else {
                      delete mistakeRefs.current[mistakeId];
                    }
                  }}
                  className={`cursor-pointer rounded-xl border-2 bg-white p-4 shadow-sm transition-all ${
                    isSelected ? selectedCardClasses : `border-slate-200 ${hoverCardClasses}`
                  }`}
                  onClick={() => {
                    setSelectedMistakeId?.(mistakeId);
                    onSelectMistake?.(mistakeId);
                  }}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getMistakeTypeColor(mistake.type)}`}>
                      {getMistakeTypeLabel(mistake.type)}
                    </span>
                    <span className="text-sm font-semibold text-slate-500">#{idx + 1}</span>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="mb-1 text-xs text-slate-500">✕ 間違い</p>
                      <p className="whitespace-pre-wrap break-words rounded bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                        {mistake.original}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-slate-500">✓ 正しい英語</p>
                      <p className="whitespace-pre-wrap break-words rounded bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
                        {renderCorrectedWithBold(mistake.original, mistake.corrected)}
                      </p>
                    </div>
                    <div className="border-t border-slate-200 pt-2">
                      <p className="whitespace-pre-wrap break-words text-sm text-slate-800">
                        <strong>説明:</strong> {mistake.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
