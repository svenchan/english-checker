// components/checker/Header.js
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CHECKER_MODES } from "@/config/testMode";
import { Icons } from "@/shared/components/ui/Icons";

export function Header({ mode = CHECKER_MODES.PRACTICE }) {
  const isTestMode = mode === CHECKER_MODES.TEST;
  const headerBgClass = isTestMode ? "bg-red-600" : "bg-blue-600";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const menuRef = useRef(null);
  const router = useRouter();

  const ACCESS_PASSWORD = "Pineapple26";

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

  const toggleMenu = () => {
    setIsMenuOpen((prev) => {
      const next = !prev;
      if (!next) {
        setPassword("");
        setError("");
      }
      return next;
    });
  };

  const handlePasswordSubmit = (event) => {
    event.preventDefault();
    if (password === ACCESS_PASSWORD) {
      setError("");
      setIsMenuOpen(false);
      setPassword("");
      router.push("/teacher");
    } else {
      setError("パスワードが正しくありません");
    }
  };

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
            <div className="absolute right-0 mt-2 w-64 rounded-lg border border-gray-200 bg-white text-gray-900 shadow-lg z-10 p-4">
              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                <div>
                  <label htmlFor="history-password" className="block text-sm font-semibold text-gray-800">
                    提出履歴を見る
                  </label>
                  <input
                    id="history-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="パスワードを入力"
                    autoComplete="current-password"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  type="submit"
                  className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  開く
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
