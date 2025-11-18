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

// Build a copy-friendly text block combining the student's text, score, mistakes, and level-up advice
export function buildCopyText(text = "", feedback) {
  let copyText = `【英文】\n${text}\n\n`;

  if (feedback) {
    if (typeof feedback.overallScore === "number") {
      copyText += `【スコア】\n${feedback.overallScore}点\n\n`;
    }

    if (Array.isArray(feedback.mistakes) && feedback.mistakes.length > 0) {
      copyText += `【間違い】\n`;
      feedback.mistakes.forEach((mistake, idx) => {
        const original = mistake?.original ?? "";
        const corrected = mistake?.corrected ?? "";
        const explanation = mistake?.explanation ?? "";
        copyText += `\n${idx + 1}. ${original} → ${corrected}\n`;
        if (explanation) {
          copyText += `   説明: ${explanation}\n`;
        }
      });
    } else {
      copyText += `【間違い】\nなし - 完璧です！\n`;
    }

    if (feedback.levelUp) {
      copyText += `\n【レベルアップ】\n${feedback.levelUp}\n`;
    }
  }

  return copyText;
}