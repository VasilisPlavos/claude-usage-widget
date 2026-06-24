import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STORE = join(ROOT, "marketing/store");
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const EXPECTED = [
  ["screenshot-1-hero.png", 1280, 800],
  ["screenshot-2-session.png", 1280, 800],
  ["screenshot-3-weekly.png", 1280, 800],
  ["screenshot-4-dark.png", 1280, 800],
  ["screenshot-5-button.png", 1280, 800],
  ["promo-small.png", 440, 280],
  ["promo-marquee.png", 1400, 560],
];

function pngSize(buf) {
  assert.ok(buf.subarray(0, 8).equals(PNG_SIG), "not a PNG");
  // IHDR: width = bytes 16..19, height = bytes 20..23 (big-endian)
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

for (const [name, w, h] of EXPECTED) {
  test(`${name} exists and is exactly ${w}x${h}`, () => {
    const p = join(STORE, name);
    assert.ok(existsSync(p), `missing store asset: ${name}`);
    const { width, height } = pngSize(readFileSync(p));
    assert.equal(width, w, `${name} width should be ${w}`);
    assert.equal(height, h, `${name} height should be ${h}`);
  });
}
