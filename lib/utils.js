// lib/utils.js

import { MISTAKE_TYPE_LABELS, MISTAKE_TYPE_COLORS, SCORE_COLORS } from './constants';

export function sanitizeForRegex(str = "") {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getScoreColor(score = 0) {
  if (score >= 80) return SCORE_COLORS.high;
  if (score >= 60) return SCORE_COLORS.medium;
  return SCORE_COLORS.low;
}

export function getMistakeTypeLabel(type) {
  return MISTAKE_TYPE_LABELS[type] || "文法";
}

export function getMistakeTypeColor(type) {
  return MISTAKE_TYPE_COLORS[type] || "bg-blue-100 text-blue-700";
}