// components/checker/Header.js
"use client";

import { CHECKER_MODES } from "@/config/testMode";
import { Icons } from "@/shared/components/ui/Icons";

export function Header({ mode = CHECKER_MODES.PRACTICE }) {
  const isTestMode = mode === CHECKER_MODES.TEST;
  const headerBgClass = isTestMode ? "bg-red-600" : "bg-blue-600";

  return (
    <div className={`${headerBgClass} text-white p-6`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Icons.BookOpen className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">英作文チェッカー</h1>
          </div>
        </div>
      </div>
    </div>
  );
}
