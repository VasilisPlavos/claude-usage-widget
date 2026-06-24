const TOKENS = [
  "--bg-000", "--bg-100", "--bg-200", "--bg-300",
  "--text-100", "--text-400", "--accent-pro-100", "--oncolor-100",
];

export function readClaudePalette() {
  const rs = getComputedStyle(document.documentElement);
  const palette = {};
  for (const t of TOKENS) {
    const v = rs.getPropertyValue(t).trim();
    if (v) palette[t] = v;
  }
  return palette;
}

export function applyPalette(pipDocument, palette) {
  const root = pipDocument.documentElement;
  for (const [name, value] of Object.entries(palette)) {
    root.style.setProperty(name, value);
  }
  const mode = document.documentElement.getAttribute("data-mode") || "light";
  root.setAttribute("data-mode", mode);
  root.style.colorScheme = mode === "dark" ? "dark" : "light";
}

export function observeTheme(onChange) {
  const obs = new MutationObserver(() => onChange());
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode"] });
  return () => obs.disconnect();
}
