// Changelog shown on the What's New page. NEWEST ENTRY FIRST.
// Shipping a release = prepend one entry here — that is what triggers the page
// (the background compares the user's previous version against these entries).
export const CHANGELOG = [
  {
    version: "1.2.0",
    date: "2026-06-27",
    title: "What's New page",
    items: [
      "After an update, a local page now shows what changed — only when there's something new.",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-06-27",
    title: "Claude service status",
    items: [
      "A status footer shows Claude's service status with a colored dot.",
      "During an incident, focusing the footer shows Anthropic's own message.",
      'A "switch to Sonnet" hint appears when All models is maxed but Sonnet has room.',
    ],
  },
  {
    version: "1.0.0",
    date: "2026-06-27",
    title: "Initial release",
    items: [
      "Floating picture-in-picture widget for your Claude session and weekly usage, with a reset countdown.",
    ],
  },
];
