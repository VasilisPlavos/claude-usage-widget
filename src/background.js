// Minimal service worker for the spike. Replaced by the full version in Task 8.
chrome.action.onClicked.addListener(async (activeTab) => {
  const target = await pickClaudeTab(activeTab);
  if (!target) {
    console.warn("[Claude Usage PiP] no claude.ai tab open");
    return;
  }
  try {
    await chrome.scripting.executeScript({
      target: { tabId: target.id },
      func: () => window.claudeUsagePip && window.claudeUsagePip.toggle(),
    });
  } catch (e) {
    console.error("[Claude Usage PiP] executeScript failed:", e);
  }
});

async function pickClaudeTab(activeTab) {
  if (activeTab && activeTab.url && activeTab.url.startsWith("https://claude.ai/")) {
    return activeTab;
  }
  const tabs = await chrome.tabs.query({ url: "https://claude.ai/*" });
  return tabs[0] || null;
}
