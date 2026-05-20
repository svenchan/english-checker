// is called by header and checks for valid session_cookie
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request) {
  const session = await getSession(request);
  if (session) {
    return NextResponse.json({ loggedIn: true });
  }
  return NextResponse.json({ loggedIn: false });
}