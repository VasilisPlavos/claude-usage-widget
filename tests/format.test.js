import { test } from "node:test";
import assert from "node:assert/strict";
import { formatResetCountdown } from "../src/format.js";

const base = new Date("2026-06-23T12:00:00Z");
const inMin = (m) => new Date(base.getTime() + m * 60000);

test("minutes only", () => {
  assert.equal(formatResetCountdown(inMin(42), base), "Resets in 42 min");
});
test("hours and minutes", () => {
  assert.equal(formatResetCountdown(inMin(222), base), "Resets in 3 hr 42 min");
});
test("whole hours drop the minutes", () => {
  assert.equal(formatResetCountdown(inMin(120), base), "Resets in 2 hr");
});
test("exactly 60 minutes", () => {
  assert.equal(formatResetCountdown(inMin(60), base), "Resets in 1 hr");
});
test("under one minute", () => {
  assert.equal(formatResetCountdown(new Date(base.getTime() + 30000), base), "Resets in <1 min");
});
test("already passed", () => {
  assert.equal(formatResetCountdown(inMin(-5), base), "Resetting…");
});
test("exactly at reset", () => {
  assert.equal(formatResetCountdown(base, base), "Resetting…");
});
