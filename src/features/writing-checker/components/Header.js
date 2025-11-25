// components/checker/Header.js
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "@/shared/components/ui/Icons";

export function Header({ classCode, onLogout, onReset, hasFeedback }) {
  const isTeacher = classCode === "TEACHER";
  const pathname = usePathname();
  const onTeacherPage = pathname?.startsWith("/teacher/requests");

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
          {isTeacher && (
            <Link
              href="/teacher/requests"
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                onTeacherPage
                  ? "bg-white text-blue-600 border-white"
                  : "bg-white/10 border-white/20 text-white hover:bg-white/20"
              }`}
            >
              提出一覧
            </Link>
          )}
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