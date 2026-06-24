chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: "https://claude.ai/new" });
});
