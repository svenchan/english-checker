import { test } from "node:test";
import assert from "node:assert/strict";

import { getClassInfoResponse, ERROR_MESSAGES } from "../../src/app/api/classes/info/logic.js";

function buildSupabaseMock(maybeSingleImpl) {
  return {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: maybeSingleImpl
              };
            }
          };
        }
      };
    }
  };
}

test("returns 400 when joinToken is missing", async () => {
  const supabaseMock = buildSupabaseMock(async () => {
    throw new Error("should not reach Supabase when joinToken missing");
  });

  const result = await getClassInfoResponse("", supabaseMock);
  assert.equal(result.status, 400);
  assert.deepEqual(result.body, { error: ERROR_MESSAGES.MISSING_TOKEN });
});

test("returns 404 when class not found", async () => {
  const supabaseMock = buildSupabaseMock(async () => ({ data: null, error: null }));

  const result = await getClassInfoResponse("abc123", supabaseMock);
  assert.equal(result.status, 404);
  assert.deepEqual(result.body, { error: ERROR_MESSAGES.NOT_FOUND });
});

test("returns 200 with class info when found", async () => {
  const supabaseMock = buildSupabaseMock(async () => ({ data: { id: "uuid-1", name: "Class A" }, error: null }));

  const result = await getClassInfoResponse("valid", supabaseMock);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { classId: "uuid-1", className: "Class A" });
});

test("returns 500 when Supabase errors", async () => {
  const supabaseMock = buildSupabaseMock(async () => ({ data: null, error: new Error("boom") }));

  const result = await getClassInfoResponse("fails", supabaseMock);
  assert.equal(result.status, 500);
  assert.deepEqual(result.body, { error: ERROR_MESSAGES.DB_ERROR });
});
