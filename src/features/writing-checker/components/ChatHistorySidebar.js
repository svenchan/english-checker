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
      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (userError) throw userError;

      if (!userRecord?.id) {
        setHasStudentProfile(false);
        setLogs([]);
        return;
      }

      const { data: studentRecord, error: studentError } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", userRecord.id)
        .maybeSingle();

      if (studentError) throw studentError;

      if (!studentRecord?.id) {
        setHasStudentProfile(false);
        setLogs([]);
        return;
      }

      const { data: historyRows, error: logsError } = await supabase
        .from("writing_logs")
        .select("id,prompt,created_at")
        .eq("student_id", studentRecord.id)
        .eq("is_guest", false)
        .order("created_at", { ascending: false })
        .limit(20);

      if (logsError) throw logsError;

      setHasStudentProfile(true);
      setLogs(historyRows || []);
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
