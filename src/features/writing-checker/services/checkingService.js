// src/features/writing-checker/services/checkingService.js

const CHECK_ENDPOINT = "/api/check";

/**
 * Submit writing for grammar checking.
 * @param {{ text: string; studentId?: string; guestSessionId?: string }} payload
 * @returns {Promise<import("../types/checker.types").FeedbackResponse>}
 */
export async function submitWritingCheck(payload) {
  const response = await fetch(CHECK_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = data?.error || "サーバーエラーが発生しました";
    const error = new Error(errorMessage);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  if (data?.success && data?.feedback) {
    return data.feedback;
  }

  return data;
}
