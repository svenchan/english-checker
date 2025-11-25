// src/features/auth/services/authService.js

const VALIDATE_ENDPOINT = "/api/classcode/validate";

/**
 * Validate a class code by making a minimal request to the checker API.
 * @param {string} classCode
 * @returns {Promise<void>}
 */
export async function validateClassCodeRequest(classCode) {
  const response = await fetch(VALIDATE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ classCode })
  });

  if (response.status === 401) {
    const error = new Error("クラスコードが見つかりません。もう一度お試しください。");
    error.status = response.status;
    throw error;
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const errorMessage = payload?.error || "エラーが発生しました。もう一度お試しください。";
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }
}
