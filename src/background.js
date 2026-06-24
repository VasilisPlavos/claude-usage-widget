const CLAUDE_MATCH = "https://claude.ai/*";
let pendingTabId = null;

chrome.action.onClicked.addListener(async (activeTab) => {
  const target = await pickClaudeTab(activeTab);
  if (!target) {
    const tab = await chrome.tabs.create({ url: "https://claude.ai/new" });
    pendingTabId = tab.id;
    await flashBadge("↻", "Click the icon again to show usage");
    return;
  }
  await clearBadge();
  try {
    await chrome.scripting.executeScript({
      target: { tabId: target.id },
      func: () => window.claudeUsagePip && window.claudeUsagePip.toggle(),
    });
  } catch (e) {
    console.error("[Claude Usage PiP] executeScript failed:", e);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === pendingTabId) {
    pendingTabId = null;
    clearBadge();
  }
});

async function pickClaudeTab(activeTab) {
  if (activeTab && activeTab.url && activeTab.url.startsWith("https://claude.ai/")) {
    return activeTab;
  }
  const tabs = await chrome.tabs.query({ url: CLAUDE_MATCH });
  return tabs.find((t) => t.active) || tabs[0] || null;
}

async function flashBadge(text, title) {
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color: "#6c5ce7" });
  if (title) await chrome.action.setTitle({ title });
}

async function clearBadge() {
  await chrome.action.setBadgeText({ text: "" });
  await chrome.action.setTitle({ title: "Toggle Claude usage widget" });
}
