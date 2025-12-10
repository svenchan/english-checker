/**
 * Error Messages and HTTP Status Codes
 */

export const ERRORS = {
  NO_TEXT: 'テキストが必要です',
  TEXT_TOO_LONG: 'テキストは400文字以内で入力してください',
  MISSING_IDENTIFIER: 'studentId か guestSessionId を指定してください',
  CONFLICTING_IDENTIFIERS: 'studentId と guestSessionId を同時に送信できません',
  GROQ_API_ERROR: 'AI サービスでエラーが発生しました',
  SERVER_ERROR: 'サーバーエラーが発生しました',
  RATE_LIMIT_EXCEEDED: '使いすぎです。少し待ってからもう一度試してください',
};

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  METHOD_NOT_ALLOWED: 405,
  RATE_LIMIT: 429,
  SERVER_ERROR: 500,
};
