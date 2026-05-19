"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CHECKER_MODES } from "@/config/testMode";
import { Header } from "@/features/writing-checker/components/Header";
import { SubmissionSidebar } from "./SubmissionSidebar";
import { CheckerReplay } from "./CheckerReplay";

const FILTERS = [
  { id: "all", label: "すべて" },
  { id: CHECKER_MODES.PRACTICE, label: "練習" },
  { id: CHECKER_MODES.TEST, label: "テスト" }
];

export function TeacherPageClient({
  checks,
  initialSelectedId,
  filter,
  loadError,
  disabled
}) {
  const [selectedId, setSelectedId] = useState(() => {
    if (initialSelectedId && checks.some((c) => c.id === initialSelectedId)) {
      return initialSelectedId;
    }
    return checks[0]?.id ?? null;
  });

  useEffect(() => {
    if (!checks.length) {
      setSelectedId(null);
      return;
    }
    if (!checks.some((check) => check.id === selectedId)) {
      setSelectedId(checks[0].id);
    }
  }, [checks, selectedId]);

  const selectedCheck = useMemo(
    () => checks.find((check) => check.id === selectedId) ?? null,
    [checks, selectedId]
  );

  const headerMode = selectedCheck?.mode === CHECKER_MODES.TEST ? CHECKER_MODES.TEST : CHECKER_MODES.PRACTICE;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col h-screen">
      <Header mode={headerMode} />
      <div className="flex flex-1 min-h-0">
        <aside className="w-80 shrink-0 border-r border-gray-200 bg-white flex flex-col min-h-0">
          <div className="shrink-0 border-b border-gray-200 px-4 py-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-gray-900">提出履歴</h2>
                <p className="text-xs text-gray-500 mt-0.5">直近20件</p>
              </div>
              <Link
                href="/"
                className="text-xs font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap"
              >
                チェッカーへ
              </Link>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((option) => {
                const isActive = option.id === filter;
                const href = option.id === "all" ? "/teacher" : `/teacher?mode=${option.id}`;
                return (
                  <Link
                    key={option.id}
                    href={href}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    {option.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {disabled ? (
              <p className="px-4 py-6 text-sm text-gray-500">
                データベースが設定されていません。DATABASE_URL を確認してください。
              </p>
            ) : loadError ? (
              <p className="px-4 py-6 text-sm text-red-600">提出履歴を読み込めません。</p>
            ) : (
              <SubmissionSidebar
                checks={checks}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            )}
          </div>
        </aside>

        <main className="flex-1 min-h-0 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {disabled || loadError ? (
              <p className="text-sm text-gray-500 py-12 text-center">
                {disabled
                  ? "提出を表示できません。"
                  : "提出を読み込めませんでした。"}
              </p>
            ) : checks.length === 0 ? (
              <p className="text-sm text-gray-500 py-12 text-center">提出がまだありません。</p>
            ) : (
              <CheckerReplay check={selectedCheck} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
