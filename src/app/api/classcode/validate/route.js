import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json(
    {
      error: "CLASS_CODES_REMOVED",
      message: "Class code validation is no longer supported. All users run in guest mode."
    },
    { status: 410 }
  );
}
