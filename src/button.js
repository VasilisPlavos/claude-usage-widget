import { ENV } from "./ENV.js";

const BUTTON_ID = "claude-usage-widget-lite-button";

export function injectButton(onClick) {
  if (document.getElementById(BUTTON_ID)) return;
  const btn = document.createElement("button");
  btn.id = BUTTON_ID;
  btn.type = "button";
  btn.title = `Toggle ${ENV.AppTitle}`;
  btn.textContent = "Usage Widget Lite";
  Object.assign(btn.style, {
    position: "fixed", right: "16px", bottom: "16px", zIndex: "2147483647",
    padding: "6px 12px", borderRadius: "999px",
    border: "1px solid hsl(var(--text-100, 0 0% 7%) / 0.12)",
    background: "hsl(var(--bg-000, 0 0% 100%))",
    color: "hsl(var(--text-100, 0 0% 7%))",
    font: "12px ui-sans-serif, system-ui, sans-serif", cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,.15)", opacity: "0.85",
  });
  btn.addEventListener("click", onClick);
  document.body.appendChild(btn);
  return btn;
}

export function setButtonActive(active) {
  const btn = document.getElementById(BUTTON_ID);
  if (btn) btn.style.opacity = active ? "1" : "0.85";
}

const PULSE_KEYFRAMES = [
  { transform: "scale(1)", boxShadow: "0 2px 8px rgba(0,0,0,.15)" },
  {
    transform: "scale(1.12)",
    boxShadow: "0 0 0 6px hsl(var(--accent-pro-100, 248 67% 63%) / 0.35), 0 2px 8px rgba(0,0,0,.15)",
  },
  { transform: "scale(1)", boxShadow: "0 2px 8px rgba(0,0,0,.15)" },
];

// Draw the eye to the floating button after a toolbar "summon": PiP needs a real
// in-page click, so we can only invite one. Pulse stops on click (the click then
// opens the widget) or after it runs its course.
export function pulseButton() {
  const btn = document.getElementById(BUTTON_ID);
  if (!btn) return;
  if (btn._cuwStopPulse) btn._cuwStopPulse(false);

  btn.style.opacity = "1";
  const anim = btn.animate(PULSE_KEYFRAMES, { duration: 900, iterations: 2, easing: "ease-in-out" });

  const stop = (restoreRest) => {
    btn._cuwStopPulse = null;
    btn.removeEventListener("click", onClick);
    anim.onfinish = null;
    anim.cancel();
    if (restoreRest) btn.style.opacity = "0.85";
  };
  const onClick = () => stop(false); // user clicked: open() now owns the opacity
  btn._cuwStopPulse = stop;
  btn.addEventListener("click", onClick);
  anim.onfinish = () => stop(true); // ran its course untouched: return to rest
}
