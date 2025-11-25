"use client";

import { Icons } from "@/shared/components/ui/Icons";

const formatter = new Intl.DateTimeFormat("ja-JP", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

export function RequestList({ entries = [], selectedId, onSelect, isLoading }) {
  const containScroll = (event) => {
    event.stopPropagation();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col min-h-0 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">最新リクエスト</p>
          <h2 className="text-xl font-semibold">{entries.length} 件</h2>
        </div>
        {isLoading && (
          <div className="flex items-center text-blue-600 text-sm">
            <Icons.Loader className="h-4 w-4 animate-spin mr-2" />
            更新中
          </div>
        )}
      </div>

      <div
        className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-50 overscroll-contain"
        onWheel={containScroll}
        onTouchMove={containScroll}
      >
        {entries.length === 0 && !isLoading && (
          <div className="p-6 text-center text-gray-500">表示できる記録がありません。</div>
        )}
        {entries.map((entry) => {
          const label = entry.hasCorrections ? "要修正" : entry.isPerfectScore ? "100点" : "確認済";
          const labelColor = entry.hasCorrections
            ? "bg-red-50 text-red-600"
            : entry.isPerfectScore
            ? "bg-green-50 text-green-600"
            : "bg-blue-50 text-blue-600";
          return (
            <button
              key={entry.id}
              className={`w-full text-left p-4 focus:outline-none transition-colors ${
                entry.id === selectedId ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
              onClick={() => onSelect?.(entry.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">{entry.classCode}</p>
                  <p className="text-sm text-gray-600">
                    {formatter.format(new Date(entry.createdAt))}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${labelColor}`}>{label}</span>
              </div>
              <p className="mt-2 text-sm text-gray-700 overflow-hidden text-ellipsis whitespace-nowrap">
                {entry.studentText || "(本文なし)"}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
