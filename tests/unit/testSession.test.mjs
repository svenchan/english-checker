import test from "node:test";
import assert from "node:assert/strict";
import { TEST_MODE } from "../../src/config/testMode.js";
import { createTestSession, isValidTestSession } from "../../src/features/writing-checker/lib/testSession.js";

test("createTestSession defaults to a paused timer with a topic", () => {
  const now = Date.now();
  const session = createTestSession({ startedAt: now, id: "fixed" });
  assert.equal(session.id, "fixed");
  assert.equal(session.startedAt, now);
  assert.equal(session.started, false);
  assert.equal(session.endsAt, null);
  assert.equal(session.submitted, false);
  assert.ok(typeof session.topic === "string" && session.topic.length > 0);
});

test("createTestSession respects overrides and can start immediately", () => {
  const now = Date.now();
  const session = createTestSession({
    topic: "Custom topic",
    submitted: true,
    started: true,
    startedAt: now,
    id: "custom"
  });
  assert.equal(session.topic, "Custom topic");
  assert.equal(session.submitted, true);
  assert.equal(session.started, true);
  assert.equal(session.startedAt, now);
  assert.equal(session.endsAt, now + TEST_MODE.durationMs);
  assert.equal(session.id, "custom");
});

test("isValidTestSession validates structure", () => {
  const session = createTestSession();
  assert.ok(isValidTestSession(session));
  assert.equal(isValidTestSession({}), false);
  assert.equal(
    isValidTestSession({ ...session, topic: "", submitted: "nope" }),
    false
  );
  assert.equal(isValidTestSession({ ...session, started: "nope" }), false);
  assert.equal(
    isValidTestSession({ ...session, started: true, endsAt: "soon" }),
    false
  );
});
