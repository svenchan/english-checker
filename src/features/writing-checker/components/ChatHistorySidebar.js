"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/config/supabaseBrowserClient";
import { ChatHistoryItem } from "./ChatHistoryItem";

const PLACEHOLDER_COUNT = 8;

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

export function ChatHistorySidebar({ user }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasStudentProfile, setHasStudentProfile] = useState(true);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      if (!supabase) {
        throw new Error("Supabase is not configured");
      }

      if (!user) {
        setLogs([]);
        setHasStudentProfile(true);
        return;
      }

      const token = await fetchAccessToken(supabase);

      const response = await fetch("/api/logs/student", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const payload = await response.json().catch(() => ({}));

      if (response.status === 403) {
        setHasStudentProfile(false);
        setLogs([]);
        return;
      }

      if (!response.ok) {
        throw new Error(payload?.error || "履歴の取得に失敗しました");
      }

      setHasStudentProfile(true);
      setLogs(payload?.data || []);
    } catch (err) {
      console.error("Failed to load chat history", err);
      setError(err.message || "履歴の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user]);

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

    loadLogs();
  }, [user, supabase, loadLogs]);

  if (!user) {
    return null;
  }

  const showEmptyState = !isLoading && !error && hasStudentProfile && logs.length === 0;
  const showMissingProfile = !isLoading && !error && !hasStudentProfile;

  return (
    <div className="flex h-full max-h-screen flex-col bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Chat History</p>
        <h2 className="text-lg font-semibold text-gray-900">Recent checks</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && <HistorySkeleton />}

        {!isLoading && error && (
          <div className="px-4 py-6 text-center text-sm text-red-600 space-y-3">
            <p>{error}</p>
            <button
              type="button"
              onClick={loadLogs}
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
  );
}
