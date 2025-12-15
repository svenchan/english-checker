// components/checker/Header.js
"use client";

import { Icons } from "@/shared/components/ui/Icons";

export function Header() {
  return (
    <div className="bg-blue-600 text-white p-6">
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
