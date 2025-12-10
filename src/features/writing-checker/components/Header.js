// components/checker/Header.js
"use client";

import { Icons } from "@/shared/components/ui/Icons";

export function Header({ userEmail, onReset, hasFeedback }) {
  return (
    <div className="bg-blue-600 text-white p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-3">
          <Icons.BookOpen className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">英作文チェッカー</h1>
            <p className="text-blue-100 text-sm">
              {userEmail ? `ログイン中: ${userEmail}` : "ゲストモード (保存なし)"}
            </p>
          </div>
        </div>
        {hasFeedback && (
          <button
            onClick={onReset}
            className="inline-flex items-center justify-center rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            <Icons.RefreshCw className="mr-2 h-4 w-4" />
            もう一度書く
          </button>
        )}
      </div>
    </div>
  );
}