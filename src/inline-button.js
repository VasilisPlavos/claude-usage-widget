const INLINE_BTN_ID = "claude-usage-pip-inline-btn";
const USAGE_HASH = "#settings/usage";
const OBSERVER_TIMEOUT_MS = 8000;

const PIP_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
  <rect x="8" y="7" width="6" height="4" rx="1" fill="currentColor"/>
</svg>`;

function findHeading() {
  for (const el of document.querySelectorAll("h1,h2,h3,h4,span")) {
    if (el.textContent.trim() === "Current session") {
      const parent = el.parentElement;
      return (parent && parent.tagName === "DIV") ? parent : el;
    }
  }
  return null;
}

function removeBtn() {
  document.getElementById(INLINE_BTN_ID)?.remove();
}

export function setInlineButtonActive(active) {
  const btn = document.getElementById(INLINE_BTN_ID);
  if (btn) btn.style.opacity = active ? "1" : "0.45";
}

function injectBtn(headingEl, onToggle) {
  if (document.getElementById(INLINE_BTN_ID)) return;
  const btn = document.createElement("button");
  btn.id = INLINE_BTN_ID;
  btn.type = "button";
  btn.title = "Open in Picture-in-Picture";
  btn.setAttribute("aria-label", "Open in Picture-in-Picture");
  btn.innerHTML = PIP_SVG;
  Object.assign(btn.style, {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2px",
    border: "none",
    background: "transparent",
    color: "hsl(var(--text-100, 0 0% 7%))",
    cursor: "pointer",
    opacity: "0.45",
    transition: "opacity 0.15s",
    borderRadius: "4px",
  });
  btn.addEventListener("mouseenter", () => { btn.style.opacity = "1"; });
  btn.addEventListener("mouseleave", () => { btn.style.opacity = "0.45"; });
  btn.addEventListener("click", (e) => { e.stopPropagation(); onToggle(); });
  headingEl.appendChild(btn);
}

function startObserver(onToggle) {
  const tryInject = () => {
    const heading = findHeading();
    if (heading) injectBtn(heading, onToggle);
  };
  const observer = new MutationObserver(tryInject);
  observer.observe(document.body, { childList: true, subtree: true });
  tryInject();
  return observer;
}

export function initInlineButton(onToggle) {
  let observer = null;
  let pendingTimer = null;
  let leakGuard = null;

  function activate() {
    if (observer) return;
    observer = startObserver(onToggle);
    leakGuard = setTimeout(() => {
      observer?.disconnect();
      observer = null;
    }, OBSERVER_TIMEOUT_MS);
  }

  function deactivate() {
    clearTimeout(pendingTimer);
    clearTimeout(leakGuard);
    pendingTimer = null;
    leakGuard = null;
    observer?.disconnect();
    observer = null;
    removeBtn();
  }

  if (location.hash === USAGE_HASH) activate();

  window.navigation?.addEventListener("navigate", (e) => {
    let hash;
    try { hash = new URL(e.destination.url).hash; } catch { return; }
    deactivate();
    if (hash === USAGE_HASH) {
      pendingTimer = setTimeout(activate, 150);
    }
  });
}
