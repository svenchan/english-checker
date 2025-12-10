"use client";

const PREVIEW_CHAR_LIMIT = 60;

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

function buildPreview(prompt = "") {
  const normalized = prompt.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "(No text)";
  }

  if (normalized.length <= PREVIEW_CHAR_LIMIT) {
    return normalized;
  }

  return `${normalized.slice(0, PREVIEW_CHAR_LIMIT).trimEnd()}…`;
}

export function ChatHistoryItem({ log }) {
  if (!log) {
    return null;
  }

  const previewText = buildPreview(log.prompt || "");
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
