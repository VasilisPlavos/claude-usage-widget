# Claude Usage PiP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Chrome MV3 extension that pops out a small Document Picture-in-Picture widget showing claude.ai session + weekly usage, live.

**Architecture:** A content script on `claude.ai` (loaded as an ES module via a thin classic-script loader) owns everything: it fetches usage same-origin with the user's cookies, opens a Document PiP window on a user gesture, renders three progress bars, and keeps them updated. A thin service worker forwards toolbar-icon clicks into the page via `chrome.scripting.executeScript` (which carries the click's user activation) to call the same toggle function the in-page floating button uses.

**Tech Stack:** Manifest V3, plain JavaScript ES modules (no build step), Document Picture-in-Picture API, Node's built-in test runner for pure-logic unit tests.

## Global Constraints

These apply to every task. Exact values from the spec:

- **Chrome/Edge 116+** required (Document PiP). `manifest.json` sets `"minimum_chrome_version": "116"`.
- **No build step.** Plain ES modules loaded directly; load-unpacked extension.
- **Node 18+** for tests (`node --test`, built-in `fetch`).
- **Data source:** same-origin from the content script with `credentials: "include"`.
  - Org id: `GET /api/organizations` → `[0].uuid`.
  - Usage: `GET /api/organizations/{orgId}/usage`.
  - Fields: `five_hour` → Current session; `seven_day` → All models; `seven_day_sonnet` → Sonnet only. Each has `utilization` (0–100) and `resets_at` (ISO). `null` bucket → omit that row.
- **Theme:** mirror `document.documentElement`'s `data-mode` attribute (`"light"`/`"dark"`), and copy Claude's `:root` HSL token variables into the PiP document. Re-sync on `data-mode` mutation.
- **Countdown wording** (matches claude.ai): `>=60 min` → `"Resets in H hr M min"` (drop `M` when 0 → `"Resets in H hr"`); `1–59 min` → `"Resets in N min"`; `<1 min` → `"Resets in <1 min"`; `<=0` → `"Resetting…"`.
- **Window position is NOT script-controllable.** Request size only (~280×200); Chrome places the window.
- **Requires an open claude.ai tab** (the PiP opener). Closing the last one closes the widget.
- **v1 omits custom icons** — Chrome's default action icon is used (avoids shipping binary assets; documented in README as a future addition). This refines the spec, which listed icons.
- **Permissions:** `"scripting"` + `host_permissions: ["https://claude.ai/*"]` (the host permission lets the service worker query and inject into claude.ai tabs even when another tab is active). This refines the spec's permissions note.

---

## File Structure

```
claude-usage-pip/
├── package.json              # type:module, "test": "node --test"
├── manifest.json             # MV3
├── src/
│   ├── loader.js             # classic content script; dynamic-imports content.js as a module
│   ├── content.js            # ESM orchestrator; exposes window.claudeUsagePip {open,close,toggle}
│   ├── usage-api.js          # ESM; parseUsage(json), fetchOrgId(), fetchUsage(orgId)
│   ├── format.js             # ESM; formatResetCountdown(resetsAt, now)
│   ├── widget.js             # ESM; mountWidget(doc), renderUsage(card,data,now), renderMessage(card,msg)
│   ├── widget.css.js         # ESM; export const WIDGET_CSS
│   ├── theme.js              # ESM; readClaudePalette(), applyPalette(doc,palette), observeTheme(cb)
│   └── button.js             # ESM; injectButton(onClick), setButtonActive(active)
├── tests/
│   ├── usage-api.test.js
│   ├── format.test.js
│   └── manual/widget-preview.html   # manual render harness (no extension needed)
├── docs/superpowers/{specs,plans}/...
└── README.md
```

Module boundaries: `usage-api` and `format` are pure (no DOM/`chrome`), unit-tested in Node. `widget`, `theme`, `button` are browser DOM utilities. `content.js` is the only orchestrator; `background.js` is the only `chrome.*` consumer besides `loader.js`'s `chrome.runtime.getURL`.

---

## Task 1: Scaffold + toolbar gesture-forwarding spike

**Why first:** The toolbar path depends on `chrome.scripting.executeScript` forwarding the action-click's user activation into the page so `documentPictureInPicture.requestWindow()` is allowed. Prove this before building anything else. Deliverable: clicking the toolbar icon on claude.ai opens an empty PiP window; clicking again closes it.

**Files:**
- Create: `package.json`, `manifest.json`, `src/loader.js`, `src/background.js`, `src/content.js`
- Test: manual (browser)

**Interfaces:**
- Produces: `window.claudeUsagePip = { open, close, toggle }` in the claude.ai isolated world (the spike stub; replaced in Task 7). Service worker injects `() => window.claudeUsagePip.toggle()`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "claude-usage-pip",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 2: Create `manifest.json`**

```json
{
  "manifest_version": 3,
  "name": "Claude Usage PiP",
  "version": "1.0.0",
  "description": "Floating picture-in-picture widget showing your claude.ai usage.",
  "minimum_chrome_version": "116",
  "action": { "default_title": "Toggle Claude usage widget" },
  "background": { "service_worker": "src/background.js" },
  "content_scripts": [
    {
      "matches": ["https://claude.ai/*"],
      "js": ["src/loader.js"],
      "run_at": "document_idle"
    }
  ],
  "permissions": ["scripting"],
  "host_permissions": ["https://claude.ai/*"],
  "web_accessible_resources": [
    {
      "resources": [
        "src/content.js", "src/usage-api.js", "src/format.js",
        "src/widget.js", "src/widget.css.js", "src/theme.js", "src/button.js"
      ],
      "matches": ["https://claude.ai/*"]
    }
  ]
}
```

- [ ] **Step 3: Create `src/loader.js`** (classic content script that imports the ESM entrypoint)

```js
// Classic content script. Dynamic-import the ES module entrypoint into the
// extension's isolated world so the rest of the code can use ES modules.
import(chrome.runtime.getURL("src/content.js")).catch((e) =>
  console.error("[Claude Usage PiP] loader failed to import content.js:", e)
);
```

- [ ] **Step 4: Create `src/content.js`** (spike stub — replaced in Task 7)

```js
// SPIKE STUB — replaced by the full orchestrator in Task 7.
let pipWindow = null;

async function open() {
  if (pipWindow) { pipWindow.focus(); return; }
  if (!("documentPictureInPicture" in window)) {
    console.warn("[Claude Usage PiP] Document PiP unsupported in this browser.");
    return;
  }
  pipWindow = await documentPictureInPicture.requestWindow({ width: 280, height: 200 });
  const b = pipWindow.document.body;
  b.style.font = "13px system-ui, sans-serif";
  b.style.padding = "12px";
  b.textContent = "Claude Usage PiP — spike OK";
  pipWindow.addEventListener("pagehide", () => { pipWindow = null; });
}

function close() { if (pipWindow) pipWindow.close(); }
function toggle() { if (pipWindow) close(); else open(); }

window.claudeUsagePip = { open, close, toggle };
console.log("[Claude Usage PiP] content stub ready");
```

- [ ] **Step 5: Create `src/background.js`** (minimal toolbar driver — replaced in Task 8)

```js
// Minimal service worker for the spike. Replaced by the full version in Task 8.
chrome.action.onClicked.addListener(async (activeTab) => {
  const target = await pickClaudeTab(activeTab);
  if (!target) {
    console.warn("[Claude Usage PiP] no claude.ai tab open");
    return;
  }
  try {
    await chrome.scripting.executeScript({
      target: { tabId: target.id },
      func: () => window.claudeUsagePip && window.claudeUsagePip.toggle(),
    });
  } catch (e) {
    console.error("[Claude Usage PiP] executeScript failed:", e);
  }
});

async function pickClaudeTab(activeTab) {
  if (activeTab && activeTab.url && activeTab.url.startsWith("https://claude.ai/")) {
    return activeTab;
  }
  const tabs = await chrome.tabs.query({ url: "https://claude.ai/*" });
  return tabs[0] || null;
}
```

- [ ] **Step 6: Load the unpacked extension**

In Chrome: `chrome://extensions` → enable Developer mode → "Load unpacked" → select the `claude-usage-pip` folder. Confirm no manifest errors and the service worker is "active".

- [ ] **Step 7: Manual verification — the spike**

1. Open `https://claude.ai/` in a tab and sign in.
2. Click the extension's toolbar icon.
3. **Expected:** a small floating window opens showing "Claude Usage PiP — spike OK".
4. Click the toolbar icon again. **Expected:** the window closes.
5. Open DevTools on the claude.ai tab; confirm no "requires user gesture" error in the console.

**Decision point (record the outcome in the commit message):**
- **PASS** (window opens): gesture forwarding works; proceed as planned.
- **FAIL** (`requestWindow` throws a user-activation error): the toolbar path can't open PiP directly. Fallback for Task 7/8: the in-page floating button (Task 6) becomes the primary opener; the toolbar click instead calls `setButtonActive`/pulses the button and (Task 8) shows a badge directing the user to the in-page button. The rest of the plan is unaffected.

- [ ] **Step 8: Commit**

```bash
git add package.json manifest.json src/loader.js src/content.js src/background.js
git commit -m "feat: scaffold MV3 extension + verify toolbar gesture forwarding"
```

---

## Task 2: Usage API parsing

**Files:**
- Create: `src/usage-api.js`
- Test: `tests/usage-api.test.js`

**Interfaces:**
- Produces:
  - `parseUsage(json) -> { session, allModels, sonnet }` where each value is `{ pct: number, resetsAt: Date|null }` or `null`.
  - `fetchOrgId() -> Promise<string>`
  - `fetchUsage(orgId: string) -> Promise<ParsedUsage>` (same shape as `parseUsage`'s return).

- [ ] **Step 1: Write the failing test** — create `tests/usage-api.test.js`

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseUsage } from "../src/usage-api.js";

const sample = {
  five_hour: { utilization: 54, resets_at: "2026-06-23T13:59:59.74Z" },
  seven_day: { utilization: 34, resets_at: "2026-06-23T16:59:59.74Z" },
  seven_day_sonnet: { utilization: 8, resets_at: "2026-06-23T16:59:59.74Z" },
  seven_day_opus: null,
};

test("maps the three buckets", () => {
  const u = parseUsage(sample);
  assert.equal(u.session.pct, 54);
  assert.equal(u.allModels.pct, 34);
  assert.equal(u.sonnet.pct, 8);
  assert.ok(u.session.resetsAt instanceof Date);
});

test("null bucket becomes null", () => {
  const u = parseUsage({ ...sample, seven_day_sonnet: null });
  assert.equal(u.sonnet, null);
});

test("missing session becomes null", () => {
  const u = parseUsage({});
  assert.equal(u.session, null);
});

test("clamps utilization to 0..100", () => {
  const u = parseUsage({ five_hour: { utilization: 142 } });
  assert.equal(u.session.pct, 100);
});

test("ignores a bucket without numeric utilization", () => {
  const u = parseUsage({ five_hour: { utilization: "x" } });
  assert.equal(u.session, null);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '../src/usage-api.js'` (file doesn't exist yet).

- [ ] **Step 3: Write minimal implementation** — create `src/usage-api.js`

```js
const KEYS = { session: "five_hour", allModels: "seven_day", sonnet: "seven_day_sonnet" };

function readBucket(json, key) {
  const b = json && json[key];
  if (!b || typeof b.utilization !== "number") return null;
  return {
    pct: Math.max(0, Math.min(100, Math.round(b.utilization))),
    resetsAt: b.resets_at ? new Date(b.resets_at) : null,
  };
}

export function parseUsage(json) {
  return {
    session: readBucket(json, KEYS.session),
    allModels: readBucket(json, KEYS.allModels),
    sonnet: readBucket(json, KEYS.sonnet),
  };
}

export async function fetchOrgId() {
  const res = await fetch("/api/organizations", { credentials: "include" });
  if (!res.ok) throw new Error(`organizations HTTP ${res.status}`);
  const orgs = await res.json();
  const id = Array.isArray(orgs) && orgs[0] && orgs[0].uuid;
  if (!id) throw new Error("no organization found");
  return id;
}

export async function fetchUsage(orgId) {
  const res = await fetch(`/api/organizations/${orgId}/usage`, { credentials: "include" });
  if (!res.ok) throw new Error(`usage HTTP ${res.status}`);
  return parseUsage(await res.json());
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — all 5 `usage-api` tests green.

- [ ] **Step 5: Commit**

```bash
git add src/usage-api.js tests/usage-api.test.js
git commit -m "feat: parse claude.ai usage response into session/weekly buckets"
```

---

## Task 3: Reset countdown formatter

**Files:**
- Create: `src/format.js`
- Test: `tests/format.test.js`

**Interfaces:**
- Produces: `formatResetCountdown(resetsAt: Date, now?: Date) -> string`.

- [ ] **Step 1: Write the failing test** — create `tests/format.test.js`

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '../src/format.js'`.

- [ ] **Step 3: Write minimal implementation** — create `src/format.js`

```js
export function formatResetCountdown(resetsAt, now = new Date()) {
  const ms = resetsAt.getTime() - now.getTime();
  if (ms <= 0) return "Resetting…";
  if (ms < 60000) return "Resets in <1 min";
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 60) return `Resets in ${totalMin} min`;
  const hrs = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return mins === 0 ? `Resets in ${hrs} hr` : `Resets in ${hrs} hr ${mins} min`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — all `format` + `usage-api` tests green.

- [ ] **Step 5: Commit**

```bash
git add src/format.js tests/format.test.js
git commit -m "feat: add reset countdown formatter matching claude.ai wording"
```

---

## Task 4: Widget rendering (styles + DOM)

**Files:**
- Create: `src/widget.css.js`, `src/widget.js`, `tests/manual/widget-preview.html`
- Test: manual (browser preview harness — no extension needed)

**Interfaces:**
- Consumes: `formatResetCountdown` from `./format.js`; parsed usage shape from Task 2.
- Produces:
  - `WIDGET_CSS: string`
  - `mountWidget(pipDocument) -> { card: HTMLElement, closeBtn: HTMLElement }`
  - `renderUsage(card: HTMLElement, data: ParsedUsage, now?: Date) -> void`
  - `renderMessage(card: HTMLElement, message: string) -> void`

- [ ] **Step 1: Create `src/widget.css.js`**

```js
export const WIDGET_CSS = `
:root {
  --cu-surface: hsl(var(--bg-000, 0 0% 100%));
  --cu-bg: hsl(var(--bg-100, 60 14% 97%));
  --cu-track: hsl(var(--bg-300, 45 12% 93%));
  --cu-text: hsl(var(--text-100, 0 0% 7%));
  --cu-muted: hsl(var(--text-400, 43 3% 47%));
  --cu-accent: hsl(var(--accent-pro-100, 248 67% 63%));
  color-scheme: light dark;
}
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; }
body {
  position: relative;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  background: var(--cu-bg);
  color: var(--cu-text);
  padding: 12px 14px;
  -webkit-font-smoothing: antialiased;
}
.cu-card { display: flex; flex-direction: column; gap: 9px; }
.cu-title { font-size: 13px; font-weight: 600; line-height: 1.2; }
.cu-sub { font-size: 12px; color: var(--cu-muted); margin-top: -5px; }
.cu-row { display: flex; flex-direction: column; gap: 4px; }
.cu-row-head { display: flex; justify-content: space-between; font-size: 12px; }
.cu-row-label { color: var(--cu-muted); }
.cu-row-pct { font-variant-numeric: tabular-nums; }
.cu-bar { height: 6px; border-radius: 999px; background: var(--cu-track); overflow: hidden; }
.cu-bar-fill { height: 100%; border-radius: 999px; background: var(--cu-accent); transition: width .3s ease; }
.cu-msg { font-size: 12px; color: var(--cu-muted); }
.cu-close {
  position: absolute; top: 6px; right: 8px; border: 0; background: transparent;
  color: var(--cu-muted); font-size: 15px; cursor: pointer; line-height: 1; padding: 4px;
}
`;
```

- [ ] **Step 2: Create `src/widget.js`**

```js
import { WIDGET_CSS } from "./widget.css.js";
import { formatResetCountdown } from "./format.js";

export function mountWidget(pipDocument) {
  const style = pipDocument.createElement("style");
  style.textContent = WIDGET_CSS;
  pipDocument.head.appendChild(style);
  pipDocument.body.innerHTML =
    '<button class="cu-close" title="Close" aria-label="Close">×</button>' +
    '<div class="cu-card" id="cu-card"></div>';
  return {
    card: pipDocument.getElementById("cu-card"),
    closeBtn: pipDocument.querySelector(".cu-close"),
  };
}

function barRow(label, pct) {
  return (
    '<div class="cu-row">' +
      '<div class="cu-row-head">' +
        '<span class="cu-row-label">' + label + "</span>" +
        '<span class="cu-row-pct">' + pct + "%</span>" +
      "</div>" +
      '<div class="cu-bar"><div class="cu-bar-fill" style="width:' + pct + '%"></div></div>' +
    "</div>"
  );
}

export function renderUsage(card, data, now = new Date()) {
  const parts = [];
  if (data.session) {
    parts.push('<div class="cu-title">Current session</div>');
    if (data.session.resetsAt) {
      parts.push('<div class="cu-sub">' + formatResetCountdown(data.session.resetsAt, now) + "</div>");
    }
    parts.push(
      '<div class="cu-row">' +
        '<div class="cu-row-head"><span class="cu-row-label"></span>' +
        '<span class="cu-row-pct">' + data.session.pct + "%</span></div>" +
        '<div class="cu-bar"><div class="cu-bar-fill" style="width:' + data.session.pct + '%"></div></div>' +
      "</div>"
    );
  }
  if (data.allModels) parts.push(barRow("All models", data.allModels.pct));
  if (data.sonnet) parts.push(barRow("Sonnet only", data.sonnet.pct));
  if (!parts.length) { renderMessage(card, "No usage data available."); return; }
  card.innerHTML = parts.join("");
}

export function renderMessage(card, message) {
  card.innerHTML = '<div class="cu-title">Claude usage</div><div class="cu-msg">' + message + "</div>";
}
```

- [ ] **Step 3: Create the manual preview harness** — `tests/manual/widget-preview.html`

```html
<!doctype html>
<html data-mode="light">
<head><meta charset="utf-8"><title>Widget preview</title></head>
<body>
<script type="module">
  import { mountWidget, renderUsage, renderMessage } from "../../src/widget.js";
  const { card } = mountWidget(document);
  const inMin = (m) => new Date(Date.now() + m * 60000);
  renderUsage(card, {
    session:   { pct: 53, resetsAt: inMin(42) },
    allModels: { pct: 34, resetsAt: inMin(222) },
    sonnet:    { pct: 8,  resetsAt: inMin(222) },
  });
  // To preview states, comment the above and try:
  // renderMessage(card, "Open Claude and sign in to see usage.");
</script>
</body>
</html>
```

- [ ] **Step 4: Manual verification**

Open `tests/manual/widget-preview.html` directly in Chrome (drag the file into a tab).
**Expected:** three labelled bars — "Current session" with "Resets in 42 min" and a 53% bar, "All models" 34%, "Sonnet only" 8% — plus a `×` close button top-right. Colors use the light fallbacks (Claude's `:root` vars aren't present on this page, so the `var(..., fallback)` defaults apply). Layout matches the approved mock.

- [ ] **Step 5: Commit**

```bash
git add src/widget.css.js src/widget.js tests/manual/widget-preview.html
git commit -m "feat: render usage widget (three bars + states) with claude-token styling"
```

---

## Task 5: Theme mirroring

**Files:**
- Create: `src/theme.js`
- Test: manual (browser; fully exercised at integration in Task 7)

**Interfaces:**
- Produces:
  - `readClaudePalette() -> Record<string,string>` (Claude `:root` token name → HSL triplet string, read from the live claude.ai page).
  - `applyPalette(pipDocument, palette) -> void` (writes tokens + `data-mode` + `color-scheme` onto the PiP `:root`).
  - `observeTheme(onChange: () => void) -> () => void` (watches `data-mode`; returns a disconnect function).

- [ ] **Step 1: Create `src/theme.js`**

```js
const TOKENS = [
  "--bg-000", "--bg-100", "--bg-200", "--bg-300",
  "--text-100", "--text-400", "--accent-pro-100", "--oncolor-100",
];

export function readClaudePalette() {
  const rs = getComputedStyle(document.documentElement);
  const palette = {};
  for (const t of TOKENS) {
    const v = rs.getPropertyValue(t).trim();
    if (v) palette[t] = v;
  }
  return palette;
}

export function applyPalette(pipDocument, palette) {
  const root = pipDocument.documentElement;
  for (const [name, value] of Object.entries(palette)) {
    root.style.setProperty(name, value);
  }
  const mode = document.documentElement.getAttribute("data-mode") || "light";
  root.setAttribute("data-mode", mode);
  root.style.colorScheme = mode === "dark" ? "dark" : "light";
}

export function observeTheme(onChange) {
  const obs = new MutationObserver(() => onChange());
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode"] });
  return () => obs.disconnect();
}
```

- [ ] **Step 2: Manual sanity check (console)**

On a claude.ai tab, open DevTools console and run:

```js
const m = await import(chrome.runtime.getURL("src/theme.js"));
const p = m.readClaudePalette();
console.log(p["--bg-100"], p["--text-100"], p["--accent-pro-100"]);
```

**Expected:** non-empty HSL triplet strings (e.g. `60 14% 97%`, `0 0% 7%`, `248 67% 63%`). Toggle Claude's theme (Settings → Appearance) to dark and re-run; the values change. (If `import` is blocked in the page console, this is fully verified at integration in Task 7 instead — note that and move on.)

- [ ] **Step 3: Commit**

```bash
git add src/theme.js
git commit -m "feat: read and mirror claude.ai theme tokens into the PiP document"
```

---

## Task 6: In-page floating button

**Files:**
- Create: `src/button.js`
- Test: manual (fully exercised at integration in Task 7)

**Interfaces:**
- Produces:
  - `injectButton(onClick: () => void) -> HTMLElement|undefined` (idempotent; no-op if already present).
  - `setButtonActive(active: boolean) -> void`.

- [ ] **Step 1: Create `src/button.js`**

```js
const BUTTON_ID = "claude-usage-pip-button";

export function injectButton(onClick) {
  if (document.getElementById(BUTTON_ID)) return;
  const btn = document.createElement("button");
  btn.id = BUTTON_ID;
  btn.type = "button";
  btn.title = "Toggle Claude usage widget";
  btn.textContent = "Usage";
  Object.assign(btn.style, {
    position: "fixed", right: "16px", bottom: "16px", zIndex: "2147483647",
    padding: "6px 12px", borderRadius: "999px",
    border: "1px solid hsl(var(--text-100, 0 0% 7%) / 0.12)",
    background: "hsl(var(--bg-000, 0 0% 100%))",
    color: "hsl(var(--text-100, 0 0% 7%))",
    font: "12px ui-sans-serif, system-ui, sans-serif", cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,.15)", opacity: "0.85",
  });
  btn.addEventListener("click", onClick);
  document.body.appendChild(btn);
  return btn;
}

export function setButtonActive(active) {
  const btn = document.getElementById(BUTTON_ID);
  if (btn) btn.style.opacity = active ? "1" : "0.85";
}
```

- [ ] **Step 2: Commit**

```bash
git add src/button.js
git commit -m "feat: add in-page floating launcher button"
```

---

## Task 7: Content orchestrator (integration)

**Files:**
- Modify (replace entirely): `src/content.js`
- Test: manual (browser, on claude.ai)

**Interfaces:**
- Consumes: `fetchOrgId`, `fetchUsage` (Task 2); `mountWidget`, `renderUsage`, `renderMessage` (Task 4); `readClaudePalette`, `applyPalette`, `observeTheme` (Task 5); `injectButton`, `setButtonActive` (Task 6).
- Produces: `window.claudeUsagePip = { open, close, toggle }` (final version) and an injected floating button on load.

- [ ] **Step 1: Replace `src/content.js` with the full orchestrator**

```js
import { fetchOrgId, fetchUsage } from "./usage-api.js";
import { mountWidget, renderUsage, renderMessage } from "./widget.js";
import { readClaudePalette, applyPalette, observeTheme } from "./theme.js";
import { injectButton, setButtonActive } from "./button.js";

const POLL_MS = 60000;

let pipWindow = null;
let card = null;
let orgId = null;
let lastData = null;
let pollTimer = null;
let countdownTimer = null;
let stopThemeObserver = null;

async function refresh() {
  if (!pipWindow || !card) return;
  try {
    if (!orgId) orgId = await fetchOrgId();
    lastData = await fetchUsage(orgId);
    renderUsage(card, lastData);
  } catch (err) {
    console.error("[Claude Usage PiP] refresh failed:", err);
    const msg = String(err && err.message);
    if (/HTTP 40[13]/.test(msg)) {
      renderMessage(card, "Open Claude and sign in to see usage.");
    } else {
      renderMessage(card, "Couldn’t load usage. Retrying…");
    }
  }
}

function syncTheme() {
  if (pipWindow) applyPalette(pipWindow.document, readClaudePalette());
}

function startTimers() {
  pollTimer = setInterval(refresh, POLL_MS);
  countdownTimer = setInterval(() => {
    if (card && lastData) renderUsage(card, lastData);
  }, POLL_MS);
}

function clearTimers() {
  clearInterval(pollTimer); pollTimer = null;
  clearInterval(countdownTimer); countdownTimer = null;
}

function handlePipClosed() {
  clearTimers();
  if (stopThemeObserver) { stopThemeObserver(); stopThemeObserver = null; }
  pipWindow = null;
  card = null;
  setButtonActive(false);
}

async function open() {
  if (pipWindow) { pipWindow.focus(); return; }
  if (!("documentPictureInPicture" in window)) {
    console.warn("[Claude Usage PiP] Document PiP unsupported in this browser.");
    return;
  }
  pipWindow = await documentPictureInPicture.requestWindow({ width: 280, height: 200 });
  const ui = mountWidget(pipWindow.document);
  card = ui.card;
  ui.closeBtn.addEventListener("click", close);
  applyPalette(pipWindow.document, readClaudePalette());
  stopThemeObserver = observeTheme(syncTheme);
  renderMessage(card, "Loading…");
  setButtonActive(true);
  pipWindow.addEventListener("pagehide", handlePipClosed);
  await refresh();
  startTimers();
}

function close() {
  if (pipWindow) pipWindow.close(); // fires pagehide -> handlePipClosed
}

function toggle() { if (pipWindow) close(); else open(); }

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && pipWindow) refresh();
});

injectButton(toggle);
window.claudeUsagePip = { open, close, toggle };
console.log("[Claude Usage PiP] ready");
```

- [ ] **Step 2: Reload the extension**

`chrome://extensions` → click the reload icon on the extension. Then reload the claude.ai tab.

- [ ] **Step 3: Manual verification — happy path**

1. On claude.ai (signed in), click the floating **Usage** button (bottom-right).
2. **Expected:** PiP opens, briefly shows "Loading…", then three live bars with real percentages; "Current session" shows a real "Resets in …" line. Cross-check against `claude.ai/settings/usage`.
3. Wait ~60s. **Expected:** values/countdown stay current (no console errors).
4. Click the toolbar icon. **Expected:** widget closes (toggle). Click it again. **Expected:** widget reopens.
5. Click the PiP's `×`. **Expected:** widget closes and the floating button dims.

- [ ] **Step 4: Manual verification — theme sync**

With the widget open, change Claude's appearance (Settings → Appearance → Light/Dark).
**Expected:** the widget's background/text/accent update to match within a moment (no reopen needed).

- [ ] **Step 5: Manual verification — signed-out / error state**

In a separate step, sign out of claude.ai (or open the PiP, then in DevTools run `document.cookie` is not required — simplest: log out in another tab and trigger a refresh by focusing the claude tab).
**Expected:** widget shows "Open Claude and sign in to see usage." and recovers automatically after signing back in (within one poll cycle).

- [ ] **Step 6: Commit**

```bash
git add src/content.js
git commit -m "feat: wire fetch, render, polling, theme sync, toggle into PiP widget"
```

---

## Task 8: Service worker — no-tab handling & badge

**Files:**
- Modify (replace entirely): `src/background.js`
- Test: manual (browser)

**Interfaces:**
- Consumes: `window.claudeUsagePip.toggle()` exposed by Task 7.
- Produces: toolbar-click behavior — toggle on an existing claude.ai tab; if none, open one and badge the icon to prompt a second click.

- [ ] **Step 1: Replace `src/background.js`**

```js
const CLAUDE_MATCH = "https://claude.ai/*";

chrome.action.onClicked.addListener(async (activeTab) => {
  const target = await pickClaudeTab(activeTab);
  if (!target) {
    await chrome.tabs.create({ url: "https://claude.ai/new" });
    await flashBadge("↻", "Click the icon again to show usage");
    return;
  }
  await clearBadge();
  try {
    await chrome.scripting.executeScript({
      target: { tabId: target.id },
      func: () => window.claudeUsagePip && window.claudeUsagePip.toggle(),
    });
  } catch (e) {
    console.error("[Claude Usage PiP] executeScript failed:", e);
  }
});

async function pickClaudeTab(activeTab) {
  if (activeTab && activeTab.url && activeTab.url.startsWith("https://claude.ai/")) {
    return activeTab;
  }
  const tabs = await chrome.tabs.query({ url: CLAUDE_MATCH });
  return tabs.find((t) => t.active) || tabs[0] || null;
}

async function flashBadge(text, title) {
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color: "#6c5ce7" });
  if (title) await chrome.action.setTitle({ title });
}

async function clearBadge() {
  await chrome.action.setBadgeText({ text: "" });
  await chrome.action.setTitle({ title: "Toggle Claude usage widget" });
}
```

- [ ] **Step 2: Reload the extension**

`chrome://extensions` → reload the extension.

- [ ] **Step 3: Manual verification**

1. Close **all** claude.ai tabs. Navigate the active tab to e.g. `https://example.com`.
2. Click the toolbar icon. **Expected:** a new claude.ai tab opens and the icon shows a `↻` badge with tooltip "Click the icon again to show usage".
3. Click the toolbar icon again (claude.ai tab now present). **Expected:** badge clears and the widget opens.
4. Switch to a non-claude tab while the widget stays floating. Click the toolbar icon. **Expected:** the widget toggles closed (injection into the background claude.ai tab works via host permission).

- [ ] **Step 4: Commit**

```bash
git add src/background.js
git commit -m "feat: open/badge claude.ai tab when none is present; cross-tab toggle"
```

---

## Task 9: README + manual verification checklist

**Files:**
- Create: `README.md`
- Test: run the full checklist

- [ ] **Step 1: Create `README.md`**

````markdown
# Claude Usage PiP

A Chrome extension that shows your claude.ai usage in a small floating
(Document Picture-in-Picture) widget: current session, weekly "All models",
and "Sonnet only" — with live percentages and a session reset countdown.

## Requirements

- Chrome or Edge **116+** (Document Picture-in-Picture API).
- A signed-in **claude.ai** tab open in the background (the widget fetches usage
  with your existing login and uses the tab as the PiP opener).
- Node **18+** only to run the unit tests (not needed to use the extension).

## Install (load unpacked)

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this folder.
4. Open `https://claude.ai/` and sign in.

## Use

- Click the **Usage** button (bottom-right of claude.ai) **or** the extension's
  toolbar icon to open/close the widget.
- If no claude.ai tab is open when you click the toolbar icon, the extension
  opens one and asks you to click again.

## Limitations

- The widget stays open only while a claude.ai tab is open (Document PiP needs a
  live opener). Closing the last claude.ai tab closes the widget.
- The browser controls the widget's screen position; it can't be pinned by
  script. Drag it where you want — Chrome remembers.
- Uses claude.ai's internal usage API, which may change without notice.
- v1 uses Chrome's default toolbar icon (custom icons are a future addition).

## Tests

```bash
npm test
```

Runs the pure-logic unit tests (usage parsing, countdown formatting). The
browser-dependent parts are verified with the manual checklist below.

## Manual verification checklist

- [ ] Toolbar icon opens an empty PiP on claude.ai (gesture forwarding).
- [ ] Floating button opens the widget with live bars matching `/settings/usage`.
- [ ] Values/countdown refresh (~60s) with no console errors.
- [ ] Toggling Claude's light/dark theme updates the widget live.
- [ ] Toolbar icon and `×` both close the widget; floating button dims.
- [ ] Signed-out shows "Open Claude and sign in…" and recovers after sign-in.
- [ ] With no claude.ai tab, toolbar click opens one + badges; second click opens widget.
- [ ] Cross-tab: with the widget floating and a non-claude tab active, the toolbar icon still toggles it.
````

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: PASS — all `usage-api` and `format` tests green.

- [ ] **Step 3: Walk the manual checklist**

Perform each item in the README checklist on claude.ai. Fix any failures in the relevant module before completing.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add README with install, limitations, and verification checklist"
```

---

## Self-Review (completed during planning)

- **Spec coverage:** content-script architecture (Task 7), both launchers (Tasks 6–8), three bars (Task 4), theme mirroring (Task 5), data source/fields (Task 2), polling + countdown + visibility refresh (Tasks 3, 7), states (Task 4 `renderMessage` + Task 7), no-tab/badge (Task 8), constraints documented (Task 9). Position-not-controllable and the gesture-forwarding spike are covered (Global Constraints, Task 1).
- **Placeholder scan:** none — every code/step is concrete.
- **Type consistency:** `parseUsage` shape `{session, allModels, sonnet}` with `{pct, resetsAt}` is consumed identically by `renderUsage` and `content.js`; `mountWidget` returns `{card, closeBtn}` used in Task 7; `observeTheme` returns a disconnect fn stored in `stopThemeObserver`; `window.claudeUsagePip.toggle` is the single injection target across Tasks 1/7/8.

## Deviations from the spec (intentional, noted)

1. **Module loading:** ES modules via a thin classic-script loader + `web_accessible_resources` (cleaner boundaries and Node-testable pure modules), rather than concatenated classic content scripts.
2. **Permissions:** added `host_permissions: ["https://claude.ai/*"]` (+ `scripting`) so the service worker can toggle the widget on a background claude.ai tab; the spec assumed same-origin fetch alone needed no host permission (true for the fetch, but cross-tab injection benefits from it).
3. **Icons:** v1 omits custom icon assets and uses Chrome's default, to avoid shipping binaries; documented as a future addition.
