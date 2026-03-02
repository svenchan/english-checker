import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * When "true", all Supabase reads and writes are no-ops. Use this while the
 * Supabase project is paused so students still get AI feedback. To re-enable
 * later: set SUPABASE_DISABLED=false (or remove it), ensure URL and service
 * role key are set, and redeploy.
 */
const SUPABASE_DISABLED = process.env.SUPABASE_DISABLED === "true";

export function isSupabaseEnabled() {
  return !SUPABASE_DISABLED && Boolean(supabaseUrl && supabaseServiceRoleKey);
}

const emptyResult = { data: null, error: null };
const emptyListResult = { data: [], error: null };
/** Fake submission id when Supabase is disabled so the check route can continue without DB. */
const STUB_SUBMISSION_ID = "supabase-disabled";

function makeThenable(value) {
  return {
    then(onFulfilled) {
      return Promise.resolve(value).then(onFulfilled);
    },
    catch(onRejected) {
      return Promise.resolve(value).catch(onRejected);
    }
  };
}

function createStubClient() {
  const chain = {
    select() {
      return chain;
    },
    insert() {
      return chain;
    },
    update() {
      return chain;
    },
    eq() {
      return chain;
    },
    order() {
      return chain;
    },
    limit() {
      return makeThenable(emptyListResult);
    },
    single() {
      return makeThenable({ data: { id: STUB_SUBMISSION_ID }, error: null });
    },
    then(onFulfilled, onRejected) {
      return Promise.resolve(emptyResult).then(onFulfilled, onRejected);
    },
    catch(onRejected) {
      return Promise.resolve(emptyResult).catch(onRejected);
    }
  };
  return {
    from() {
      return chain;
    }
  };
}

export const supabaseAdmin =
  SUPABASE_DISABLED
    ? createStubClient()
    : supabaseUrl && supabaseServiceRoleKey
      ? createClient(supabaseUrl, supabaseServiceRoleKey, {
          auth: { persistSession: false }
        })
      : null;
