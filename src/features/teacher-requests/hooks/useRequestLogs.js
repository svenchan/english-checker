"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchRequestLogs } from "../services/requestLogService";

export function useRequestLogs(classCode, { limit = 50 } = {}) {
  const [logs, setLogs] = useState([]);
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const isTeacher = classCode === "TEACHER";

  const loadLogs = useCallback(async () => {
    if (!isTeacher) {
      setLogs([]);
      setSelectedLogId(null);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await fetchRequestLogs({ classCode, limit });
      setLogs(data);
      if (data.length > 0) {
        setSelectedLogId((prev) => prev ?? data[0].id);
      }
    } catch (err) {
      console.error("Failed to load request logs", err);
      setError(err.message || "ログの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [classCode, isTeacher, limit]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const selectedLog = useMemo(() => logs.find((log) => log.id === selectedLogId) || null, [logs, selectedLogId]);

  const selectLog = useCallback((logId) => {
    setSelectedLogId(logId);
  }, []);

  return {
    logs,
    selectedLog,
    isLoading,
    error,
    reload: loadLogs,
    selectLog,
  };
}
