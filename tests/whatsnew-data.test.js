import { test } from "node:test";
import assert from "node:assert/strict";
import { CHANGELOG } from "../src/whatsnew-data.js";
import { compareVersions } from "../src/whatsnew.js";

test("changelog is non-empty and strictly newest-first", () => {
  assert.ok(CHANGELOG.length > 0);
  for (let i = 1; i < CHANGELOG.length; i++) {
    assert.equal(
      compareVersions(CHANGELOG[i - 1].version, CHANGELOG[i].version),
      1,
      `entry ${i - 1} (${CHANGELOG[i - 1].version}) should be newer than ${i} (${CHANGELOG[i].version})`
    );
  }
});

test("every entry has a version, date and non-empty string items", () => {
  for (const e of CHANGELOG) {
    assert.match(e.version, /^\d+(\.\d+)*$/, `bad version: ${e.version}`);
    assert.ok(typeof e.date === "string" && e.date.length > 0, "missing date");
    assert.ok(Array.isArray(e.items) && e.items.length > 0, "missing items");
    for (const it of e.items) {
      assert.ok(typeof it === "string" && it.length > 0, "empty item");
    }
  }
});
