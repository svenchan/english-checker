import { NextResponse } from "next/server";
import { createServerClient } from "@/config/supabase";
import { HTTP_STATUS } from "@/config/errors";
import { handleJoinClass } from "./logic";

function extractBearerToken(headerValue) {
  if (!headerValue) return null;
  const match = headerValue.match(/^Bearer\s+(.*)$/i);
  return match ? match[1]?.trim() : null;
}

export async function POST(req) {
  try {
    const supabase = createServerClient();
    const body = (await req.json().catch(() => ({}))) ?? {};
    const joinToken = body.joinToken;
    const authHeader = req.headers.get("Authorization");
    const accessToken = extractBearerToken(authHeader);

    const result = await handleJoinClass({
      supabaseClient: supabase,
      joinToken,
      accessToken
    });

    if (result.logError) {
      console.error("Join class API error:", result.logError);
    }

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("Unexpected join class API error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: HTTP_STATUS.SERVER_ERROR }
    );
  }
}

export function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: HTTP_STATUS.METHOD_NOT_ALLOWED }
  );
}
