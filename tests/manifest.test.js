import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(ROOT, "manifest.json"), "utf8"));

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
const SIZES = ["16", "32", "48", "128"];

function collectIconPaths(m) {
  const paths = new Set();
  for (const p of Object.values(m.icons ?? {})) paths.add(p);
  for (const p of Object.values(m.action?.default_icon ?? {})) paths.add(p);
  return [...paths];
}

test("manifest declares icons and default_icon at 16/32/48/128", () => {
  for (const size of SIZES) {
    assert.ok(manifest.icons?.[size], `icons missing ${size}`);
    assert.ok(manifest.action?.default_icon?.[size], `default_icon missing ${size}`);
  }
});

test("every declared manifest icon path exists and is a PNG", () => {
  const paths = collectIconPaths(manifest);
  assert.ok(paths.length > 0, "no icon paths declared in manifest");
  for (const rel of paths) {
    const abs = join(ROOT, rel);
    assert.ok(existsSync(abs), `missing icon file: ${rel}`);
    assert.ok(statSync(abs).size > 0, `empty icon file: ${rel}`);
    const head = readFileSync(abs).subarray(0, 4);
    assert.ok(head.equals(PNG_MAGIC), `not a PNG: ${rel}`);
  }
});

test("status-api.js is web-accessible", () => {
  const res = manifest.web_accessible_resources[0].resources;
  assert.ok(res.includes("src/status-api.js"));
});

test("background service worker is an ES module", () => {
  assert.equal(manifest.background.type, "module");
});

test("declares the storage permission", () => {
  assert.ok((manifest.permissions ?? []).includes("storage"), "missing storage permission");
});
