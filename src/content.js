import { ENV } from "./ENV.js";
import { fetchOrgId, fetchUsage } from "./usage-api.js";
import { fetchStatus } from "./status-api.js";
import { mountWidget, renderUsage, renderStatus, renderMessage } from "./widget.js";
import { readClaudePalette, applyPalette, observeTheme } from "./theme.js";
import { injectButton, setButtonActive, pulseButton } from "./button.js";
import { initInlineButton, setInlineButtonActive } from "./inline-button.js";

const POLL_MS = 60000;

let pipWindow = null;
let card = null;
let statusEl = null;
let lastStatus = null;
let orgId = null;
let lastData = null;
let pollTimer = null;
let countdownTimer = null;
let stopThemeObserver = null;
let opening = false;

async function refresh() {
  if (!pipWindow || !card) return;
  await Promise.all([refreshUsage(), refreshStatus()]);
}

async function refreshUsage() {
  try {
    if (!orgId) orgId = await fetchOrgId();
    if (!card) return;
    lastData = await fetchUsage(orgId);
    if (!card) return;
    renderUsage(card, lastData);
  } catch (err) {
    console.error(`[${ENV.AppTitle}] refresh failed:`, err);
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

async function refreshStatus() {
  if (!statusEl) return;
  try {
    lastStatus = await fetchStatus();
  } catch (err) {
    console.error(`[${ENV.AppTitle}] status failed:`, err);
    lastStatus = { indicator: "unknown", description: "Status unavailable", incidents: [] };
  }
  if (statusEl) renderStatus(statusEl, lastStatus);
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
  statusEl = null;
  lastStatus = null;
  orgId = null;
  setButtonActive(false);
  setInlineButtonActive(false);
}

async function open() {
  if (pipWindow) { pipWindow.focus(); return; }
  if (opening) return;
  if (!("documentPictureInPicture" in window)) {
    console.warn(`[${ENV.AppTitle}] Document PiP unsupported in this browser.`);
    return;
  }
  opening = true;
  try {
    const win = await documentPictureInPicture.requestWindow({ width: 240, height: 200 });
    win.addEventListener("pagehide", handlePipClosed);
    const ui = mountWidget(win.document);
    card = ui.card;
    statusEl = ui.status;
    ui.closeBtn.addEventListener("click", close);
    applyPalette(win.document, readClaudePalette());
    stopThemeObserver = observeTheme(syncTheme);
    renderMessage(card, "Loading…");
    setButtonActive(true);
    setInlineButtonActive(true);
    pipWindow = win;
    await refresh();
    startTimers();
  } catch (err) {
    console.error(`[${ENV.AppTitle}] open failed:`, err);
    card = null;
    pipWindow = null;
    setButtonActive(false);
    setInlineButtonActive(false);
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
initInlineButton(toggle);
window.claudeUsageWidgetLite = { open, close, toggle };

// Toolbar click → background opens a fresh tab and sends a summon. PiP needs an
// in-page gesture, so we pulse the button to invite the click that opens it.
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "cuw-summon") pulseButton();
});
chrome.runtime.sendMessage({ type: "cuw-content-ready" }).catch(() => {});

console.log(`[${ENV.AppTitle}] ready`);
