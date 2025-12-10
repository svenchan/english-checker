const LOGS_ENDPOINT = "/api/logs";

/**
 * Fetch teacher request logs from the server.
 * @param {{ accessToken: string; limit?: number; classFilters?: string[] }} params
 * @returns {Promise<{ entries: import("../types/request.types").TeacherRequestLog[]; filterOptions: { value: string; label: string }[] }>}
 */
export async function fetchRequestLogs({ accessToken, limit = 50, classFilters = [] }) {
  if (!accessToken) {
    throw new Error("認証が必要です");
  }

  const params = new URLSearchParams({ limit: String(limit) });
  classFilters
    .filter(Boolean)
    .forEach((filter) => {
      params.append("classFilter", filter);
    });

  const url = `${LOGS_ENDPOINT}?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.error || "ログの取得に失敗しました";
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  const filterOptions = (payload?.meta?.classFilters || []).map((option) => ({
    value: String(option.id ?? option.value ?? ""),
    label: option.label || option.name || String(option.id ?? option.value ?? "クラス")
  }));

  return {
    entries: payload?.data || [],
    filterOptions
  };
}
