// components/checker/Header.js
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CHECKER_MODES } from "@/config/testMode";
import { Icons } from "@/shared/components/ui/Icons";

export function Header({ mode = CHECKER_MODES.PRACTICE }) {
  const isTestMode = mode === CHECKER_MODES.TEST;
  const headerBgClass = isTestMode ? "bg-red-600" : "bg-blue-600";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  return (
    <div className={`${headerBgClass} text-white p-6`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Icons.BookOpen className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">英作文チェッカー</h1>
          </div>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={toggleMenu}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            aria-label="メニューを開く"
            className="p-2 rounded-lg hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Icons.Menu className="h-6 w-6" />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white text-gray-900 shadow-lg z-10">
              <Link
                href="/teacher"
                className="block px-4 py-3 text-sm font-medium hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                提出履歴を見る
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
