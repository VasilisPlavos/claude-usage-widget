# Claude Usage Widget Lite — Store Listing Copy

## Short description (≤132 chars)

> I kept refreshing Claude's usage page to dodge limits — so I built a floating gauge that keeps it always in view.

(The canonical, paste-ready copy is `short-description.txt`.)

## Detailed description

**I built this for myself.**

I use Claude all day, and I kept slamming into my usage limit at the worst possible moment — mid-thought, mid-task. So I started opening the usage page over and over just to check what I had left. It worked, but it was a constant little chore.

**Claude Usage Widget Lite** is the fix: a tiny floating window that keeps your usage in view while you work, so you can pace yourself and never get blindsided by a limit again.

**What you see at a glance**
- Current session usage, with a live countdown to when it resets
- Weekly usage across all models
- Weekly Sonnet usage
- Live percentages that refresh automatically (~every minute)

**How it works**
- Click the **Usage** button on claude.ai (bottom-right) or the toolbar icon to pop out the widget
- It floats above your other windows using Chrome's Document Picture-in-Picture, so it stays visible even when you switch apps
- Drag it anywhere — Chrome remembers where you put it
- Matches Claude's light and dark theme automatically

**Private by design**
- No account, no sign-up — it uses your existing claude.ai login
- No tracking, no analytics, nothing sent to any server
- It reads your usage straight from Claude, shows it to you, and does nothing else

**Requirements**
- Chrome or Edge 116+ (for the Document Picture-in-Picture window)
- A signed-in claude.ai tab open in the background

That's it — intentionally lightweight. Just the numbers, always in view.

## Single-purpose statement (required submission field)

Claude Usage Widget Lite has a single purpose: to display your claude.ai usage — current session and weekly limits — in a small floating Picture-in-Picture window so you can monitor it at a glance.

## claude.ai host-permission justification (required submission field)

The extension needs access to claude.ai to (1) read your usage data from Claude's own usage API using your existing signed-in session, and (2) add the floating "Usage" toggle button to the claude.ai page. It requests no other host access and sends your data nowhere.

## Privacy disclosure notes

Declare **"Does not collect user data."** No remote server, no analytics, no storage of personal data; usage is read live from claude.ai and rendered locally. Single purpose as stated above.
