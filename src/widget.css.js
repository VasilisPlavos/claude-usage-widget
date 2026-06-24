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
