import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json(
    {
      error: "TEACHER_DASHBOARD_DISABLED",
      message: "Teacher dashboard requires the new Supabase auth flow and is temporarily unavailable."
    },
    { status: 503 }
  );
}
