# Inline PiP Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a minimal SVG icon button inline next to the "Current session" heading on `claude.ai/settings/usage` that opens the PiP window, while keeping the existing floating button everywhere.

**Architecture:** A new `src/inline-button.js` module handles URL detection via the Navigation API, DOM observation via MutationObserver, and button lifecycle (inject on entry, remove on exit). `content.js` imports and calls it alongside the existing `injectButton` call. The dist copy and manifest are updated to match.

**Tech Stack:** Vanilla JS ES modules, Chrome Extension MV3, Navigation API (Chrome 102+, extension requires 116+), MutationObserver, Document PiP API.

## Global Constraints

- Chrome 116+ minimum (set in manifest `minimum_chrome_version`)
- ES modules throughout — no CommonJS
- No build step — `src/` is the source, `dist/unpacked/src/` is a manual mirror
- Claude CSS variables for colour: `hsl(var(--text-100, 0 0% 7%))`
- No automated DOM tests — Node test runner has no browser APIs; testing is manual

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/inline-button.js` | **Create** | URL detection, DOM observation, icon inject/cleanup |
| `src/content.js` | **Modify** | Import + call `initInlineButton(toggle)` |
| `dist/unpacked/src/inline-button.js` | **Create** | Mirror of `src/inline-button.js` |
| `dist/unpacked/manifest.json` | **Modify** | Add `src/inline-button.js` to `web_accessible_resources` |

---

### Task 1: Create `src/inline-button.js`

**Files:**
- Create: `src/inline-button.js`

**Interfaces:**
- Produces: `export function initInlineButton(onToggle: () => void): void`

> No automated tests — this module uses `document`, `MutationObserver`, and `navigation`, none of which exist in Node's test runner. Testing is manual (see step 4).

- [ ] **Step 1: Create the file**

Create `src/inline-button.js` with this exact content:

```js
const INLINE_BTN_ID = "claude-usage-pip-inline-btn";
const USAGE_PATH = "/settings/usage";

const PIP_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
  <rect x="8" y="7" width="6" height="4" rx="1" fill="currentColor"/>
</svg>`;

function findHeading() {
  return [...document.querySelectorAll("h1,h2,h3,h4")].find(
    (el) => el.textContent.trim() === "Current session"
  ) ?? null;
}

function removeBtn() {
  document.getElementById(INLINE_BTN_ID)?.remove();
}

function injectBtn(headingEl, onToggle) {
  if (document.getElementById(INLINE_BTN_ID)) return;
  const btn = document.createElement("button");
  btn.id = INLINE_BTN_ID;
  btn.type = "button";
  btn.title = "Open in Picture-in-Picture";
  btn.innerHTML = PIP_SVG;
  Object.assign(btn.style, {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "6px",
    padding: "2px",
    border: "none",
    background: "transparent",
    color: "hsl(var(--text-100, 0 0% 7%))",
    cursor: "pointer",
    opacity: "0.45",
    verticalAlign: "middle",
    transition: "opacity 0.15s",
    borderRadius: "4px",
  });
  btn.addEventListener("mouseenter", () => { btn.style.opacity = "1"; });
  btn.addEventListener("mouseleave", () => { btn.style.opacity = "0.45"; });
  btn.addEventListener("click", onToggle);
  headingEl.appendChild(btn);
}

function startObserver(onToggle) {
  const tryInject = () => {
    const heading = findHeading();
    if (heading) {
      observer.disconnect();
      injectBtn(heading, onToggle);
    }
  };
  const observer = new MutationObserver(tryInject);
  observer.observe(document.body, { childList: true, subtree: true });
  tryInject();
  return observer;
}

export function initInlineButton(onToggle) {
  let observer = null;

  function activate() {
    observer = startObserver(onToggle);
  }

  function deactivate() {
    observer?.disconnect();
    observer = null;
    removeBtn();
  }

  if (location.pathname === USAGE_PATH) activate();

  navigation.addEventListener("navigate", (e) => {
    const path = new URL(e.destination.url).pathname;
    deactivate();
    if (path === USAGE_PATH) {
      // Delay to let React render the new route's content.
      setTimeout(activate, 150);
    }
  });
}
```

- [ ] **Step 2: Verify the file exists**

Run:
```
dir src\inline-button.js
```
Expected: file listed, size > 0.

- [ ] **Step 3: Manual test in browser**

1. Go to `chrome://extensions` → reload the extension.
2. Navigate to `https://claude.ai/settings/usage`.
3. Find the "Current session" heading on the page.
4. Verify a small PiP icon (rectangle with inner rectangle) appears at the end of the heading, slightly faded.
5. Hover the icon — verify it brightens to full opacity.
6. Click it — verify the PiP window opens (same behaviour as the floating button).
7. Navigate away (e.g. to `/new`) — reload `settings/usage` — verify icon is gone then reappears.
8. Navigate within the SPA (don't hard-reload) to `settings/usage` — verify icon appears.

- [ ] **Step 4: Commit**

```bash
git add src/inline-button.js
git commit -m "feat: add inline-button module for PiP icon near Current session"
```

---

### Task 2: Wire up content.js, manifest, and dist mirror

**Files:**
- Modify: `src/content.js` (lines 1 and 103-104)
- Modify: `dist/unpacked/manifest.json` (web_accessible_resources array)
- Create: `dist/unpacked/src/inline-button.js`

**Interfaces:**
- Consumes: `initInlineButton(onToggle: () => void)` from `./inline-button.js` (Task 1)

- [ ] **Step 1: Update `src/content.js`**

Add the import at the top of the file and the init call at the bottom. The complete updated file:

```js
import { fetchOrgId, fetchUsage } from "./usage-api.js";
import { mountWidget, renderUsage, renderMessage } from "./widget.js";
import { readClaudePalette, applyPalette, observeTheme } from "./theme.js";
import { injectButton, setButtonActive } from "./button.js";
import { initInlineButton } from "./inline-button.js";

const POLL_MS = 60000;

let pipWindow = null;
let card = null;
let orgId = null;
let lastData = null;
let pollTimer = null;
let countdownTimer = null;
let stopThemeObserver = null;
let opening = false;

async function refresh() {
  if (!pipWindow || !card) return;
  try {
    if (!orgId) orgId = await fetchOrgId();
    if (!card) return;
    lastData = await fetchUsage(orgId);
    if (!card) return;
    renderUsage(card, lastData);
  } catch (err) {
    console.error("[Claude Usage PiP] refresh failed:", err);
    if (!card) return;
    const msg = String(err && err.message);
    if (/HTTP 401/.test(msg)) {
      orgId = null;
      renderMessage(card, "Open Claude and sign in to see usage.");
    } else {
      renderMessage(card, "Couldn't load usage. Retrying…");
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
  orgId = null;
  setButtonActive(false);
}

async function open() {
  if (pipWindow) { pipWindow.focus(); return; }
  if (opening) return;
  if (!("documentPictureInPicture" in window)) {
    console.warn("[Claude Usage PiP] Document PiP unsupported in this browser.");
    return;
  }
  opening = true;
  try {
    const win = await documentPictureInPicture.requestWindow({ width: 280, height: 200 });
    win.addEventListener("pagehide", handlePipClosed);
    const ui = mountWidget(win.document);
    card = ui.card;
    ui.closeBtn.addEventListener("click", close);
    applyPalette(win.document, readClaudePalette());
    stopThemeObserver = observeTheme(syncTheme);
    renderMessage(card, "Loading…");
    setButtonActive(true);
    pipWindow = win;
    await refresh();
    startTimers();
  } catch (err) {
    console.error("[Claude Usage PiP] open failed:", err);
    card = null;
    pipWindow = null;
  } finally {
    opening = false;
  }
}

function close() {
  if (pipWindow) pipWindow.close();
}

function toggle() { if (pipWindow) close(); else open().catch(console.error); }

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && pipWindow) refresh();
});

injectButton(toggle);
initInlineButton(toggle);
window.claudeUsagePip = { open, close, toggle };
console.log("[Claude Usage PiP] ready");
```

- [ ] **Step 2: Update `dist/unpacked/manifest.json`**

In the `web_accessible_resources[0].resources` array, add `"src/inline-button.js"`. The complete updated array:

```json
"resources": [
  "src/content.js",
  "src/usage-api.js",
  "src/format.js",
  "src/widget.js",
  "src/widget.css.js",
  "src/theme.js",
  "src/button.js",
  "src/inline-button.js"
]
```

- [ ] **Step 3: Mirror files to dist/unpacked**

Copy both updated files:

```bash
copy src\inline-button.js dist\unpacked\src\inline-button.js
copy src\content.js dist\unpacked\src\content.js
```

- [ ] **Step 4: Run existing tests to confirm nothing broke**

```bash
node --test
```
Expected: all tests pass (format + usage-api tests; inline-button has no automated tests).

- [ ] **Step 5: Manual end-to-end test**

1. Reload extension at `chrome://extensions`.
2. Hard-navigate to `https://claude.ai/settings/usage`.
3. Verify inline PiP icon appears next to "Current session".
4. Verify floating button (bottom-right) is also present.
5. Click inline icon → PiP opens. Close PiP.
6. Click floating button → PiP opens. Close PiP.
7. SPA-navigate to another Claude page (e.g. `/new`) → inline icon is gone, floating button remains.
8. SPA-navigate back to `/settings/usage` → inline icon reappears within ~150ms.

- [ ] **Step 6: Commit**

```bash
git add src/content.js dist/unpacked/src/content.js dist/unpacked/src/inline-button.js dist/unpacked/manifest.json
git commit -m "feat: wire inline PiP button into content.js and update dist"
```
