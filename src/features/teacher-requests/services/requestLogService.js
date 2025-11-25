const LOGS_ENDPOINT = "/api/logs";

/**
 * Fetch teacher request logs from the server.
 * @param {{ classCode: string; limit?: number; classFilters?: string[] }} params
 * @returns {Promise<import("../types/request.types").TeacherRequestLog[]>}
 */
export async function fetchRequestLogs({ classCode, limit = 50, classFilters = [] }) {
  if (!classCode) {
    throw new Error("クラスコードが必要です");
  }

  const params = new URLSearchParams({ limit: String(limit) });
  classFilters
    .map((filter) => filter?.toUpperCase())
    .filter(Boolean)
    .forEach((filter) => {
      params.append("classFilter", filter);
    });

  const url = `${LOGS_ENDPOINT}?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-class-code": classCode
    }
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.error || "ログの取得に失敗しました";
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return payload?.data || [];
}
