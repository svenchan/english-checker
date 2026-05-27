import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  deleteSession,
  SESSION_COOKIE
} from "@/lib/auth";

export async function POST(request) {
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  await deleteSession(sessionId);
  const response = NextResponse.redirect(new URL("/", request.url));
  clearSessionCookie(response);
  return response;
}
