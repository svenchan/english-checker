import sql from "@/lib/db";

/**
 * Persist a completed check. Returns the new row id, or null if logging fails.
 */
export async function saveCheck({ studentText, topicText, mode, status, feedback }) {
  try {
    const rows = await sql`
      insert into checks (student_text, topic_text, mode, status, feedback)
      values (
        ${studentText},
        ${topicText},
        ${mode},
        ${status},
        ${sql.json(feedback ?? {})}
      )
      returning id
    `;
    return rows[0]?.id ?? null;
  } catch (error) {
    console.error("Failed to insert check:", error);
    return null;
  }
}
