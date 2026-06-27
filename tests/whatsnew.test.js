import { test } from "node:test";
import assert from "node:assert/strict";
import {
  compareVersions,
  entriesSince,
  hasUpdatesSince,
  shouldOpenWhatsNew,
} from "../src/whatsnew.js";

const CL = [
  { version: "1.2.0", date: "2026-06-27", items: ["c"] },
  { version: "1.1.0", date: "2026-06-01", items: ["b"] },
  { version: "1.0.0", date: "2026-05-01", items: ["a"] },
];

test("compareVersions orders numerically, not lexically", () => {
  assert.equal(compareVersions("1.2.0", "1.1.0"), 1);
  assert.equal(compareVersions("1.1.0", "1.2.0"), -1);
  assert.equal(compareVersions("1.1.0", "1.1.0"), 0);
  assert.equal(compareVersions("1.10.0", "1.9.0"), 1); // not "1.10" < "1.9"
  assert.equal(compareVersions("1.2", "1.2.0"), 0); // missing segs == 0
  assert.equal(compareVersions("1.2.1", "1.2"), 1);
});

test("compareVersions tolerates non-numeric segments", () => {
  assert.equal(compareVersions("abc", "1.0.0"), -1);
  assert.equal(compareVersions("1.x", "1.0"), 0);
});

test("entriesSince returns only strictly-newer entries", () => {
  assert.deepEqual(entriesSince(CL, "1.1.0").map((e) => e.version), ["1.2.0"]);
  assert.deepEqual(entriesSince(CL, "1.0.0").map((e) => e.version), ["1.2.0", "1.1.0"]);
  assert.deepEqual(entriesSince(CL, "1.2.0"), []); // equal is not newer
});

test("entriesSince returns [] for missing/invalid since", () => {
  assert.deepEqual(entriesSince(CL, ""), []);
  assert.deepEqual(entriesSince(CL, undefined), []);
  assert.deepEqual(entriesSince(CL, "not-a-version"), []);
});

test("hasUpdatesSince mirrors entriesSince", () => {
  assert.equal(hasUpdatesSince(CL, "1.1.0"), true);
  assert.equal(hasUpdatesSince(CL, "1.2.0"), false);
  assert.equal(hasUpdatesSince(CL, ""), false);
});

test("shouldOpenWhatsNew: only on update, not opted out, with new content", () => {
  assert.equal(shouldOpenWhatsNew({ reason: "update", previousVersion: "1.1.0", optedOut: false }, CL), true);
  assert.equal(shouldOpenWhatsNew({ reason: "install", previousVersion: undefined, optedOut: false }, CL), false);
  assert.equal(shouldOpenWhatsNew({ reason: "update", previousVersion: "1.1.0", optedOut: true }, CL), false);
  assert.equal(shouldOpenWhatsNew({ reason: "update", previousVersion: "1.2.0", optedOut: false }, CL), false);
});
