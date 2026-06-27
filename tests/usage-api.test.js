import { test } from "node:test";
import assert from "node:assert/strict";
import { parseUsage, shouldSuggestSonnet } from "../src/usage-api.js";

const sample = {
  five_hour: { utilization: 54, resets_at: "2026-06-23T13:59:59.74Z" },
  seven_day: { utilization: 34, resets_at: "2026-06-23T16:59:59.74Z" },
  seven_day_sonnet: { utilization: 8, resets_at: "2026-06-23T16:59:59.74Z" },
  seven_day_opus: null,
};

test("maps the three buckets", () => {
  const u = parseUsage(sample);
  assert.equal(u.session.pct, 54);
  assert.equal(u.allModels.pct, 34);
  assert.equal(u.sonnet.pct, 8);
  assert.ok(u.session.resetsAt instanceof Date);
});

test("null bucket becomes null", () => {
  const u = parseUsage({ ...sample, seven_day_sonnet: null });
  assert.equal(u.sonnet, null);
});

test("missing session becomes null", () => {
  const u = parseUsage({});
  assert.equal(u.session, null);
});

test("clamps utilization to 0..100", () => {
  const u = parseUsage({ five_hour: { utilization: 142 } });
  assert.equal(u.session.pct, 100);
});

test("ignores a bucket without numeric utilization", () => {
  const u = parseUsage({ five_hour: { utilization: "x" } });
  assert.equal(u.session, null);
});

const usage = (allModels, sonnet) => ({
  session: { pct: 10 },
  allModels: allModels == null ? null : { pct: allModels },
  sonnet: sonnet == null ? null : { pct: sonnet },
});

test("suggests Sonnet when all-models maxed and Sonnet has room", () => {
  assert.equal(shouldSuggestSonnet(usage(96, 40)), true);
});

test("at the exact thresholds it still suggests", () => {
  assert.equal(shouldSuggestSonnet(usage(95, 80)), true);
});

test("no suggestion when all-models below threshold", () => {
  assert.equal(shouldSuggestSonnet(usage(90, 10)), false);
});

test("no suggestion when Sonnet is also high", () => {
  assert.equal(shouldSuggestSonnet(usage(99, 85)), false);
});

test("no suggestion when a bucket is missing", () => {
  assert.equal(shouldSuggestSonnet(usage(99, null)), false);
  assert.equal(shouldSuggestSonnet(usage(null, 10)), false);
});
