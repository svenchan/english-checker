// Minimal typings so TypeScript can understand the Deno global in this workspace.
declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

// @ts-ignore Remote import is resolved by Deno at deploy/runtime.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface CleanupResult {
  success: boolean;
  deletedCount: number;
  message?: string;
  error?: string;
}

const jsonResponse = (body: CleanupResult, init?: ResponseInit) =>
  new Response(JSON.stringify(body, null, 2), {
    headers: { "Content-Type": "application/json" },
    ...init
  });

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    const missing = !supabaseUrl && !serviceRoleKey
      ? "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
      : !supabaseUrl
        ? "SUPABASE_URL"
        : "SUPABASE_SERVICE_ROLE_KEY";

    return jsonResponse(
      {
        success: false,
        deletedCount: 0,
        error: `Missing Supabase credentials: ${missing}`
      },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const cutoffIso = thirtyDaysAgo.toISOString();

  try {
    const { error, count } = await supabase
      .from("writing_logs")
      .delete({ count: "exact" })
      .eq("is_guest", true)
      .lt("created_at", cutoffIso);

    if (error) {
      console.error("cleanup-guest-logs: delete failed", error);
      return jsonResponse(
        {
          success: false,
          deletedCount: 0,
          error: error.message || "Failed to delete guest logs"
        },
        { status: 500 }
      );
    }

    const deletedCount = count ?? 0;
    return jsonResponse({
      success: true,
      deletedCount,
      message: `Successfully deleted ${deletedCount} guest logs older than 30 days`
    });
  } catch (err) {
    console.error("cleanup-guest-logs: unexpected error", err);
    return jsonResponse(
      {
        success: false,
        deletedCount: 0,
        error: err instanceof Error ? err.message : "Unknown error"
      },
      { status: 500 }
    );
  }
});
