"use client";

import { CHECKER_MODES } from "@/config/testMode";

const PREVIEW_LENGTH = 72;

function truncateText(value, max = PREVIEW_LENGTH) {
  const text = (value || "").replace(/\s+/g, " ").trim();
  if (!text) return "(テキストなし)";
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function modeLabel(mode) {
  return mode === CHECKER_MODES.TEST ? "テスト" : "練習";
}

export function SubmissionSidebar({ checks, selectedId, onSelect }) {
  if (!checks.length) {
    return <p className="px-4 py-6 text-sm text-gray-500">提出がまだありません。</p>;
  }

  return (
    <ul className="space-y-2 p-2">
      {checks.map((check) => {
        const isSelected = check.id === selectedId;
        return (
          <li key={check.id}>
            <button
              type="button"
              onClick={() => onSelect(check.id)}
              className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                isSelected
                  ? "border-blue-600 bg-blue-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
                <time dateTime={check.createdAt}>{formatDate(check.createdAt)}</time>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 font-medium ${
                    check.mode === CHECKER_MODES.TEST
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {modeLabel(check.mode)}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-gray-900 line-clamp-3 leading-snug">
                {truncateText(check.studentText)}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
