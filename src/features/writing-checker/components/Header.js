// components/checker/Header.js
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CHECKER_MODES } from "@/config/testMode";
import { Icons } from "@/shared/components/ui/Icons";
import Link from "next/link";

export function Header({ mode = CHECKER_MODES.PRACTICE }) {
  const isTestMode = mode === CHECKER_MODES.TEST;
  const headerBgClass = isTestMode ? "bg-red-600" : "bg-blue-600";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const menuRef = useRef(null);
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);


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

  useEffect(() => {
    const checkSession = async () => {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setIsLoggedIn(data.loggedIn);
    };
    checkSession();
  }, []);
  
  const toggleMenu = () => {
    setIsMenuOpen((prev) => {
      const next = !prev;
      if (!next) {
        setPassword("");
        setUsername("");
        setError("");
      }
      return next;
    });
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    if (res.ok || res.redirected) {
      setIsMenuOpen(false);
      setUsername("");
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
            <Link href="/" className="text-2xl font-bold hover:text-gray-300">
              英作文チェッカー
            </Link>
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
              {isLoggedIn ? (
                <button
                  onClick={() => router.push("/teacher")}
                  className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  提出履歴を見る
                </button>
              ) : (
                <form onSubmit={handlePasswordSubmit} className="space-y-3">
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ユーザー名"
                    autoComplete="username"
                  />
                  <input
                    id="history-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="パスワードを入力"
                    autoComplete="current-password"
                  />
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <button
                    type="submit"
                    className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    開く
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
  }
 