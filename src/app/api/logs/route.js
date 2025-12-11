import { NextResponse } from "next/server";
import { createServerClient } from "@/config/supabase";
import { HTTP_STATUS } from "@/config/errors";
import { extractStudentTextFromPrompt, parseAiResponseString } from "@/features/teacher-requests/utils/logParsers";

export const dynamic = "force-dynamic";

function jsonError(message, status, details) {
  if (status >= 500) {
    console.error("Teacher logs error:", details || message);
  }
  return NextResponse.json({ error: message }, { status });
}

function extractBearerToken(req) {
  const header = req.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.*)$/i);
  return match ? match[1]?.trim() : null;
}

export async function GET(req) {
  try {
    const accessToken = extractBearerToken(req);

    if (!accessToken) {
      return jsonError("Not authenticated. Please log in first.", HTTP_STATUS.UNAUTHORIZED);
    }

    const supabase = createServerClient();
    const { data: userData, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !userData?.user) {
      return jsonError("Not authenticated. Please log in first.", HTTP_STATUS.UNAUTHORIZED, authError);
    }

    const authId = userData.user.id;

    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("id, role")
      .eq("auth_id", authId)
      .maybeSingle();

    if (userError) {
      return jsonError("Failed to look up profile.", HTTP_STATUS.SERVER_ERROR, userError);
    }

    if (!userRecord) {
      return jsonError("Onboarding is required before accessing logs.", HTTP_STATUS.FORBIDDEN);
    }

    if (userRecord.role !== "teacher") {
      return jsonError("Teacher permissions are required.", HTTP_STATUS.FORBIDDEN);
    }

    const { data: teacherRecord, error: teacherError } = await supabase
      .from("teachers")
      .select("id, school_id")
      .eq("user_id", userRecord.id)
      .maybeSingle();

    if (teacherError) {
      return jsonError("Failed to load teacher profile.", HTTP_STATUS.SERVER_ERROR, teacherError);
    }

    if (!teacherRecord?.school_id) {
      return jsonError("Teacher profile is incomplete.", HTTP_STATUS.FORBIDDEN);
    }

    const searchParams = req.nextUrl.searchParams;
    const limitParam = Number.parseInt(searchParams.get("limit") || "50", 10);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 50;
    const classFilters = searchParams.getAll("classFilter").filter(Boolean);

    let query = supabase
      .from("writing_logs")
      .select("id, prompt, ai_response, created_at, tokens_in, tokens_out, class_id, school_id, is_guest")
      .eq("school_id", teacherRecord.school_id)
      .eq("is_guest", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (classFilters.length > 0) {
      query = query.in("class_id", classFilters);
    }

    const { data: logRows, error: logsError } = await query;

    if (logsError) {
      return jsonError("Failed to fetch writing logs.", HTTP_STATUS.SERVER_ERROR, logsError);
    }

    const classIds = Array.from(new Set((logRows || []).map((row) => row.class_id).filter(Boolean)));
    const classMap = new Map();

    if (classIds.length > 0) {
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("id, name")
        .in("id", classIds);

      if (classesError) {
        console.warn("Failed to load classes metadata", classesError);
      } else {
        (classesData || []).forEach((classRow) => {
          classMap.set(String(classRow.id), classRow.name || `Class ${classRow.id}`);
        });
      }
    }

    const entries = (logRows || []).map((row) => {
      const feedback = parseAiResponseString(row.ai_response);
      const mistakes = feedback?.mistakes ?? [];
      const hasCorrections = mistakes.length > 0;
      const isPerfectScore = !hasCorrections && (feedback?.overallScore ?? 0) >= 95;
      const classKey = row.class_id ? String(row.class_id) : null;

      return {
        id: row.id,
        createdAt: row.created_at,
        classCode: classKey ? classMap.get(classKey) || classKey : "未割当",
        studentText: extractStudentTextFromPrompt(row.prompt),
        feedback,
        tokensIn: row.tokens_in ?? 0,
        tokensOut: row.tokens_out ?? 0,
        hasCorrections,
        isPerfectScore
      };
    });

    const filterOptions = Array.from(classMap.entries()).map(([id, label]) => ({ id, label }));

    return NextResponse.json({
      data: entries,
      meta: {
        classFilters: filterOptions
      }
    });
  } catch (error) {
    console.error("Unexpected teacher logs failure", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", details: error.message },
      { status: HTTP_STATUS.SERVER_ERROR }
    );
  }
}
