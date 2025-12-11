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

    const { data: historyRows, error: logsError } = await supabase
      .from("writing_logs")
      .select("id, prompt, created_at")
      .eq("student_id", studentRecord.id)
      .eq("is_guest", false)
      .order("created_at", { ascending: false })
      .limit(STUDENT_HISTORY_LIMIT);

    if (logsError) {
      return jsonError("Failed to fetch writing history.", HTTP_STATUS.SERVER_ERROR, logsError);
    }

    return NextResponse.json({ data: historyRows || [] });
  } catch (error) {
    console.error("Unexpected student logs failure", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", details: error.message },
      { status: HTTP_STATUS.SERVER_ERROR }
    );
  }
}
