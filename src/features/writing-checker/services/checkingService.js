// src/features/writing-checker/services/checkingService.js

import { CHECKER_MODES } from "@/config/testMode";

const CHECK_ENDPOINT = "/api/check";

/**
 * Submit writing for grammar checking.
 * @param {{ text: string; topicText?: string | null; mode?: string }} payload
 * @returns {Promise<import("../types/checker.types").FeedbackResponse>}
 */
export async function submitWritingCheck(payload) {
  const mode =
    payload?.mode === CHECKER_MODES.TEST ? CHECKER_MODES.TEST : CHECKER_MODES.PRACTICE;
  const requestPayload = {
    ...payload,
    mode,
    testMode: mode === CHECKER_MODES.TEST
  };

  const response = await fetch(CHECK_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestPayload)
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = data?.error || "サーバーエラーが発生しました";
    const error = new Error(errorMessage);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}
