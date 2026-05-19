import { fetchChecks } from "@/lib/fetchChecks";
import { CHECKER_MODES } from "@/config/testMode";
import { TeacherPageClient } from "@/features/teacher/components/TeacherPageClient";

export const dynamic = "force-dynamic";

const VALID_FILTERS = new Set(["all", CHECKER_MODES.PRACTICE, CHECKER_MODES.TEST]);

export default async function TeacherPage({ searchParams }) {
  const rawFilter = searchParams?.mode || "all";
  const filter = VALID_FILTERS.has(rawFilter) ? rawFilter : "all";
  const initialSelectedId = searchParams?.id || null;

  const { checks, loadError, disabled } = await fetchChecks({ filter });

  return (
    <TeacherPageClient
      checks={checks}
      initialSelectedId={initialSelectedId}
      filter={filter}
      loadError={loadError}
      disabled={disabled}
    />
  );
}
