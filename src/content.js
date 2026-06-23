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

async function refresh() {
  if (!pipWindow || !card) return;
  try {
    if (!orgId) orgId = await fetchOrgId();
    lastData = await fetchUsage(orgId);
    renderUsage(card, lastData);
  } catch (err) {
    console.error("[Claude Usage PiP] refresh failed:", err);
    const msg = String(err && err.message);
    if (/HTTP 40[13]/.test(msg)) {
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
  setButtonActive(false);
}

async function open() {
  if (pipWindow) { pipWindow.focus(); return; }
  if (!("documentPictureInPicture" in window)) {
    console.warn("[Claude Usage PiP] Document PiP unsupported in this browser.");
    return;
  }
  pipWindow = await documentPictureInPicture.requestWindow({ width: 280, height: 200 });
  const ui = mountWidget(pipWindow.document);
  card = ui.card;
  ui.closeBtn.addEventListener("click", close);
  applyPalette(pipWindow.document, readClaudePalette());
  stopThemeObserver = observeTheme(syncTheme);
  renderMessage(card, "Loading…");
  setButtonActive(true);
  pipWindow.addEventListener("pagehide", handlePipClosed);
  await refresh();
  startTimers();
}

function close() {
  if (pipWindow) pipWindow.close();
}

function toggle() { if (pipWindow) close(); else open(); }

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && pipWindow) refresh();
});

injectButton(toggle);
window.claudeUsagePip = { open, close, toggle };
console.log("[Claude Usage PiP] ready");
