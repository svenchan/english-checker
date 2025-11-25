const LOGS_ENDPOINT = "/api/logs";

/**
 * Fetch teacher request logs from the server.
 * @param {{ classCode: string; limit?: number }} params
 * @returns {Promise<import("../types/request.types").TeacherRequestLog[]>}
 */
export async function fetchRequestLogs({ classCode, limit = 50 }) {
  if (!classCode) {
    throw new Error("クラスコードが必要です");
  }

  const url = `${LOGS_ENDPOINT}?limit=${encodeURIComponent(limit)}`;

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
