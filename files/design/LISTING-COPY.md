# Claude Usage Widget Lite — Chrome Web Store listing

## Name

Claude Usage Widget Lite

## Tagline (recommended)

Your Claude limit, always in the corner of your eye.

Alternates:

- Never hit your Claude limit by surprise.
- A usage meter that floats wherever you work.
- Know when you reset — before you run out.
- Tiny widget. Big peace of mind.

## Short description (≤132 chars)

Primary:
Float your Claude usage on top of any tab: session + weekly meters, a reset countdown, and a live Claude service-status check.

Alternate (personal angle):
I kept refreshing Claude's usage page to dodge limits — so I built a floating gauge that keeps it always in view.

## Detailed description

> Paste the text below as-is. The Chrome Web Store renders this field as plain
> text (no Markdown), so the headers and bullets use plain characters that show
> cleanly — do not add `**bold**` or `#` markup.

I built this for myself.

I use Claude all day, and I kept slamming into my usage limit at the worst possible moment — mid-thought, mid-task. So I started opening the usage page over and over just to check what I had left. It worked, but it was a constant little chore.

Claude Usage Widget Lite is the fix: a tiny floating window that keeps your usage — and Claude's service status — in view while you work, so you can pace yourself and never get blindsided by a limit (or an outage) again.

WHAT YOU SEE AT A GLANCE
• Current session usage, with a live countdown to when it resets
• Weekly usage across all models
• Weekly Sonnet usage on its own
• A live Claude service-status dot — green when all's well, yellow or red during an incident
• Live percentages that refresh automatically (about every minute)

WHEN A LIMIT OR OUTAGE HITS
• If your weekly "All models" limit is maxed but Sonnet still has room, the widget flags Sonnet as still available — so you can switch and keep working
• During an incident, focus the status dot to read Anthropic's own status message, right inside the widget

HOW IT WORKS
• Click the Usage button on claude.ai (bottom-right) or the toolbar icon to pop out the widget
• It floats above your other windows using Chrome's Document Picture-in-Picture, so it stays visible even when you switch apps
• Drag it anywhere — Chrome remembers where you put it
• Matches Claude's light and dark theme automatically

PRIVATE BY DESIGN
• No account, no sign-up — it uses your existing claude.ai login
• No tracking, no analytics, nothing sent to any server
• It reads your usage straight from Claude, shows it to you, and does nothing else

REQUIREMENTS
• Chrome or Edge 116+ (for the Document Picture-in-Picture window)
• A signed-in claude.ai tab open in the background

That's it — intentionally lightweight. Just the numbers (and the status), always in view.

## Category

Productivity

## Suggested tags / keywords

claude, usage tracker, picture-in-picture, ai limits, service status

## Single-purpose statement (required submission field)

Claude Usage Widget Lite has a single purpose: to display your claude.ai usage — current session and weekly limits, alongside Claude's live service status — in a small floating Picture-in-Picture window so you can monitor it at a glance.

## claude.ai host-permission justification (required submission field)

The extension needs access to claude.ai to (1) read your usage data from Claude's own usage API using your existing signed-in session, and (2) add the floating "Usage" toggle button to the claude.ai page. It requests no other host access and sends your data nowhere. Claude's service status is read separately from Anthropic's public status page, which needs no extra host permissions.

## Privacy disclosure notes

Declare "Does not collect user data." No remote server, no analytics, no storage of personal data; usage is read live from claude.ai and rendered locally, and service status is read from Anthropic's public status page. Single purpose as stated above.

## Assets in this folder

- store-icon-128.png — store/listing icon (required)
- store-icon-512.png — high-res icon
- screenshot-1.png … screenshot-4.png — 640×400 (Chrome-valid screenshot size)
- promo-small-440x280.png — small promo tile
- promo-marquee.png / promo-marquee-1400x560.png — marquee promo tile (1400×560)

Light + dark toolbar icon PNGs live in `files/icons/`.
