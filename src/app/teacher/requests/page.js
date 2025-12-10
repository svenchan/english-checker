"use client";

import { useState } from "react";
import { Header } from "@/features/writing-checker/components/Header";
import { useSupabaseSession } from "@/features/auth/hooks/useSupabaseSession";
import { useSupabaseAuthActions } from "@/features/auth/hooks/useSupabaseAuthActions";
import { useOnboardingProfile } from "@/features/auth/hooks/useOnboardingProfile";
import { RequestList } from "@/features/teacher-requests/components/RequestList";
import { RequestDetail } from "@/features/teacher-requests/components/RequestDetail";
import { useRequestLogs } from "@/features/teacher-requests/hooks/useRequestLogs";

export default function TeacherRequestsPage() {
  const { session, user, isLoading: isSessionLoading } = useSupabaseSession();
  const authActions = useSupabaseAuthActions();
  const onboarding = useOnboardingProfile(user);
  const [classFilters, setClassFilters] = useState([]);

  const accessToken = session?.access_token || null;
  const isTeacher = Boolean(onboarding.role === "teacher" && onboarding.teacherId);

  const logsState = useRequestLogs({
    accessToken,
    limit: 50,
    classFilters,
    enabled: isTeacher
  });

  const isLoading = isSessionLoading || onboarding.isLoading;
  const authBusy = authActions.isSigningIn || authActions.isSigningOut;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">
        教師ダッシュボードを読み込み中...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center p-8 space-y-6">
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Google サインインが必要です</p>
          <h1 className="text-2xl font-semibold text-gray-900">教師ダッシュボード</h1>
          <p className="text-gray-600">下のボタンから Google アカウントでサインインしてください。</p>
        </div>
        <button
          type="button"
          onClick={authActions.signInWithGoogle}
          disabled={authBusy}
          className="inline-flex items-center px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 disabled:opacity-60"
        >
          {authBusy ? "リダイレクト中..." : "Google でサインイン"}
        </button>
      </div>
    );
  }

  if (onboarding.needsOnboarding) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center p-8 space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">プロフィール登録が必要です</h1>
        <p className="text-gray-600">まずトップページでプロフィールを登録してから、教師ログにアクセスしてください。</p>
        <a
          href="/"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
        >
          トップページへ戻る
        </a>
      </div>
    );
  }

  if (!isTeacher) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center p-8 space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">権限がありません</h1>
        <p className="text-gray-600">このページは教師アカウント専用です。管理者にお問い合わせください。</p>
        <a
          href="/"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
        >
          チェッカーへ戻る
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        userEmail={user.email}
        onSignIn={authActions.signInWithGoogle}
        onSignOut={authActions.signOut}
        isAuthLoading={authBusy}
        isLoggedIn
      />
      <main className="flex-1 p-6 lg:p-10 space-y-6">
        {logsState.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 flex items-center justify-between">
            <p>{logsState.error}</p>
            <button
              type="button"
              onClick={logsState.reload}
              className="text-sm font-semibold underline"
            >
              再読み込み
            </button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] min-h-[70vh]">
          <RequestList
            entries={logsState.logs}
            selectedId={logsState.selectedLog?.id}
            onSelect={logsState.selectLog}
            isLoading={logsState.isLoading}
            filterOptions={logsState.filterOptions}
            selectedFilters={classFilters}
            onFilterChange={setClassFilters}
          />
          <RequestDetail entry={logsState.selectedLog} />
        </div>
      </main>
    </div>
  );
}
