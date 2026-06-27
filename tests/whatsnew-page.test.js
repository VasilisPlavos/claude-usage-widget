import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

test("whatsnew page files exist", () => {
  for (const f of ["src/whatsnew.html", "src/whatsnew.css", "src/whatsnew-page.js"]) {
    assert.ok(existsSync(join(ROOT, f)), `missing ${f}`);
  }
});

test("whatsnew.html links its css + module script and has anchor nodes", () => {
  const html = read("src/whatsnew.html");
  assert.match(html, /href="whatsnew\.css"/);
  assert.match(html, /<script[^>]+type="module"[^>]+src="whatsnew-page\.js"/);
  assert.match(html, /id="wn-list"/);
  assert.match(html, /id="wn-optout"/);
});

test("whatsnew-page.js wires data, logic, and opt-out without innerHTML", () => {
  const js = read("src/whatsnew-page.js");
  assert.match(js, /from "\.\/whatsnew-data\.js"/);
  assert.match(js, /entriesSince/);
  assert.match(js, /whatsNewOptOut/);
  assert.doesNotMatch(js, /innerHTML/, "page must build DOM, not use innerHTML");
});
