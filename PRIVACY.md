# Privacy Policy — Claude Usage Widget Lite

_Last updated: 24 June 2026_

Claude Usage Widget Lite ("the extension") is a browser extension that displays
your [claude.ai](https://claude.ai) usage — current session and weekly limits —
in a small floating Picture-in-Picture window.

## The short version

**The extension does not collect, store, sell, or transmit any of your data.**
Everything happens locally in your browser. There is no account, no sign-up, no
analytics, no tracking, and no server operated by us.

## What the extension accesses

To show your usage, the extension reads usage information directly from
claude.ai's own API (the same data Claude shows you on its usage page), using
the session you are **already** signed in with. Specifically, it makes requests
to:

- `https://claude.ai/api/organizations` — to identify your organization
- `https://claude.ai/api/organizations/{id}/usage` — to read your usage figures

These requests go **only** to claude.ai. The response is read, the percentages
and reset times are rendered in the widget, and nothing is kept afterwards.

## What the extension does NOT do

- It does **not** collect personally identifiable information, authentication
  credentials, financial information, health information, location, web history,
  communications, or any other personal data.
- It does **not** store your data anywhere — no `localStorage`, no cookies set by
  the extension, no remote database.
- It does **not** send any data to us or to any third party. We operate no
  server and run no analytics.
- It does **not** sell or transfer user data to third parties.
- It does **not** use or transfer user data for any purpose unrelated to showing
  you your usage.
- It does **not** use or transfer user data to determine creditworthiness or for
  lending purposes.

## Permissions

The extension requests access to `https://claude.ai/*` for two reasons, both
required for its single purpose:

1. To read your usage data from Claude's usage API using your existing session.
2. To add the floating "Usage" toggle button to the claude.ai page.

It requests no other host access and no additional permissions.

## Changes to this policy

If this policy ever changes, the updated version will be published at this same
URL with a new "Last updated" date.

## Contact

Questions about this policy? Open an issue at
<https://github.com/VasilisPlavos/claude-usage-widget/issues> or email
vplavos@gmail.com.
