/**
 * @typedef {Object} TeacherRequestLog
 * @property {string|number} id
 * @property {string} createdAt
 * @property {string} classCode
 * @property {string} studentText
 * @property {import("@/features/writing-checker/types/checker.types").FeedbackResponse} feedback
 * @property {number} tokensIn
 * @property {number} tokensOut
 * @property {boolean} hasCorrections
 * @property {boolean} isPerfectScore
 */

export const TeacherRequestLogShape = {};
