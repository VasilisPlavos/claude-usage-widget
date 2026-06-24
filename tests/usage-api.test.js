import { test } from "node:test";
import assert from "node:assert/strict";
import { parseUsage } from "../src/usage-api.js";

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
