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
    label: "タイムアタック",
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
  const accountMenu = (
    <AccountMenu
      menuRef={menuRef}
      isMenuOpen={isMenuOpen}
      onToggle={toggleMenu}
      isLoggedIn={isLoggedIn}
      isNavigating={isNavigating}
      onOpenHistory={goToTeacher}
      username={username}
      password={password}
      error={error}
      onUsernameChange={setUsername}
      onPasswordChange={setPassword}
      onSubmit={handlePasswordSubmit}
      placement={hasModeSwitch ? "side" : "below"}
      buttonClassName={
        hasModeSwitch
          ? "flex h-10 w-10 items-center justify-center rounded-lg p-0 text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 hover:bg-slate-100 focus-visible:outline-blue-600"
          : "rounded-lg p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 hover:bg-white/10 focus-visible:outline-white"
      }
    />
  );

  if (hasModeSwitch) {
    return (
      <>
        {testTimer && (
          <div className="relative h-16 shrink-0 bg-white text-slate-800">
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
          </div>
        )}
        <StudentEdgeBar mode={mode} onModeChange={onModeChange} isMenuOpen={isMenuOpen}>
          {accountMenu}
        </StudentEdgeBar>
      </>
    );
  }

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
      <div className={`flex items-center gap-3 ${showBrand ? "justify-between" : "justify-end"}`}>
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
        {accountMenu}
      </div>
    </div>
  );
}

function ModeSwitch({ mode, onModeChange, tooltipPosition = "bottom", focusable = true }) {
  return (
    <div className={tooltipPosition === "left" ? "flex flex-col items-center gap-1" : "flex items-center gap-2"}>
      {MODE_CONFIG.map((modeOption) => {
        const Icon = modeOption.icon;
        const isActive = mode === modeOption.id;
        return (
          <Tooltip
            key={modeOption.id}
            content={
              modeOption.id === CHECKER_MODES.TEST
                ? modeOption.label
                : `${modeOption.label} — ${modeOption.description}`
            }
            position={tooltipPosition}
          >
            <button
              type="button"
              tabIndex={focusable ? 0 : -1}
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
  );
}

function StudentEdgeBar({ mode, onModeChange, isMenuOpen, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const hoveringRef = useRef(false);

  useEffect(() => {
    if (!isMenuOpen && !hoveringRef.current) {
      setDesktopOpen(false);
    }
  }, [isMenuOpen]);

  const revealDesktop = () => {
    hoveringRef.current = true;
    setDesktopOpen(true);
  };

  const hideDesktop = () => {
    hoveringRef.current = false;
    if (!isMenuOpen) {
      setDesktopOpen(false);
    }
  };

  const controlsOpen = mobileOpen || desktopOpen;

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="サイドバーを閉じる"
          className="fixed inset-0 z-40 bg-transparent md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div
        className="fixed inset-y-0 right-0 z-50 w-3"
        onMouseEnter={revealDesktop}
        onMouseLeave={hideDesktop}
      >
        <div
          className={`absolute inset-y-0 right-0 flex items-center transition-transform duration-200 ${
            controlsOpen ? "translate-x-0" : "translate-x-[calc(100%-1.25rem)]"
          }`}
        >
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={controlsOpen}
          aria-label={controlsOpen ? "サイドバーを閉じる" : "サイドバーを開く"}
          className="flex h-16 w-5 shrink-0 items-center justify-center rounded-l-md border border-r-0 border-slate-200 bg-white shadow-md"
        >
          <span className="h-6 w-0.5 rounded-full bg-slate-400" />
        </button>
        <div
          aria-hidden={!controlsOpen}
          className="flex h-[calc(100%-3rem)] w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white shadow-lg"
        >
          <ModeSwitch
            mode={mode}
            tooltipPosition="left"
            focusable={controlsOpen}
            onModeChange={(nextMode) => {
              onModeChange(nextMode);
              setMobileOpen(false);
            }}
          />
          <div className="mt-1">{children}</div>
        </div>
        </div>
      </div>
    </>
  );
}

function AccountMenu({
  menuRef,
  isMenuOpen,
  onToggle,
  isLoggedIn,
  isNavigating,
  onOpenHistory,
  username,
  password,
  error,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
  placement,
  buttonClassName
}) {
  const panelClassName =
    placement === "side"
      ? "absolute right-full top-0 z-10 mr-2 w-64 rounded-lg border border-gray-200 bg-white p-4 text-gray-900 shadow-lg"
      : "absolute right-0 z-10 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-4 text-gray-900 shadow-lg";

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        aria-label="メニューを開く"
        className={buttonClassName}
      >
        {placement === "side" ? (
          <Icons.LogIn className="h-5 w-5" />
        ) : (
          <Icons.Menu className="h-6 w-6" />
        )}
      </button>
      {isMenuOpen && (
        <div className={panelClassName}>
          {isLoggedIn ? (
            <button
              onClick={onOpenHistory}
              disabled={isNavigating}
              className="flex w-full items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {isNavigating ? <Icons.Loader className="h-4 w-4 animate-spin" /> : "提出履歴を見る"}
            </button>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => onUsernameChange(event.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ユーザー名"
                autoComplete="username"
              />
              <input
                id="history-password"
                type="password"
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="パスワードを入力"
                autoComplete="current-password"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={isNavigating}
                className="flex w-full items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {isNavigating ? <Icons.Loader className="h-4 w-4 animate-spin" /> : "開く"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function formatTimer(ms = 0) {
  const safeMs = Math.max(0, ms);
  const minutes = Math.floor(safeMs / 60000);
  const seconds = Math.floor((safeMs % 60000) / 1000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
