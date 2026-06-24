import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const T = join(ROOT, "marketing/templates");

const TEMPLATES = [
  ["screenshot.html", 1280, 800],
  ["promo-small.html", 440, 280],
  ["promo-marquee.html", 1400, 560],
];

test("each template declares exact render dimensions and links the shared stylesheet", () => {
  for (const [file, w, h] of TEMPLATES) {
    const html = readFileSync(join(T, file), "utf8");
    assert.ok(html.includes(`data-render-width="${w}"`), `${file} missing width ${w}`);
    assert.ok(html.includes(`data-render-height="${h}"`), `${file} missing height ${h}`);
    assert.ok(html.includes('href="marketing.css"'), `${file} must link marketing.css`);
  }
});

test("screenshot template defines all five shots", () => {
  const html = readFileSync(join(T, "screenshot.html"), "utf8");
  for (const n of ["1", "2", "3", "4", "5"]) {
    assert.ok(new RegExp(`"${n}"\\s*:`).test(html), `screenshot.html missing shot ${n}`);
  }
});
