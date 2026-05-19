import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  createSession,
  findTeacherByUsername,
  setSessionCookie
} from "@/lib/auth";

async function readCredentials(request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    return {
      username: typeof body.username === "string" ? body.username.trim() : "",
      password: typeof body.password === "string" ? body.password : ""
    };
  }

  const formData = await request.formData();
  const username = formData.get("username");
  const password = formData.get("password");
  return {
    username: typeof username === "string" ? username.trim() : "",
    password: typeof password === "string" ? password : ""
  };
}

export async function POST(request) {
  const { username, password } = await readCredentials(request);

  if (!username || !password) {
    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 401 }
    );
  }

  const teacher = await findTeacherByUsername(username);
  if (!teacher) {
    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 401 }
    );
  }

  const passwordMatches = await bcrypt.compare(password, teacher.password_hash);
  if (!passwordMatches) {
    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 401 }
    );
  }

  const sessionId = await createSession(teacher.id);
  const response = NextResponse.redirect(new URL("/teacher", request.url));
  setSessionCookie(response, sessionId);
  return response;
}
