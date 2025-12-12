"use client";

import { extractStudentTextFromPrompt } from "@/lib/promptParsers";

const PREVIEW_WORD_LIMIT = 12;

function formatTimestamp(value) {
  if (!value) {
    return "日時不明";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "日時不明";
  }

  const now = new Date();
  const isSameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  });

  if (isSameDay) {
    return `Today at ${timeFormatter.format(date)}`;
  }

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  });

  return `${dateFormatter.format(date)} at ${timeFormatter.format(date)}`;
}

function getStudentTextFromLog(log) {
  if (!log) return "";

  if (typeof log.student_text === "string" && log.student_text.length > 0) {
    return log.student_text;
  }

  if (typeof log.studentText === "string" && log.studentText.length > 0) {
    return log.studentText;
  }

  if (typeof log.prompt === "string" && log.prompt.length > 0) {
    return extractStudentTextFromPrompt(log.prompt);
  }

  return "";
}

function buildPreview(text = "") {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "(No text)";
  }

  const words = normalized.split(" ");
  if (words.length <= PREVIEW_WORD_LIMIT) {
    return normalized;
  }

  return `${words.slice(0, PREVIEW_WORD_LIMIT).join(" ")}…`;
}

export function ChatHistoryItem({ log }) {
  if (!log) {
    return null;
  }

  const previewText = buildPreview(getStudentTextFromLog(log));
  const timestampLabel = formatTimestamp(log.created_at || log.createdAt);

  return (
    <div
      className="group rounded-xl border border-transparent px-4 py-3 transition-colors hover:border-blue-100 hover:bg-blue-50/80 cursor-pointer"
      role="button"
      tabIndex={0}
    >
      <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">{timestampLabel}</p>
      <p className="text-sm text-gray-800 leading-snug break-words pr-1 max-h-12 overflow-hidden">{previewText}</p>
    </div>
  );
}
