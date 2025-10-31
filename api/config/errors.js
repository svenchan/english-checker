/**
 * Error Messages and HTTP Status Codes
 */

const ERRORS = {
  NO_TEXT: 'テキストが必要です',
  NO_CLASS_CODE: 'クラスコードが必要です',
  INVALID_CLASS_CODE: '無効なクラスコードです',
  GROQ_API_ERROR: 'AI サービスでエラーが発生しました',
  SERVER_ERROR: 'サーバーエラーが発生しました',
  RATE_LIMIT_EXCEEDED: '使いすぎです。少し待ってからもう一度試してください',
};

const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  METHOD_NOT_ALLOWED: 405,
  RATE_LIMIT: 429,
  SERVER_ERROR: 500,
};

module.exports = {
  ERRORS,
  HTTP_STATUS
};
