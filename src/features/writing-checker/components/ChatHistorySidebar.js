"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/config/supabaseBrowserClient";
import { CHECK_COMPLETED_EVENT } from "../constants";
import { ChatHistoryItem } from "./ChatHistoryItem";
import { Icons } from "@/shared/components/ui/Icons";

const PLACEHOLDER_COUNT = 8;
const HISTORY_LIMIT = 20;

function HistorySkeleton() {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: PLACEHOLDER_COUNT }).map((_, index) => (
        <div key={index} className="h-14 w-full rounded-xl bg-gray-100 animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="px-4 py-6 text-center text-sm text-gray-500">
      {message}
    </div>
  );
}

async function fetchAccessToken(supabase) {
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  const token = data?.session?.access_token;

  if (!token) {
    throw new Error("Not authenticated. Please log in again.");
  }

  return token;
}

export function ChatHistorySidebar({ user, studentId, onOpenChange }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasStudentProfile, setHasStudentProfile] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const sidebarRef = useRef(null);

  useEffect(() => {
    console.log("[ChatHistorySidebar] Component mounted with studentId:", studentId);
    console.log("[ChatHistorySidebar] Type of studentId:", typeof studentId);
    console.log("[ChatHistorySidebar] studentId is truthy?", !!studentId);
  }, [studentId]);

  const upsertLog = useCallback((incoming) => {
    if (!incoming?.id) {
      return;
    }

    setLogs((previous) => {
      const existingIndex = previous.findIndex((log) => log.id === incoming.id);

      if (existingIndex !== -1) {
        const cloned = [...previous];
        cloned[existingIndex] = { ...cloned[existingIndex], ...incoming };
        return cloned;
      }

      return [incoming, ...previous].slice(0, HISTORY_LIMIT);
    });
  }, []);

  const loadLogs = useCallback(async (options = {}) => {
    const { showLoading = true } = options;
    if (showLoading) {
      setIsLoading(true);
    }
    setError("");

    console.log("[loadLogs] Invoked with options:", options);

    try {
      if (!supabase) {
        console.error("[loadLogs] Supabase is not configured");
        throw new Error("Supabase is not configured");
      }

      if (!user) {
        console.log("[loadLogs] No authenticated user. Clearing logs.");
        setLogs([]);
        setHasStudentProfile(true);
        return [];
      }

      const token = await fetchAccessToken(supabase);

      const params = new URLSearchParams({ studentId: studentId || "" });
      const url = `/api/logs/student?${params.toString()}`;

      console.log("[loadLogs] Fetching from URL:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        },
        cache: "no-store"
      });

      console.log("[loadLogs] Response status:", response.status);

      const payload = await response.json().catch(() => ({}));
      console.log("[loadLogs] Raw payload from API:", payload);

      if (response.status === 403) {
        console.warn("[loadLogs] Student profile missing for studentId:", studentId);
        setHasStudentProfile(false);
        setLogs([]);
        return [];
      }

      if (!response.ok) {
        console.error("[loadLogs] API returned error:", response.status, payload);
        throw new Error(payload?.error || "履歴の取得に失敗しました");
      }

      setHasStudentProfile(true);
      const data = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

      if (!Array.isArray(data)) {
        console.warn("[loadLogs] Unable to normalize payload into logs array. Using empty list.");
      }

      console.log("[loadLogs] API returned logs:", data);
      console.log("[loadLogs] Total logs from API:", data.length);
      setLogs(data);
      return data;
    } catch (err) {
      console.error("Failed to load chat history", err);
      setError(err.message || "履歴の取得に失敗しました");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [studentId, supabase, user]);

  useEffect(() => {
    if (!user) {
      setLogs([]);
      setIsLoading(false);
      return;
    }

    if (!supabase) {
      setError("Supabase is not configured");
      setIsLoading(false);
      return;
    }

    if (!studentId) {
      console.log("[ChatHistorySidebar] Skipping loadLogs: studentId is falsy");
      return;
    }

    console.log("[ChatHistorySidebar] Calling loadLogs with studentId:", studentId);

    loadLogs()
      .then((result) => {
        console.log("[ChatHistorySidebar] loadLogs() result:", result);
        console.log(
          "[ChatHistorySidebar] Number of logs returned:",
          Array.isArray(result) ? result.length : "N/A"
        );
      })
      .catch((err) => {
        console.error("[ChatHistorySidebar] loadLogs() error:", err);
      });
  }, [studentId, user, supabase, loadLogs]);

  useEffect(() => {
    if (!user || typeof window === "undefined") {
      return undefined;
    }

    const handleHistoryUpdate = () => {
      loadLogs({ showLoading: false });
    };

    window.addEventListener(CHECK_COMPLETED_EVENT, handleHistoryUpdate);
    return () => {
      window.removeEventListener(CHECK_COMPLETED_EVENT, handleHistoryUpdate);
    };
  }, [loadLogs, user]);

  useEffect(() => {
    if (!studentId) {
      console.log("[Realtime] Skipping subscription: no studentId");
      return undefined;
    }

    if (!user || !supabase) {
      return undefined;
    }

    console.log("[Realtime] Setting up subscription for studentId:", studentId);

    const channel = supabase
      .channel(`writing_logs:student_id=eq.${studentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "writing_logs",
          filter: `student_id=eq.${studentId}`
        },
        (payload) => {
          console.log("[Realtime] ✓ INSERT event received:", payload);
          console.log("[Realtime] Event payload.new:", payload?.new);

          const latestLog = {
            id: payload?.new?.id,
            prompt: payload?.new?.prompt || "",
            student_text: payload?.new?.student_text || "",
            created_at: payload?.new?.created_at,
            createdAt: payload?.new?.created_at
          };

          setHasStudentProfile(true);
          upsertLog(latestLog);
        }
      )
      .subscribe((status) => {
        console.log("[Realtime] Subscription status:", status);
        if (status === "SUBSCRIBED") {
          console.log("[Realtime] ✓✓ Successfully subscribed to channel");
        }
      });

    return () => {
      console.log("[Realtime] Cleaning up subscription");
      channel.unsubscribe();
    };
  }, [studentId, supabase, upsertLog, user]);

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (!sidebarRef.current) {
        return;
      }

      if (!sidebarRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  if (!user) {
    return null;
  }

  const showEmptyState = !isLoading && !error && hasStudentProfile && logs.length === 0;
  const showMissingProfile = !isLoading && !error && !hasStudentProfile;

  const containerClasses = [
    "relative flex h-full items-start",
    isOpen ? "gap-3 py-4 pl-4 pr-2" : "gap-2 py-4 pl-2 pr-0"
  ].join(" ");

  const panelWrapperClasses = [
    "relative h-full overflow-hidden transition-[width,opacity,transform] duration-300 ease-in-out",
    isOpen ? "w-[320px] translate-x-0 opacity-100" : "w-0 -translate-x-3 opacity-0 pointer-events-none"
  ].join(" ");

  const toggleButtonLabel = isOpen ? "履歴を閉じる" : "履歴を開く";

  return (
    <div ref={sidebarRef} className={containerClasses}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={toggleButtonLabel}
        className={`flex h-12 w-12 items-center justify-center rounded-full border text-gray-600 shadow-sm transition hover:border-gray-300 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isOpen ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200"}`}
      >
        <Icons.ChatBubble className="h-5 w-5" />
      </button>

      <div className={panelWrapperClasses} aria-hidden={!isOpen}>
        <div className="flex h-full max-h-screen flex-col border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-200 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Chat History</p>
            <h2 className="text-lg font-semibold text-gray-900">Recent checks</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading && <HistorySkeleton />}

            {!isLoading && error && (
              <div className="space-y-3 px-4 py-6 text-center text-sm text-red-600">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => loadLogs()}
                  className="inline-flex items-center rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Try again
                </button>
              </div>
            )}

            {showMissingProfile && <EmptyState message="Student profile not found." />}
            {showEmptyState && <EmptyState message="No checks yet. Start by typing below!" />}

            {!isLoading && !error && hasStudentProfile && logs.length > 0 && (
              <div className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <ChatHistoryItem key={log.id} log={log} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
