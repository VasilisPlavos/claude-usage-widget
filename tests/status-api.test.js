import { test } from "node:test";
import assert from "node:assert/strict";
import { parseStatus, statusDotClass } from "../src/status-api.js";

const operational = {
  status: { indicator: "none", description: "All Systems Operational" },
  incidents: [],
};

const outage = {
  status: { indicator: "major", description: "Partial System Outage" },
  incidents: [
    {
      name: "Elevated error rate across multiple models",
      impact: "minor",
      status: "monitoring",
      incident_updates: [{ body: "Elevated errors for Claude Opus 4.8" }],
    },
    {
      name: "We've suspended access to Claude Mythos 5 and Claude Fable 5",
      impact: "critical",
      status: "monitoring",
      incident_updates: [{ body: "Learn more here: https://example.com" }],
    },
  ],
};

test("operational maps to none + empty incidents", () => {
  const s = parseStatus(operational);
  assert.equal(s.indicator, "none");
  assert.equal(s.description, "All Systems Operational");
  assert.deepEqual(s.incidents, []);
});

test("reads incident name, impact, status and latest update body", () => {
  const s = parseStatus(outage);
  assert.equal(s.indicator, "major");
  assert.equal(s.incidents.length, 2);
  // sorted most-severe first → critical before minor
  assert.equal(s.incidents[0].impact, "critical");
  assert.equal(s.incidents[1].body, "Elevated errors for Claude Opus 4.8");
});

test("missing incident_updates yields empty body", () => {
  const s = parseStatus({
    status: { indicator: "minor", description: "Minor Outage" },
    incidents: [{ name: "X", impact: "minor", status: "investigating" }],
  });
  assert.equal(s.incidents[0].body, "");
});

test("malformed/empty json becomes unknown", () => {
  const s = parseStatus({});
  assert.equal(s.indicator, "unknown");
  assert.equal(s.description, "Status unavailable");
  assert.deepEqual(s.incidents, []);
});

test("null json becomes unknown", () => {
  const s = parseStatus(null);
  assert.equal(s.indicator, "unknown");
  assert.deepEqual(s.incidents, []);
});

test("unrecognized indicator becomes unknown", () => {
  const s = parseStatus({ status: { indicator: "weird", description: "?" } });
  assert.equal(s.indicator, "unknown");
});

test("maps indicators to dot classes", () => {
  assert.equal(statusDotClass("none"), "cu-dot--ok");
  assert.equal(statusDotClass("minor"), "cu-dot--minor");
  assert.equal(statusDotClass("major"), "cu-dot--major");
  assert.equal(statusDotClass("critical"), "cu-dot--critical");
  assert.equal(statusDotClass("unknown"), "cu-dot--unknown");
  assert.equal(statusDotClass("anything-else"), "cu-dot--unknown");
});
