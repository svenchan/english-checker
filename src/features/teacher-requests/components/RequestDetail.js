"use client";

import { Icons } from "@/shared/components/ui/Icons";

export function RequestDetail({ entry }) {
  if (!entry) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex items-center justify-center text-gray-500">
        リクエストを選択すると詳細が表示されます。
      </div>
    );
  }

  const { feedback } = entry;
  const hasMistakes = feedback?.mistakes?.length > 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col p-6 min-h-0">
      <div className="flex flex-wrap items-center gap-4 border-b border-gray-100 pb-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">提出日時</p>
          <p className="text-lg font-semibold text-gray-900">
            {new Date(entry.createdAt).toLocaleString("ja-JP", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            entry.hasCorrections ? "bg-red-50 text-red-600" : entry.isPerfectScore ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
          }`}>
            {entry.hasCorrections ? "要修正" : entry.isPerfectScore ? "100点" : "確認済"}
          </span>
          <div className="flex items-center gap-1 text-gray-500 text-sm">
            <Icons.Bolt className="h-4 w-4" />
            <span>
              {entry.tokensIn + entry.tokensOut} tokens
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <section className="flex flex-col min-h-0">
          <div className="flex items-center gap-2">
            <Icons.Pen className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">生徒の英文</h3>
          </div>
          <div className="mt-3 flex-1 bg-gray-50 rounded-xl p-4 overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
            {entry.studentText || "(本文なし)"}
          </div>
        </section>

        <section className="flex flex-col min-h-0">
          <div className="flex items-center gap-2">
            <Icons.Stars className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-gray-900">AIフィードバック</h3>
            <span className="ml-auto text-sm text-gray-500">スコア: {feedback?.overallScore ?? "-"}</span>
          </div>

          <div className="mt-3 flex-1 overflow-auto space-y-4">
            {hasMistakes ? (
              feedback.mistakes.map((mistake, index) => (
                <article key={`${entry.id}-${index}`} className="border border-gray-100 rounded-xl p-4 bg-gradient-to-br from-white to-blue-50/40 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">#{index + 1}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-900/5 text-gray-700">{mistake.type}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">誤り: <span className="font-normal">{mistake.original || "-"}</span></p>
                  <p className="text-sm font-semibold text-emerald-600 mt-1">修正: <span className="font-normal text-gray-800">{mistake.corrected || "-"}</span></p>
                  <p className="text-sm text-gray-600 mt-2">{mistake.explanation}</p>
                </article>
              ))
            ) : (
              <div className="border border-green-100 rounded-xl p-5 bg-green-50/70 text-green-900">
                <p className="font-semibold text-lg">ミスはありません！</p>
                <p className="text-sm mt-1">満点の提出でした。以下のアドバイスでさらにレベルアップしましょう。</p>
              </div>
            )}

            {feedback?.levelUp && (
              <div className="border border-amber-100 rounded-xl p-5 bg-amber-50 text-amber-900">
                <p className="font-semibold text-lg">レベルアップ</p>
                <p className="text-sm mt-2 whitespace-pre-wrap">{feedback.levelUp}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
