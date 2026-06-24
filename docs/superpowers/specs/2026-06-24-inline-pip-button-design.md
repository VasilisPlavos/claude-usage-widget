# Inline PiP Button near "Current session"

**Date:** 2026-06-24
**Status:** Approved

## Goal

Add a minimal, elegant PiP icon button inline next to the "Current session" heading on `claude.ai/settings/usage`, in addition to the existing floating button which remains everywhere.

## Behaviour

- On **all** `claude.ai/*` pages: floating button (bottom-right, existing) stays as-is.
- On `claude.ai/settings/usage` specifically: an additional inline icon button appears next to the "Current session" heading.
- Both buttons trigger the same `toggle()` action (open/close PiP window).
- Navigating away from `settings/usage` removes the inline button from the DOM.

## New Module: `src/inline-button.js`

### Responsibilities
1. **URL detection** — uses `navigation.addEventListener('navigate', ...)` (Navigation API, Chrome 102+; extension requires 116+) plus an initial check on script load.
2. **DOM observation** — when on `settings/usage`, starts a `MutationObserver` on `document.body` looking for a heading element (`h1/h2/h3`) whose `textContent.trim()` equals `"Current session"`.
3. **Icon injection** — once the heading is found, appends an icon `<button>` immediately after it (inline). Observer is then disconnected.
4. **Cleanup** — on navigation away from `settings/usage`, removes the button and resets state.

### Icon

SVG 16×16, mimics Chrome's built-in PiP icon: outer rectangle + smaller inner rectangle in the bottom-right corner. Uses `currentColor` to follow Claude's theme automatically.

### Styling

- No background, no border, no text.
- `opacity: 0.5` at rest → `1` on hover (CSS transition).
- `vertical-align: middle`, small left margin to sit naturally next to the heading.
- Tooltip: `"Open in Picture-in-Picture"`.
- Uses Claude CSS variables (`--text-100`) for colour, same as the floating button.

## Changes

| File | Change |
|---|---|
| `src/inline-button.js` | New module (exports `initInlineButton(onToggle)`) |
| `src/content.js` | Import `initInlineButton`; call `initInlineButton(toggle)` after existing `injectButton(toggle)` |
| `dist/unpacked/manifest.json` | Add `src/inline-button.js` to `web_accessible_resources` |
| `dist/unpacked/src/inline-button.js` | Mirror of `src/inline-button.js` |

## Out of Scope

- Hiding the floating button on `settings/usage` (user wants both).
- Any changes to the PiP widget itself.
- Localisation of the tooltip text.
