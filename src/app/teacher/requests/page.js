"use client";

import Link from "next/link";
import { Header } from "@/features/writing-checker/components/Header";
import { useSupabaseSession } from "@/features/auth/hooks/useSupabaseSession";

export default function TeacherRequestsPage() {
  const { user, isLoading } = useSupabaseSession();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">
        教師ダッシュボードを読み込み中...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center p-8 space-y-4">
        <div>
          <p className="text-sm text-gray-500">Google サインインが必要です</p>
          <h1 className="text-2xl font-semibold text-gray-900 mt-2">教師ダッシュボードは近日公開</h1>
          <p className="text-gray-600 mt-4">
            まずトップページ左のサイドバーから Google でサインインしてください。教師権限は順次付与されます。
          </p>
        </div>
        <Link href="/" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors">
          チェッカーに戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header userEmail={user.email} />
      <main className="flex-1 p-8">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm border border-gray-100 space-y-4">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Teacher Dashboard</p>
          <h1 className="text-3xl font-bold text-gray-900">作業中です</h1>
          <p className="text-gray-600">
            クラスコード廃止に伴い、教師向けログ閲覧ツールを Supabase ベースの認証に移行しています。
            近日中に Google アカウントでの権限チェックを追加し、再度提出履歴を閲覧できるようにします。
          </p>
          <p className="text-gray-500 text-sm">
            緊急でログが必要な場合は Supabase ダッシュボードの <code>writing_logs</code> テーブルから直接ご確認ください。
          </p>
          <div>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-500 transition-colors"
            >
              チェッカーに戻る
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
