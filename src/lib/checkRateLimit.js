export const CHECK_RATE_LIMIT_SECONDS = 60;

async function getSql() {
  const { default: sql } = await import("./db.js");
  return sql;
}

/**
 * Seconds until a session may check again, at least 1.
 * @param {Date|string|number|null} lastCheckedAt
 * @param {number} [nowMs]
 */
export function retryAfterFromTimestamp(lastCheckedAt, nowMs = Date.now()) {
  const lastMs =
    lastCheckedAt instanceof Date
      ? lastCheckedAt.getTime()
      : lastCheckedAt
        ? new Date(lastCheckedAt).getTime()
        : Number.NaN;

  if (!Number.isFinite(lastMs)) {
    return CHECK_RATE_LIMIT_SECONDS;
  }

  const remaining = CHECK_RATE_LIMIT_SECONDS - (nowMs - lastMs) / 1000;
  return Math.max(1, Math.ceil(remaining));
}

/**
 * Atomically consume one check slot for this guest session.
 * Fail-open if the table is missing so a pending migration cannot block the checker.
 * @param {string} sessionId
 */
export async function tryConsumeCheckRateLimit(sessionId) {
  if (!sessionId) {
    return { limited: false, acquired: false, sessionId: null, previousCheckedAt: null };
  }

  try {
    const sql = await getSql();
    const [row] = await sql`
      with previous as (
        select last_checked_at
        from check_rate_limits
        where session_id = ${sessionId}
      ),
      upserted as (
        insert into check_rate_limits (session_id, last_checked_at)
        values (${sessionId}, now())
        on conflict (session_id) do update
          set last_checked_at = excluded.last_checked_at
          where check_rate_limits.last_checked_at
            <= now() - ${CHECK_RATE_LIMIT_SECONDS} * interval '1 second'
        returning session_id
      )
      select
        (select last_checked_at from previous) as previous_checked_at,
        exists(select 1 from upserted) as consumed
    `;

    if (!row?.consumed) {
      return {
        limited: true,
        acquired: false,
        sessionId,
        previousCheckedAt: row?.previous_checked_at ?? null,
        retryAfterSeconds: retryAfterFromTimestamp(row?.previous_checked_at)
      };
    }

    return {
      limited: false,
      acquired: true,
      sessionId,
      previousCheckedAt: row.previous_checked_at ?? null
    };
  } catch (error) {
    console.error("Failed to apply check rate limit:", error);
    return { limited: false, acquired: false, sessionId, previousCheckedAt: null };
  }
}

/**
 * Undo a consumed slot after a Groq failure so the student can retry.
 * @param {string} sessionId
 * @param {Date|string|null} previousCheckedAt
 */
export async function releaseCheckRateLimit(sessionId, previousCheckedAt) {
  if (!sessionId) return;

  try {
    const sql = await getSql();
    if (previousCheckedAt) {
      await sql`
        update check_rate_limits
        set last_checked_at = ${previousCheckedAt}
        where session_id = ${sessionId}
      `;
      return;
    }

    await sql`
      delete from check_rate_limits
      where session_id = ${sessionId}
    `;
  } catch (error) {
    console.error("Failed to release check rate limit:", error);
  }
}
