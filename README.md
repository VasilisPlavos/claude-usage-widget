# Claude Usage Widget Lite

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

## build

  npm run build           # create dist/unpacked with current version

## release

  npm run release           # no bump:    1.0.0 → 1.0.0
  npm run release patch     # patch bump: 1.0.0 → 1.0.1
  npm run release minor     # minor bump: 1.0.0 → 1.1.0
  npm run release major     # major bump: 1.0.0 → 2.0.0

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
- [ ] Footer shows a status dot + description (green when operational).
- [ ] During an incident, hovering/focusing the footer opens the overlay upward with the verbatim incident name + message.
- [ ] Status dot colors are legible in both light and dark themes.
- [ ] When "All models" is maxed but Sonnet has room, the "✓ still available" hint appears on the Sonnet row.
- [ ] If the status fetch fails, the footer shows a gray dot + "Status unavailable" and the usage bars are unaffected.
