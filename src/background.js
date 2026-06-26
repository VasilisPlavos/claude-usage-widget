const CLAUDE_NEW = "https://claude.ai/new";
const SUMMON = { type: "cuw-summon" };

// Tabs we just opened via the toolbar that still owe a "summon" once their
// content script reports ready. Only needs to survive the brief gap between
// opening the tab and the page loading; losing it on a worker restart is
// harmless (the user just clicks the in-page button themselves).
const pendingSummons = new Set();

chrome.action.onClicked.addListener(() => {
  chrome.tabs
    .create({ url: CLAUDE_NEW, active: true })
    .then((tab) => pendingSummons.add(tab.id))
    .catch((e) => console.error("[cuw] open failed:", e));
});

// The content script pings once it has loaded and registered its listener. If we
// opened that tab via the toolbar, deliver the summon now — no timing guesswork.
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type !== "cuw-content-ready") return;
  const tabId = sender.tab?.id;
  if (tabId != null && pendingSummons.delete(tabId)) {
    chrome.tabs.sendMessage(tabId, SUMMON).catch(() => {});
  }
});

chrome.tabs.onRemoved.addListener((tabId) => pendingSummons.delete(tabId));
