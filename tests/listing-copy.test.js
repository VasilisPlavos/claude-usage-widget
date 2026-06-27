import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const md = readFileSync(join(ROOT, "files/design/LISTING-COPY.md"), "utf8");

// Return the body lines of a "## <title>…" section, up to the next "## " header.
function section(title) {
  const lines = md.split("\n");
  const start = lines.findIndex(
    (l) => l.startsWith("## ") && l.slice(3).trim().startsWith(title),
  );
  if (start === -1) return "";
  const body = [];
  for (let j = start + 1; j < lines.length; j++) {
    if (lines[j].startsWith("## ")) break;
    body.push(lines[j]);
  }
  return body.join("\n");
}

test("short description has candidates, all within Chrome's 132-char limit", () => {
  const candidates = section("Short description")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.endsWith(":") && !l.startsWith(">"));
  assert.ok(candidates.length > 0, "no short description candidates found");
  for (const c of candidates) {
    assert.ok(c.length <= 132, `short description is ${c.length} chars (max 132): ${c}`);
  }
});

test("listing contains every required submission section", () => {
  for (const needle of [
    "Detailed description",
    "Single-purpose",
    "permission",
    "Privacy",
  ]) {
    assert.ok(md.includes(needle), `LISTING-COPY.md missing: ${needle}`);
  }
});
