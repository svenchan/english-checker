import { NextResponse } from "next/server";
import { createServerClient } from "@/config/supabase";
import { isValidClassCode } from "@/config/classCodeMap";
import { parseAiResponseString, extractStudentTextFromPrompt } from "@/features/teacher-requests/utils/logParsers";

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

export async function GET(req) {
  const classCodeHeader = req.headers.get("x-class-code")?.trim().toUpperCase();
  if (classCodeHeader !== "TEACHER") {
    return NextResponse.json({ error: "TEACHER_ONLY" }, { status: 401 });
  }

  const hasSupabaseEnv = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!hasSupabaseEnv) {
    return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const limitParam = Number(searchParams.get("limit"));
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(Math.floor(limitParam), 1), MAX_LIMIT)
    : DEFAULT_LIMIT;
  const filterValues = searchParams.getAll("classFilter").map((value) => value?.trim().toUpperCase()).filter(Boolean);
  const validFilters = [...new Set(filterValues.filter((value) => isValidClassCode(value)))];

  try {
    const supabase = createServerClient();
    let query = supabase
      .from("writing_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (validFilters.length > 0) {
      query = query.in("class_code", validFilters);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const normalized = (data || []).map((row) => {
      const feedback = parseAiResponseString(row.ai_response || "");
      const studentText = row.student_text || extractStudentTextFromPrompt(row.prompt || "");
      const tokensIn = Number(row.tokens_in) || 0;
      const tokensOut = Number(row.tokens_out) || 0;

      return {
        id: row.id,
        createdAt: row.created_at,
        classCode: row.class_code,
        studentText,
        feedback,
        tokensIn,
        tokensOut,
        hasCorrections: feedback.mistakes.length > 0,
        isPerfectScore: feedback.mistakes.length === 0 && feedback.overallScore >= 100,
      };
    });

    return NextResponse.json({ data: normalized });
  } catch (error) {
    console.error("Failed to fetch writing logs", error);
    return NextResponse.json({ error: "ログの取得中にエラーが発生しました" }, { status: 500 });
  }
}
