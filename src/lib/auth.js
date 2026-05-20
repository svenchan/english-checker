import { randomUUID } from "node:crypto";
import sql from "@/lib/db";
import {
  SESSION_COOKIE,
  SESSION_DAYS,
  sessionCookieOptions
} from "@/lib/authConstants";
import { cookies } from "next/headers";

export { SESSION_COOKIE, sessionCookieOptions };

export async function findTeacherByUsername(username) {
  const rows = await sql`
    select id, password_hash
    from teachers
    where username = ${username}
    limit 1
  `;
  return rows[0] ?? null;
}

export async function createSession(teacherId) {
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await sql`
    insert into sessions (id, teacher_id, expires_at)
    values (${sessionId}, ${teacherId}, ${expiresAt})
  `;
  return sessionId;
}


//Checks if session_cookie is true keep user logged in
export async function getSession(request) {
  let sessionId;

  if (request) {
    sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  } else {
    const cookieStore = cookies();
    sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  }

  if (!sessionId) return null;

  const rows = await sql`
    select id, teacher_id
    from sessions
    where id = ${sessionId}
    and expires_at > now()
    limit 1
  `;

  return rows[0] ?? null;
}

export async function deleteSession(sessionId) {
  if (!sessionId) return;
  await sql`
    delete from sessions
    where id = ${sessionId}
  `;
}

export function setSessionCookie(response, sessionId) {
  response.cookies.set(SESSION_COOKIE, sessionId, sessionCookieOptions());
}

export function clearSessionCookie(response) {
  response.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(),
    maxAge: 0
  });
}
