import { neon } from "@neondatabase/serverless";

export async function isSessionValid(sessionId) {
  if (!sessionId || !process.env.DATABASE_URL) return false;
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`
    select 1
    from sessions
    where id = ${sessionId}
      and expires_at > now()
    limit 1
  `;
  return rows.length > 0;
}
