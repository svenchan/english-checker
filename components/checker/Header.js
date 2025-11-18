// components/checker/Header.js
"use client";

import { Icons } from "@/components/ui/Icons";

export function Header({ classCode, onLogout, onReset, hasFeedback }) {
  return (
    <div className="bg-blue-600 text-white p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Icons.BookOpen className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">英作文チェッカー</h1>
            <p className="text-blue-100 text-sm">クラス: {classCode}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            title="ログアウト"
          >
            <Icons.LogOut className="h-4 w-4" />
            <span>ログアウト</span>
          </button>
        </div>
      </div>
    </div>
  );
}