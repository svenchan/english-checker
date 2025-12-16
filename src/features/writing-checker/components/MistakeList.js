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
  const {
    selectedMistakeId,
    setSelectedMistakeId,
    mistakeRefs,
    getMistakeIdForIndex
  } = mistakeHighlight;
  const [copySuccess, setCopySuccess] = useState(false);
  const topicFeedback = feedback?.topicFeedback;
  const checklistEntries = [
    { key: "point", label: "P: 主張" },
    { key: "reason", label: "R: 理由" },
    { key: "evidence", label: "E: 具体例" },
    { key: "pointSummary", label: "P: まとめ" }
  ];
  const prepChecklist = topicFeedback?.prepChecklist || {};
  const hasTopicFeedback =
    !!(
      topicFeedback &&
      (
        topicFeedback.onTopicSummary?.trim() ||
        topicFeedback.improvementTips?.trim() ||
        checklistEntries.some(({ key }) => prepChecklist[key])
      )
    );

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

      {hasTopicFeedback && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center mb-3">
            <Icons.BookOpen className="h-5 w-5 mr-2 text-blue-600" />
            <h4 className="text-base font-semibold text-blue-900">テーマへの回答フィードバック</h4>
          </div>
          {topicFeedback.onTopicSummary && (
            <p className="text-sm text-gray-800 mb-3 whitespace-pre-wrap break-words">
              {topicFeedback.onTopicSummary}
            </p>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {checklistEntries.map(({ key, label }) => {
              const entry = prepChecklist[key];
              if (!entry) return null;
              const baseClasses = entry.met
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800";
              const badgeClasses = entry.met ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800";

              return (
                <div key={key} className={`rounded-md p-3 border ${baseClasses}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold">{label}</p>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${badgeClasses}`}>
                      {entry.met ? "達成" : "要改善"}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {entry.note || (entry.met ? "基準を満たしています。" : "改善点を確認しましょう。")}
                  </p>
                </div>
              );
            })}
          </div>
          {topicFeedback.improvementTips && (
            <div className="mt-3 rounded-md bg-white p-3 border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 mb-1">改善のヒント</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                {topicFeedback.improvementTips}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {mistakes.map((mistake, idx) => {
          const mistakeId = getMistakeIdForIndex(idx);
          return (
            <div
              key={mistakeId}
              ref={(el) => {
                if (el) {
                  mistakeRefs.current[mistakeId] = el;
                } else {
                  delete mistakeRefs.current[mistakeId];
                }
              }}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                selectedMistakeId === mistakeId ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
              }`}
              onClick={() => {
                setSelectedMistakeId(mistakeId);
                if (mistakeRefs.current[mistakeId]) {
                  mistakeRefs.current[mistakeId].scrollIntoView({ behavior: "smooth", block: "center" });
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
                <p className="text-base font-medium text-red-600 bg-red-50 px-3 py-2 rounded whitespace-pre-wrap break-words">
                  {mistake.original}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-600 mb-1">✓ 正しい英語</p>
                <p className="text-base font-medium text-green-600 bg-green-50 px-3 py-2 rounded whitespace-pre-wrap break-words">
                  {renderCorrectedWithBold(mistake.original, mistake.corrected)}
                </p>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                  <strong>説明:</strong> {mistake.explanation}
                </p>
              </div>
            </div>
            </div>
          );
        })}
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
