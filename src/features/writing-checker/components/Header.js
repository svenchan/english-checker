// components/checker/Header.js
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CHECKER_MODES, TEST_MODE } from "@/config/testMode";
import { Icons } from "@/shared/components/ui/Icons";
import { Tooltip } from "@/shared/components/ui/Tooltip";
import { readTimeAttackIntro, writeTimeAttackIntro } from "../lib/timeAttackIntro";
import Link from "next/link";

const MODE_CONFIG = [
  {
    id: CHECKER_MODES.PRACTICE,
    label: "英作チェッカー",
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
      placement={hasModeSwitch ? "above" : "below"}
      buttonClassName={
        hasModeSwitch
          ? "flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white p-0 text-slate-700 shadow-sm hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          : "rounded-lg p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 hover:bg-white/10 focus-visible:outline-white"
      }
    />
  );

  if (hasModeSwitch) {
    return (
      <>
        <div className="relative h-16 shrink-0 bg-white text-slate-800">
          <div className="flex h-full items-center px-6">
            <ModeSwitch mode={mode} onModeChange={onModeChange} />
          </div>
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
        </div>
        <div className="fixed bottom-4 right-4 z-50">{accountMenu}</div>
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

function ModeSwitch({ mode, onModeChange }) {
  const [intro, setIntro] = useState(null);
  const calloutRef = useRef(null);
  const clockRef = useRef(null);

  useEffect(() => {
    const stored = readTimeAttackIntro(window.localStorage);
    const sessionMode = window.sessionStorage.getItem(TEST_MODE.uiModeStorageKey);
    const alreadyInTimeAttack =
      mode === CHECKER_MODES.TEST || sessionMode === CHECKER_MODES.TEST;
    if (alreadyInTimeAttack && !stored.tried) {
      setIntro(
        writeTimeAttackIntro(window.localStorage, {
          calloutDismissed: true,
          tried: true
        })
      );
      return;
    }
    setIntro(stored);
  }, [mode]);

  const showBadge = Boolean(intro && !intro.tried && mode !== CHECKER_MODES.TEST);
  const showCallout = Boolean(
    intro && !intro.calloutDismissed && !intro.tried && mode !== CHECKER_MODES.TEST
  );

  const dismissCallout = useCallback(() => {
    const stored = readTimeAttackIntro(window.localStorage);
    if (stored.calloutDismissed || stored.tried) return;
    setIntro(
      writeTimeAttackIntro(window.localStorage, {
        ...stored,
        calloutDismissed: true
      })
    );
  }, []);

  useEffect(() => {
    if (!showCallout) return;
    const handlePointerDown = (event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (calloutRef.current?.contains(target)) return;
      if (clockRef.current?.contains(target)) return;
      dismissCallout();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [dismissCallout, showCallout]);

  const markTried = () => {
    setIntro(
      writeTimeAttackIntro(window.localStorage, {
        calloutDismissed: true,
        tried: true
      })
    );
  };

  const handleModeClick = (nextMode) => {
    if (nextMode === mode) return;
    if (nextMode === CHECKER_MODES.TEST) {
      markTried();
    }
    onModeChange(nextMode);
  };

  return (
    <div className="flex min-w-0 items-center gap-2">
      {MODE_CONFIG.map((modeOption) => {
        const Icon = modeOption.icon;
        const isActive = mode === modeOption.id;
        const isTimeAttack = modeOption.id === CHECKER_MODES.TEST;
        const button = (
          <button
            ref={isTimeAttack ? clockRef : undefined}
            type="button"
            aria-pressed={isActive}
            onClick={() => handleModeClick(modeOption.id)}
            className={`relative flex h-10 w-10 items-center justify-center border-0 bg-transparent transition-colors ${
              isActive ? MODE_STYLES[modeOption.id].active : MODE_STYLES[modeOption.id].inactive
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="sr-only">
              {modeOption.label}
              {isTimeAttack && showBadge ? "、新機能" : ""}
            </span>
            {isTimeAttack && showBadge && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-1 -top-1 rounded-full bg-red-600 px-1 py-0.5 text-[9px] font-bold leading-none tracking-wide text-white shadow-sm motion-safe:animate-pulse"
              >
                NEW
              </span>
            )}
          </button>
        );

        if (!isTimeAttack) {
          return (
            <Tooltip key={modeOption.id} content={modeOption.label} position="bottom">
              {button}
            </Tooltip>
          );
        }

        return (
          <span key={modeOption.id} className="relative inline-flex">
            {showCallout ? (
              button
            ) : (
              <Tooltip content={modeOption.label} position="bottom">
                {button}
              </Tooltip>
            )}
          </span>
        );
      })}
      {showCallout && <TimeAttackCallout calloutRef={calloutRef} onClose={dismissCallout} />}
    </div>
  );
}

function TimeAttackCallout({ calloutRef, onClose }) {
  return (
    <div
      ref={calloutRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="time-attack-intro-title"
      className="relative flex max-w-[calc(100vw-11rem)] items-center rounded-md border border-red-200 bg-red-50 py-1 pl-2.5 pr-5 text-left"
    >
      <p id="time-attack-intro-title" className="truncate text-xs leading-4 text-slate-600">
        <span className="font-semibold text-red-600">タイムアタック</span>
        <span> · 5分以内に英文を書くモードです。</span>
      </p>
      <button
        type="button"
        onClick={onClose}
        aria-label="閉じる"
        className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded text-slate-400 hover:text-slate-700"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-3 w-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
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
    placement === "above"
      ? "absolute bottom-full right-0 z-10 mb-2 w-64 rounded-lg border border-gray-200 bg-white p-4 text-gray-900 shadow-lg"
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
        {placement === "above" ? (
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
