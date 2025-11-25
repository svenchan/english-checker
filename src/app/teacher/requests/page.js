"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { Header } from "@/features/writing-checker/components/Header";
import { useRequestLogs } from "@/features/teacher-requests/hooks/useRequestLogs";
import { RequestList } from "@/features/teacher-requests/components/RequestList";
import { RequestDetail } from "@/features/teacher-requests/components/RequestDetail";
import { CLASSROOM_CODES } from "@/config/classroomCodes";

export default function TeacherRequestsPage() {
  const { classCode, isAuthenticated, login, logout, error, isLoading } = useAuth();
  const [classFilters, setClassFilters] = useState([]);
  const filterOptions = useMemo(
    () => CLASSROOM_CODES.map((code) => ({ value: code, label: code })),
    []
  );
  const {
    logs,
    selectedLog,
    selectLog,
    isLoading: isLogsLoading,
    error: logsError,
    reload
  } = useRequestLogs(classCode, { limit: 100, classFilters });

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} error={error} isLoading={isLoading} />;
  }

  if (classCode !== "TEACHER") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center p-8 space-y-4">
        <div>
          <p className="text-sm text-gray-500">アクセス権限がありません</p>
          <h1 className="text-2xl font-semibold text-gray-900 mt-2">このページは教師専用です</h1>
          <p className="text-gray-600 mt-4">教師用クラスコードでログインすると提出履歴を確認できます。</p>
        </div>
        <Link href="/" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors">
          チェッカーに戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <Header classCode={classCode} onLogout={logout} />
      <main className="flex-1 p-6 flex flex-col gap-6 overflow-hidden min-h-0">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div>
            <p className="text-sm text-gray-500">教師ビュー</p>
            <h1 className="text-2xl font-bold text-gray-900">提出リクエスト一覧</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={reload}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              disabled={isLogsLoading}
            >
              {isLogsLoading ? "更新中..." : "再読み込み"}
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-500 transition-colors"
            >
              チェッカーに戻る
            </Link>
          </div>
        </div>

        {logsError && (
          <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
            {logsError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-6 flex-1 min-h-0 overflow-hidden">
          <RequestList
            entries={logs}
            selectedId={selectedLog?.id}
            onSelect={selectLog}
            isLoading={isLogsLoading}
            filterOptions={filterOptions}
            selectedFilters={classFilters}
            onFilterChange={setClassFilters}
          />
          <RequestDetail entry={selectedLog} />
        </div>
      </main>
    </div>
  );
}
