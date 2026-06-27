# Screenshot capture guide

The store screenshots composite **your own raw captures** of the widget. Take
the captures below and save them (exact filenames) into `files/marketing/raw/`. If a
file is missing, the screenshot template renders a built-in widget mock instead,
so the pipeline still works — but real captures look best.

Tips for all captures:
- Sign in at https://claude.ai and open the widget (click the **Usage** button,
  bottom-right, or the toolbar icon).
- Capture at 2× (HiDPI) if you can — the template scales it down, so extra
  resolution stays crisp.
- Crop tightly to the widget (PNG, transparent or solid background is fine).

| Save as | Theme | What it should show |
|---------|-------|---------------------|
| `files/marketing/raw/capture-session.png` | Light | The widget with the **Current session** row at ~40–60% and the reset countdown visible. (Used by screenshots 1 and 2.) |
| `files/marketing/raw/capture-weekly.png` | Light | The widget showing the **All models** and **Sonnet only** weekly rows. |
| `files/marketing/raw/capture-dark.png` | Dark | The widget in Claude's dark theme. |
| `files/marketing/raw/capture-button.png` | Light | The claude.ai page with the bottom-right **Usage** button visible (and/or the toolbar icon), to show how you open it. |

After dropping captures in, re-run the render step (Task 3) to rebuild the
final images in `files/marketing/store/`.
