import Link from "next/link";
import { supabaseAdmin } from "@/config/supabase";
import { CHECKER_MODES } from "@/config/testMode";

export const dynamic = "force-dynamic";

const FILTERS = [
  { id: "all", label: "すべて" },
  { id: CHECKER_MODES.PRACTICE, label: "練習のみ" },
  { id: CHECKER_MODES.TEST, label: "テストのみ" }
];

async function fetchSubmissions(filter) {
  if (!supabaseAdmin) {
    return [];
  }

  let query = supabaseAdmin
    .from("writing_submissions")
    .select("id, created_at, topic_text, status, student_text, test_mode")
    .order("created_at", { ascending: false })
    .limit(50);

  if (filter === CHECKER_MODES.TEST) {
    query = query.eq("test_mode", true);
  } else if (filter === CHECKER_MODES.PRACTICE) {
    query = query.eq("test_mode", false);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Failed to load submissions", error);
    return [];
  }
  return data || [];
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
}

export default async function TeacherPage({ searchParams }) {
  const filter = searchParams?.mode || "all";
  const submissions = await fetchSubmissions(filter);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-6 py-12 space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">提出履歴</h1>
          <p className="text-sm text-gray-600 mt-1">
            最近の提出を確認できます。上部のフィルターで練習・テストを切り替えられます。
          </p>
        </header>

        <div className="flex gap-2">
          {FILTERS.map((option) => {
            const isActive = option.id === filter;
            const href = option.id === "all" ? "/teacher" : `/teacher?mode=${option.id}`;
            return (
              <Link
                key={option.id}
                href={href}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"
                }`}
              >
                {option.label}
              </Link>
            );
          })}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="grid grid-cols-4 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">
            <span>提出日時</span>
            <span>ステータス</span>
            <span className="col-span-2">内容サマリー</span>
          </div>
          {submissions.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">提出がまだありません。</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {submissions.map((submission) => (
                <li key={submission.id} className="grid grid-cols-4 gap-4 px-6 py-4 text-sm">
                  <span className="text-gray-800">{formatDate(submission.created_at)}</span>
                  <span className="text-gray-700">{submission.status || "-"}</span>
                  <span className="col-span-2 text-gray-800">
                    {submission.topic_text && (
                      <span className="block text-xs text-gray-500 mb-1">{submission.topic_text}</span>
                    )}
                    <span className="block truncate text-gray-900">
                      {submission.student_text || "(テキストなし)"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
