import { NextResponse } from "next/server";
import { createServerClient } from "@/config/supabase";
import { HTTP_STATUS } from "@/config/errors";
import { getClassInfoResponse } from "./logic";

function respondWithError(message, status) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const joinToken = searchParams.get("joinToken")?.trim();

    const supabase = createServerClient();
    const { body, status, logError } = await getClassInfoResponse(joinToken, supabase);

    if (logError) {
      console.error("Failed to fetch class info:", logError);
    }

    return NextResponse.json(body, { status });
  } catch (error) {
    console.error("Classes info endpoint error:", error);
    return respondWithError("サーバーエラーが発生しました", HTTP_STATUS.SERVER_ERROR);
  }
}
