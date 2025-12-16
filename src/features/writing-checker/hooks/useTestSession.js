"use client";

import { useCallback, useEffect, useState } from "react";
import { CHECKER_MODES, TEST_MODE } from "@/config/testMode";
import { createTestSession, isValidTestSession } from "../lib/testSession";

function readStoredSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(TEST_MODE.storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isValidTestSession(parsed) ? parsed : null;
  } catch (error) {
    console.warn("Failed to parse stored test session", error);
    return null;
  }
}

function persistSession(session) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(TEST_MODE.storageKey, JSON.stringify(session));
  } catch (error) {
    console.warn("Failed to persist test session", error);
  }
}

function removeStoredSession() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(TEST_MODE.storageKey);
  } catch (error) {
    console.warn("Failed to remove test session", error);
  }
}

export function useTestSession(mode) {
  const [session, setSession] = useState(null);
  const [remainingMs, setRemainingMs] = useState(TEST_MODE.durationMs);

  const shouldEnable = mode === CHECKER_MODES.TEST;

  const refreshRemaining = useCallback((targetSession) => {
    if (!targetSession) {
      setRemainingMs(TEST_MODE.durationMs);
      return;
    }
    const ms = Math.max(0, targetSession.endsAt - Date.now());
    setRemainingMs(ms);
  }, []);

  const hydrateSession = useCallback(() => {
    if (!shouldEnable) {
      return;
    }
    const existing = readStoredSession();
    if (existing && !existing.submitted) {
      setSession(existing);
      refreshRemaining(existing);
      return;
    }
    const next = createTestSession();
    setSession(next);
    refreshRemaining(next);
    persistSession(next);
  }, [refreshRemaining, shouldEnable]);

  useEffect(() => {
    if (shouldEnable) {
      hydrateSession();
    }
  }, [hydrateSession, shouldEnable]);

  useEffect(() => {
    if (!session || session.submitted) {
      return;
    }
    refreshRemaining(session);
    const interval = setInterval(() => refreshRemaining(session), 1000);
    return () => clearInterval(interval);
  }, [session?.id, session?.submitted, session?.endsAt, refreshRemaining]);

  const startNewSession = useCallback(() => {
    const next = createTestSession();
    setSession(next);
    refreshRemaining(next);
    persistSession(next);
    return next;
  }, [refreshRemaining]);

  const markSubmitted = useCallback(() => {
    setSession((current) => {
      if (!current) return current;
      if (current.submitted) return current;
      const next = { ...current, submitted: true };
      persistSession(next);
      setRemainingMs((prev) => Math.min(prev, Math.max(0, next.endsAt - Date.now())));
      return next;
    });
  }, []);

  const clearSession = useCallback(() => {
    setSession(null);
    removeStoredSession();
    setRemainingMs(TEST_MODE.durationMs);
  }, []);

  return {
    session,
    remainingMs,
    shouldEnable,
    hydrateSession,
    startNewSession,
    markSubmitted,
    clearSession
  };
}
