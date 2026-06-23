# Claude Usage PiP — Design Spec

- **Date:** 2026-06-23
- **Status:** Approved (pending final user review)
- **Topic:** Chrome extension that displays claude.ai session/weekly usage in a Document Picture-in-Picture floating widget.

## 1. Overview

A Chrome extension (Manifest V3) that pops out a small always-on-top floating
widget showing your current claude.ai usage. The widget uses the
**Document Picture-in-Picture API** (`documentPictureInPicture.requestWindow()`)
so it floats above other windows while you work.

The widget shows three live progress bars sourced from claude.ai's own usage API:

```
┌─────────────────────────────┐
│ Current session             │
│ Resets in 42 min            │
│ ███████████░░░░░░░░░    53%  │
│ All models    ████░░░░  34%  │
│ Sonnet only   █░░░░░░░   8%  │
└─────────────────────────────┘
```

- **Current session** — header label + "Resets in N min" + progress bar + `%`.
- **All models** — label + bar + `%`.
- **Sonnet only** — label + bar + `%`.

## 2. Goals / Non-goals

**Goals**
- One-click pop-out of a compact, live usage widget that floats over other apps.
- Zero configuration: uses the user's existing claude.ai login.
- Visually native to claude.ai, including matching its current light/dark theme.

**Non-goals (YAGNI)**
- No login/auth flow of our own — we rely on the active claude.ai session.
- No history, charts, notifications, or alerts on threshold.
- No options page or user settings in v1.
- No persistence of usage data across sessions.
- No support for browsers other than Chromium-based browsers with Document PiP
  (Chrome 116+).

## 3. Architecture

A **content-script-centric** design. The content script runs on `claude.ai`,
where it has same-origin access to the usage API (cookies sent automatically)
and a live page to act as the Document PiP opener. The widget therefore lives as
long as **any claude.ai tab is open** (it may be backgrounded). Closing the last
claude.ai tab closes the widget — this is inherent to Document PiP, which
requires a live opener document.

**Rejected alternative:** a background service worker fetching usage independently
via broad `host_permissions`. Rejected because Document PiP still needs a live
opener page, so the independence buys nothing while adding permissions and
complexity.

### 3.1 Components

| File | Responsibility |
|------|----------------|
| `manifest.json` | MV3 manifest: content script on `https://claude.ai/*`, `action` (toolbar icon, no popup), `scripting` permission, icons. |
| `src/background.js` | Service worker. On toolbar-icon click, injects a call to `window.openUsagePip()` into the active claude.ai tab via `chrome.scripting.executeScript`. Handles the "no claude.ai tab" case. |
| `src/content.js` | Core. Defines `openUsagePip()`/`closeUsagePip()` on the isolated-world `window`; injects the in-page floating button; orchestrates fetch → render → update loop; mirrors Claude's theme. |
| `src/usage-api.js` | Resolves org id and fetches/parses the usage response into a clean shape. No DOM/rendering knowledge. |
| `src/widget.js` | Builds the PiP document DOM, renders the three bars, formats the countdown. No fetching knowledge. |
| `src/widget.css.js` | Theme-aware CSS as a JS string injected into the PiP document (CSS variables for light/dark). |
| `icons/` | Toolbar + button icons (16/32/48/128). |
| `README.md` | Install (load unpacked), usage, and the documented limitations. |

Modules are deliberately decoupled: `usage-api` knows nothing about rendering,
`widget` knows nothing about fetching. Each is small enough to understand and
test in isolation.

### 3.2 Why both launchers route through one function

`documentPictureInPicture.requestWindow()` requires **transient user activation
in the page's realm**. Two entry points, one opener function:

- **In-page floating button** — a normal click in the page; activation is present
  natively. Calls `window.openUsagePip()` directly.
- **Toolbar icon** — `chrome.action.onClicked` fires in the service worker, which
  cannot call `requestWindow()`. It uses `chrome.scripting.executeScript` to run
  `() => window.openUsagePip()` in the claude.ai tab. The injected code runs in
  the **same isolated world** as the content script (so `openUsagePip` is in
  scope) and carries the click's user activation (so the gesture requirement is
  satisfied).

This activation-forwarding is the one feasibility risk — see §8.

## 4. Data source

All requests are same-origin from the content script with `credentials: 'include'`
(the user's cookies). No special headers were required in testing.

### 4.1 Endpoints

1. **Org id:** `GET https://claude.ai/api/organizations` → use `[0].uuid`.
   Cached for the page session.
2. **Usage:** `GET https://claude.ai/api/organizations/{org_id}/usage`.

### 4.2 Usage response (relevant fields)

```jsonc
{
  "five_hour":        { "utilization": 54, "resets_at": "2026-06-23T13:59:59.74Z", "limit_dollars": null, "used_dollars": null, "remaining_dollars": null },
  "seven_day":        { "utilization": 34, "resets_at": "2026-06-23T16:59:59.74Z", ... },
  "seven_day_sonnet": { "utilization": 8,  "resets_at": "2026-06-23T16:59:59.74Z", ... },
  "seven_day_opus":   null,
  // ...other keys ignored
}
```

Mapping:

| Widget row | Source key | Bar value | Reset text |
|------------|-----------|-----------|------------|
| Current session | `five_hour` | `utilization` | `resets_at` → "Resets in N min" |
| All models | `seven_day` | `utilization` | (none shown) |
| Sonnet only | `seven_day_sonnet` | `utilization` | (none shown) |

`usage-api.js` parses this into:

```js
{
  session:    { pct: 54, resetsAt: Date },
  allModels:  { pct: 34 },
  sonnet:     { pct: 8 },
}
```

A row whose source key is `null` (e.g., a plan without Sonnet-only limits) is
omitted from the widget rather than rendered as 0%.

## 5. Update model

- **Polling:** every **60s** while the widget is open (server value refreshes
  ~once/minute). Also fetch immediately on open, and refresh when a claude.ai tab
  regains focus (`visibilitychange`).
- **Countdown:** computed locally from `session.resetsAt − now`, re-rendered
  every minute, using claude.ai's own wording (observed on the usage page):
  - `>= 60 min` → "Resets in H hr M min" (e.g. "Resets in 3 hr 42 min").
  - `1–59 min` → "Resets in N min" (e.g. "Resets in 42 min").
  - `< 1 min` → "Resets in <1 min".
  - already passed → "Resetting…" (next poll brings fresh values).
- **Theme sync:** on open, read claude.ai's effective light/dark state from the
  page and set the PiP document's theme CSS variables to match. A
  `MutationObserver` on the page's theme indicator updates the widget live if the
  user toggles Claude's theme. (Exact theme signal — class on `<html>`,
  `color-scheme`, or stored preference — to be confirmed by inspection during
  implementation; detection is isolated in one helper.)

## 6. Launch & toggle behavior

- **Floating button:** small pill/icon in a page corner. Click opens the widget;
  reflects open/closed state so it doubles as a toggle.
- **Toolbar icon:** click opens the widget (via the executeScript path); click
  again closes it. Badge/tooltip communicates state.
- **Dismissal:** the widget's own close button, clicking either launcher again,
  or closing the last claude.ai tab.
- **Single instance:** if a widget is already open, re-opening focuses/refreshes
  it. We hold the live `pipWindow` reference and listen for its `pagehide` to
  reset state when the user closes it directly.

## 7. Widget states

| State | Trigger | Behavior |
|-------|---------|----------|
| Loading | First open, before first fetch | Skeleton / "…" placeholders. |
| Normal | Fetch succeeded | Three live bars. |
| Signed out / fetch error | 401/403/network | "Open Claude and sign in" + retry; polling continues and auto-recovers. |
| No claude.ai tab | Toolbar icon clicked with no claude.ai tab | Service worker opens/focuses claude.ai and badges the icon to prompt a second click (PiP needs a live opener). |

## 8. Constraints & risks

1. **Window position is not script-controllable.** Document PiP exposes `width`
   and `height` only — not screen coordinates. Chrome decides placement (commonly
   a corner) and the user can drag it; Chrome then remembers. We request a compact
   size (~280×170, taller to fit the weekly bars) but **cannot pin it to the
   bottom-right**. Accepted, because Document PiP is a hard requirement.
2. **Gesture forwarding via `executeScript` (feasibility spike).** The toolbar
   path depends on `chrome.scripting.executeScript` forwarding the action click's
   user activation into the page. **Verify this first.** If it does not hold in
   the target Chrome version, the toolbar click instead reveals/pulses the in-page
   button, which remains the primary opener (the floating button always has a
   genuine gesture).
3. **Chrome version.** Document PiP requires Chrome/Edge 116+. Out-of-scope
   browsers are not supported; the README states this.
4. **Requires an open claude.ai tab.** By design (see §3). Documented for the user.
5. **Internal API.** `/api/organizations/{id}/usage` is claude.ai's own endpoint,
   not a public/stable API; it could change. Parsing is isolated in `usage-api.js`
   and fails gracefully to the error state.

## 9. Testing strategy

- **Unit tests (Node, no browser):**
  - `usage-api` response parsing: full payload, `null` rows omitted, missing keys.
  - `resets_at → "Resets in …"` formatter: >=60 min ("H hr M min"), 1–59 min,
    <1 min, passed.
- **Manual verification checklist (README):** open/close via both launchers; theme
  toggle sync; signed-out state and recovery; 60s polling refresh; behavior with no
  claude.ai tab. (Document PiP + extension gestures aren't meaningfully unit-testable.)
- **Feasibility spike (do first):** confirm gesture forwarding opens PiP from the
  toolbar icon; decide fallback per §8.2.

## 10. Project layout

```
claude-usage-pip/
├── manifest.json
├── src/
│   ├── background.js      # toolbar-click → executeScript opener
│   ├── content.js         # button, fetch orchestration, PiP lifecycle, theme sync
│   ├── usage-api.js       # org id + usage fetch + parsing
│   ├── widget.js          # builds PiP DOM, renders bars, countdown formatting
│   └── widget.css.js      # theme-aware styles (JS string injected into PiP)
├── icons/                 # 16/32/48/128
├── tests/                 # unit tests for usage-api + countdown formatter
├── docs/superpowers/specs/2026-06-23-claude-usage-pip-design.md
└── README.md
```

- **Plain JS, no build step** — load-unpacked MV3. Simple to install and iterate.

## 11. Open questions

None — all resolved during brainstorming. (The theme signal mechanism — which DOM
attribute claude.ai uses to indicate light/dark — is an implementation detail to
settle by inspection, isolated in a single helper.)
