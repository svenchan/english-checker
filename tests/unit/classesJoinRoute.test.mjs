import { test } from "node:test";
import assert from "node:assert/strict";

import { handleJoinClass, ERROR_MESSAGES } from "../../src/app/api/classes/join/logic.js";

function createSupabaseMock(options = {}) {
  const {
    userId = "auth-1",
    authError = null,
    studentRecord = { id: "student-1", class_id: null },
    studentError = null,
    classRecord = { id: "class-1", name: "Room A" },
    classError = null,
    updateError = null
  } = options;

  let lastUpdatePayload = null;

  const supabase = {
    auth: {
      getUser: async () => ({
        data: authError ? null : { user: { id: userId } },
        error: authError
      })
    },
    from(table) {
      if (table === "students") {
        return {
          select() {
            return {
              eq() {
                return {
                  maybeSingle: async () => ({
                    data: studentError ? null : studentRecord,
                    error: studentError
                  })
                };
              }
            };
          },
          update(payload) {
            lastUpdatePayload = payload;
            return {
              eq: async () => ({
                data: updateError ? null : { id: studentRecord?.id ?? "student" },
                error: updateError
              })
            };
          }
        };
      }

      if (table === "classes") {
        return {
          select() {
            return {
              eq() {
                return {
                  maybeSingle: async () => ({
                    data: classError ? null : classRecord,
                    error: classError
                  })
                };
              }
            };
          }
        };
      }

      throw new Error(`Unexpected table '${table}' requested in mock.`);
    }
  };

  return {
    supabase,
    getUpdatePayload: () => lastUpdatePayload
  };
}

function buildParams(overrides = {}) {
  return {
    joinToken: "token-123",
    accessToken: "access-token",
    ...overrides
  };
}

test("returns 400 when join token is missing", async () => {
  const { supabase } = createSupabaseMock();
  const result = await handleJoinClass(buildParams({ joinToken: "  " , supabaseClient: supabase }));
  assert.equal(result.status, 400);
  assert.deepEqual(result.body, { error: ERROR_MESSAGES.MISSING_TOKEN });
});

test("returns 401 when access token is missing", async () => {
  const { supabase } = createSupabaseMock();
  const result = await handleJoinClass(buildParams({ accessToken: "", supabaseClient: supabase }));
  assert.equal(result.status, 401);
  assert.deepEqual(result.body, { error: ERROR_MESSAGES.NOT_AUTHENTICATED });
});

test("returns 403 when user is not a student", async () => {
  const { supabase } = createSupabaseMock({ studentRecord: null });
  const result = await handleJoinClass(buildParams({ supabaseClient: supabase }));
  assert.equal(result.status, 403);
  assert.deepEqual(result.body, { error: ERROR_MESSAGES.NOT_STUDENT });
});

test("returns 404 when class token is invalid", async () => {
  const { supabase } = createSupabaseMock({ classRecord: null });
  const result = await handleJoinClass(buildParams({ supabaseClient: supabase }));
  assert.equal(result.status, 404);
  assert.deepEqual(result.body, { error: ERROR_MESSAGES.CLASS_NOT_FOUND });
});

test("returns 409 when student already has a class", async () => {
  const { supabase } = createSupabaseMock({ studentRecord: { id: "student-1", class_id: "class-xyz" } });
  const result = await handleJoinClass(buildParams({ supabaseClient: supabase }));
  assert.equal(result.status, 409);
  assert.deepEqual(result.body, { error: ERROR_MESSAGES.ALREADY_IN_CLASS });
});

test("returns 500 when student lookup fails", async () => {
  const supabaseMock = createSupabaseMock({ studentError: new Error("lookup failed") });
  const result = await handleJoinClass(buildParams({ supabaseClient: supabaseMock.supabase }));
  assert.equal(result.status, 500);
  assert.deepEqual(result.body, { error: ERROR_MESSAGES.DB_ERROR });
  assert.ok(result.logError instanceof Error);
});

test("successfully assigns student to class", async () => {
  const fixedTimestamp = "2024-05-01T12:00:00.000Z";
  const supabaseMock = createSupabaseMock();
  const result = await handleJoinClass(
    buildParams({
      supabaseClient: supabaseMock.supabase,
      now: () => fixedTimestamp
    })
  );

  assert.equal(result.status, 200);
  assert.deepEqual(result.body, {
    success: true,
    classId: "class-1",
    className: "Room A"
  });

  const updatePayload = supabaseMock.getUpdatePayload();
  assert.deepEqual(updatePayload, {
    class_id: "class-1",
    joined_at: fixedTimestamp
  });
});
