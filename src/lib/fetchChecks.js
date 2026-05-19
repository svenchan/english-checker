import sql from "@/lib/db";
import { CHECKER_MODES } from "@/config/testMode";

const SIDEBAR_LIMIT = 20;

function serializeCheck(row) {
  return {
    id: row.id,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    studentText: row.student_text ?? "",
    topicText: row.topic_text ?? null,
    mode: row.mode,
    status: row.status,
    feedback: row.feedback ?? {}
  };
}

export async function fetchChecks({ filter = "all", limit = SIDEBAR_LIMIT } = {}) {
  if (!process.env.DATABASE_URL) {
    return { checks: [], loadError: false, disabled: true };
  }

  try {
    const rows =
      filter === CHECKER_MODES.TEST
        ? await sql`
            select id, created_at, student_text, topic_text, mode, status, feedback
            from checks
            where mode = ${CHECKER_MODES.TEST}
            order by created_at desc
            limit ${limit}
          `
        : filter === CHECKER_MODES.PRACTICE
          ? await sql`
              select id, created_at, student_text, topic_text, mode, status, feedback
              from checks
              where mode = ${CHECKER_MODES.PRACTICE}
              order by created_at desc
              limit ${limit}
            `
          : await sql`
              select id, created_at, student_text, topic_text, mode, status, feedback
              from checks
              order by created_at desc
              limit ${limit}
            `;

    return {
      checks: rows.map(serializeCheck),
      loadError: false,
      disabled: false
    };
  } catch (error) {
    console.error("Failed to load checks:", error);
    return { checks: [], loadError: true, disabled: false };
  }
}

export async function fetchCheckById(id) {
  if (!process.env.DATABASE_URL || !id) {
    return null;
  }

  try {
    const rows = await sql`
      select id, created_at, student_text, topic_text, mode, status, feedback
      from checks
      where id = ${id}
      limit 1
    `;
    return rows[0] ? serializeCheck(rows[0]) : null;
  } catch (error) {
    console.error("Failed to load check:", error);
    return null;
  }
}
