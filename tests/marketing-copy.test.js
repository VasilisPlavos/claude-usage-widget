import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

test("short description is non-empty and within Chrome's 132-char limit", () => {
  const short = read("marketing/copy/short-description.txt").trim();
  assert.ok(short.length > 0, "short description is empty");
  assert.ok(short.length <= 132, `short description is ${short.length} chars (max 132)`);
});

test("store-listing.md contains every required section", () => {
  const md = read("marketing/copy/store-listing.md");
  for (const needle of [
    "Detailed description",
    "Single-purpose",
    "permission",
    "Privacy",
  ]) {
    assert.ok(md.includes(needle), `store-listing.md missing: ${needle}`);
  }
});
