// components/checker/Header.js
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CHECKER_MODES } from "@/config/testMode";
import { Icons } from "@/shared/components/ui/Icons";
import { Tooltip } from "@/shared/components/ui/Tooltip";
import Link from "next/link";

const MODE_CONFIG = [
  {
    id: CHECKER_MODES.PRACTICE,
    label: "練習モード",
    description: "自由にテーマを選んで練習",
    icon: Icons.Pen
  },
  {
    id: CHECKER_MODES.TEST,
    label: "テストモード",
    description: "5分の本番シミュレーション",
    icon: Icons.Clock
  }
];

const MODE_STYLES = {
  [CHECKER_MODES.PRACTICE]: {
    active: "text-blue-600",
    inactive: "text-gray-400 hover:text-blue-600"
  },
  [CHECKER_MODES.TEST]: {
    active: "text-red-600",
    inactive: "text-gray-400 hover:text-red-600"
  }
};

export function Header({ mode = CHECKER_MODES.PRACTICE, showBrand = true, onModeChange, testTimer = null }) {
  const isTestMode = mode === CHECKER_MODES.TEST;
  const headerBgClass = isTestMode ? "bg-red-600" : "bg-blue-600";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const menuRef = useRef(null);
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);


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

  const goToTeacher = () => {
    setIsNavigating(true);
    router.push("/teacher");
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      redirect: "manual"
    });
    if (res.ok || res.status === 0) {
      setIsMenuOpen(false);
      setUsername("");
      setPassword("");
      goToTeacher();
    } else {
      setError("パスワードが正しくありません");
    }
  };
  const hasModeSwitch = typeof onModeChange === "function";

  return (
    <div className={showBrand ? `${headerBgClass} p-6 text-white` : "relative shrink-0 bg-white px-4 py-3 text-slate-800"}>
      {testTimer && (
        <div
          className={`pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 text-sm font-semibold ${
            testTimer.submitted
              ? "text-green-700"
              : testTimer.started
                ? "text-red-700"
                : "text-gray-600"
          }`}
        >
          <Icons.Clock className="h-4 w-4" />
          <span>{formatTimer(testTimer.remainingMs)}</span>
        </div>
      )}
      <div className={`flex items-center gap-3 ${showBrand || hasModeSwitch ? "justify-between" : "justify-end"}`}>
        {hasModeSwitch && (
          <div className="flex items-center gap-2">
            {MODE_CONFIG.map((modeOption) => {
              const Icon = modeOption.icon;
              const isActive = mode === modeOption.id;
              return (
                <Tooltip
                  key={modeOption.id}
                  content={`${modeOption.label} — ${modeOption.description}`}
                  position="bottom"
                >
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => {
                      if (modeOption.id !== mode) {
                        onModeChange(modeOption.id);
                      }
                    }}
                    className={`flex h-10 w-10 items-center justify-center border-0 bg-transparent transition-colors ${
                      isActive ? MODE_STYLES[modeOption.id].active : MODE_STYLES[modeOption.id].inactive
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="sr-only">{modeOption.label}</span>
                  </button>
                </Tooltip>
              );
            })}
          </div>
        )}
        {showBrand && (
          <div className="flex items-center space-x-3">
            <Icons.BookOpen className="h-8 w-8" />
            <div>
              <Link href="/" className="text-2xl font-bold hover:text-gray-300">
                英作文チェッカー
              </Link>
            </div>
          </div>
        )}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={toggleMenu}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            aria-label="メニューを開く"
            className={`rounded-lg p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
              showBrand
                ? "hover:bg-white/10 focus-visible:outline-white"
                : "hover:bg-slate-100 focus-visible:outline-blue-600"
            }`}
          >
            <Icons.Menu className="h-6 w-6" />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-lg border border-gray-200 bg-white text-gray-900 shadow-lg z-10 p-4">
              {isLoggedIn ? (
                <button
                  onClick={() => goToTeacher()}
                  disabled={isNavigating}
                  className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 flex items-center justify-center"
                >
                  {isNavigating ? <Icons.Loader className="h-4 w-4 animate-spin" /> : "提出履歴を見る"}
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
                    disabled={isNavigating}
                    className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 flex items-center justify-center"
                  >
                   {isNavigating ? <Icons.Loader className="h-4 w-4 animate-spin" /> : "開く"} 
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

function formatTimer(ms = 0) {
  const safeMs = Math.max(0, ms);
  const minutes = Math.floor(safeMs / 60000);
  const seconds = Math.floor((safeMs % 60000) / 1000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
