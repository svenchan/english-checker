"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchRequestLogs } from "../services/requestLogService";

export function useRequestLogs({ accessToken, limit = 50, classFilters = [], enabled = false } = {}) {
  const [logs, setLogs] = useState([]);
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterOptions, setFilterOptions] = useState([]);

  const loadLogs = useCallback(async () => {
    if (!enabled || !accessToken) {
      setLogs([]);
      setFilterOptions([]);
      setSelectedLogId(null);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { entries, filterOptions: serverFilters } = await fetchRequestLogs({ accessToken, limit, classFilters });
      setLogs(entries);
      setFilterOptions(serverFilters);
      setSelectedLogId((prev) => {
        if (prev && entries.some((entry) => entry.id === prev)) {
          return prev;
        }
        return entries[0]?.id ?? null;
      });
    } catch (err) {
      console.error("Failed to load request logs", err);
      setError(err.message || "ログの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, classFilters, enabled, limit]);

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
    filterOptions,
    selectedFilters: classFilters
  };
}
