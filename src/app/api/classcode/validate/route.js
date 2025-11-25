import { NextResponse } from "next/server";
import { isValidClassCode } from "@/config/classCodeMap";
import { ERRORS, HTTP_STATUS } from "@/config/errors";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const classCode = body?.classCode?.toUpperCase?.();

    if (!classCode) {
      return NextResponse.json({ error: ERRORS.NO_CLASS_CODE }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    if (!isValidClassCode(classCode)) {
      return NextResponse.json({ error: ERRORS.INVALID_CLASS_CODE }, { status: HTTP_STATUS.UNAUTHORIZED });
    }

    return NextResponse.json({ ok: true }, { status: HTTP_STATUS.OK });
  } catch (error) {
    console.error("Class code validation error:", error);
    return NextResponse.json(
      { error: ERRORS.SERVER_ERROR, details: error.message },
      { status: HTTP_STATUS.SERVER_ERROR }
    );
  }
}
