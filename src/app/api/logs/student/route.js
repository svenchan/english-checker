import { NextResponse } from "next/server";
import { createServerClient } from "@/config/supabase";
import { HTTP_STATUS } from "@/config/errors";

export const dynamic = "force-dynamic";

const STUDENT_HISTORY_LIMIT = 20;

function jsonError(message, status, details) {
  if (status >= 500) {
    console.error("Student logs error:", details || message);
  }

  return NextResponse.json({ error: message }, { status });
}

function extractBearerToken(req) {
  const header = req.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.*)$/i);
  return match ? match[1]?.trim() : null;
}

async function getAuthenticatedUser(req, supabase) {
  const accessToken = extractBearerToken(req);

  if (!accessToken) {
    return {
      error: jsonError("Not authenticated. Please log in first.", HTTP_STATUS.UNAUTHORIZED)
    };
  }

  const { data: userData, error: authError } = await supabase.auth.getUser(accessToken);

  if (authError || !userData?.user) {
    return {
      error: jsonError(
        "Not authenticated. Please log in first.",
        HTTP_STATUS.UNAUTHORIZED,
        authError || "No user found"
      )
    };
  }

  return { accessToken, authUser: userData.user };
}

export async function GET(req) {
  try {
    const supabase = createServerClient();
    const { error, authUser } = await getAuthenticatedUser(req, supabase);

    if (error) {
      return error;
    }

    const authId = authUser.id;

    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", authId)
      .maybeSingle();

    if (userError) {
      return jsonError("Failed to look up profile.", HTTP_STATUS.SERVER_ERROR, userError);
    }

    if (!userRecord) {
      return jsonError("Onboarding is required before accessing history.", HTTP_STATUS.FORBIDDEN);
    }

    const { data: studentRecord, error: studentError } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", userRecord.id)
      .maybeSingle();

    if (studentError) {
      return jsonError("Failed to load student profile.", HTTP_STATUS.SERVER_ERROR, studentError);
    }

    if (!studentRecord?.id) {
      return jsonError("Student profile is required before viewing history.", HTTP_STATUS.FORBIDDEN);
    }

    const { data: allLogsForStudent, error: checkError } = await supabase
      .from("writing_logs")
      .select("id, created_at, is_guest")
      .eq("student_id", studentRecord.id);

    console.log("[/api/logs/student] DEBUG - All logs for this student (no filters):", {
      count: allLogsForStudent?.length,
      student_id: studentRecord.id,
      error: checkError,
      ids: allLogsForStudent?.map((log) => ({
        id: log.id,
        is_guest: log.is_guest,
        created_at: log.created_at
      }))
    });

    if (checkError) {
      return jsonError("Failed to inspect writing history.", HTTP_STATUS.SERVER_ERROR, checkError);
    }

    const sortedLogIds = (allLogsForStudent || [])
      .filter((log) => log.is_guest === false)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, STUDENT_HISTORY_LIMIT)
      .map((log) => log.id);

    if (sortedLogIds.length === 0) {
      console.log("[/api/logs/student] No non-guest logs available for student", studentRecord.id);
      return NextResponse.json({ data: [] });
    }

    const { data: historyRowsRaw, error: logsError } = await supabase
      .from("writing_logs")
      .select("id, prompt, student_text, created_at")
      .in("id", sortedLogIds);

    if (logsError) {
      return jsonError("Failed to fetch writing history.", HTTP_STATUS.SERVER_ERROR, logsError);
    }

    const historyRowsMap = new Map((historyRowsRaw || []).map((row) => [row.id, row]));
    const historyRows = sortedLogIds.map((id) => historyRowsMap.get(id)).filter(Boolean);

    console.log("[/api/logs/student] Query details:", {
      studentRecord_id: studentRecord.id,
      query_filter: `student_id=${studentRecord.id}, is_guest=false`,
      limit: STUDENT_HISTORY_LIMIT,
      requested_ids: sortedLogIds,
      results_count: historyRows.length,
      first_result_id: historyRows[0]?.id,
      last_result_id: historyRows[historyRows.length - 1]?.id,
      returned_created_at: historyRows.map((row) => row.created_at)
    });

    return NextResponse.json({ data: historyRows });
  } catch (error) {
    console.error("Unexpected student logs failure", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", details: error.message },
      { status: HTTP_STATUS.SERVER_ERROR }
    );
  }
}
