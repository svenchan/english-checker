import test from "node:test";
import assert from "node:assert/strict";
import {
  CHECK_RATE_LIMIT_SECONDS,
  retryAfterFromTimestamp
} from "../../src/lib/checkRateLimit.js";

test("retryAfterFromTimestamp returns the full window when last check is missing", () => {
  assert.equal(retryAfterFromTimestamp(null), CHECK_RATE_LIMIT_SECONDS);
});

test("retryAfterFromTimestamp rounds remaining seconds up", () => {
  const now = Date.parse("2026-11-05T05:00:00.000Z");
  const lastCheckedAt = new Date(now - 10_400);
  assert.equal(retryAfterFromTimestamp(lastCheckedAt, now), 50);
});

test("retryAfterFromTimestamp never goes below 1", () => {
  const now = Date.parse("2026-11-05T05:00:00.000Z");
  const lastCheckedAt = new Date(now - 90_000);
  assert.equal(retryAfterFromTimestamp(lastCheckedAt, now), 1);
});
