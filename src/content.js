import { fetchOrgId, fetchUsage } from "./usage-api.js";
import { mountWidget, renderUsage, renderMessage } from "./widget.js";
import { readClaudePalette, applyPalette, observeTheme } from "./theme.js";
import { injectButton, setButtonActive } from "./button.js";

const POLL_MS = 60000;

let pipWindow = null;
let card = null;
let orgId = null;
let lastData = null;
let pollTimer = null;
let countdownTimer = null;
let stopThemeObserver = null;
let opening = false;

async function refresh() {
  if (!pipWindow || !card) return;
  try {
    if (!orgId) orgId = await fetchOrgId();
    if (!card) return;
    lastData = await fetchUsage(orgId);
    if (!card) return;
    renderUsage(card, lastData);
  } catch (err) {
    console.error("[Claude Usage PiP] refresh failed:", err);
    if (!card) return;
    const msg = String(err && err.message);
    if (/HTTP 401/.test(msg)) {
      orgId = null;
      renderMessage(card, "Open Claude and sign in to see usage.");
    } else {
      renderMessage(card, "Couldn't load usage. Retrying…");
    }
  }
}

function syncTheme() {
  if (pipWindow) applyPalette(pipWindow.document, readClaudePalette());
}

function startTimers() {
  pollTimer = setInterval(refresh, POLL_MS);
  countdownTimer = setInterval(() => {
    if (card && lastData) renderUsage(card, lastData);
  }, POLL_MS);
}

function clearTimers() {
  clearInterval(pollTimer); pollTimer = null;
  clearInterval(countdownTimer); countdownTimer = null;
}

function handlePipClosed() {
  clearTimers();
  if (stopThemeObserver) { stopThemeObserver(); stopThemeObserver = null; }
  pipWindow = null;
  card = null;
  orgId = null;
  setButtonActive(false);
}

async function open() {
  if (pipWindow) { pipWindow.focus(); return; }
  if (opening) return;
  if (!("documentPictureInPicture" in window)) {
    console.warn("[Claude Usage PiP] Document PiP unsupported in this browser.");
    return;
  }
  opening = true;
  try {
    const win = await documentPictureInPicture.requestWindow({ width: 280, height: 200 });
    win.addEventListener("pagehide", handlePipClosed);
    const ui = mountWidget(win.document);
    card = ui.card;
    ui.closeBtn.addEventListener("click", close);
    applyPalette(win.document, readClaudePalette());
    stopThemeObserver = observeTheme(syncTheme);
    renderMessage(card, "Loading…");
    setButtonActive(true);
    pipWindow = win;
    await refresh();
    startTimers();
  } catch (err) {
    console.error("[Claude Usage PiP] open failed:", err);
    card = null;
    pipWindow = null;
  } finally {
    opening = false;
  }
}

function close() {
  if (pipWindow) pipWindow.close();
}

function toggle() { if (pipWindow) close(); else open().catch(console.error); }

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && pipWindow) refresh();
});

injectButton(toggle);
window.claudeUsagePip = { open, close, toggle };
console.log("[Claude Usage PiP] ready");
