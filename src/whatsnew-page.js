import { CHANGELOG } from "./whatsnew-data.js";
import { entriesSince } from "./whatsnew.js";

const OPT_OUT_KEY = "whatsNewOptOut";

function render() {
  const since = new URLSearchParams(location.search).get("since");
  const newVersions = new Set(entriesSince(CHANGELOG, since).map((e) => e.version));
  const list = document.getElementById("wn-list");

  for (const entry of CHANGELOG) {
    const card = document.createElement("section");
    card.className = "wn-entry";

    const head = document.createElement("div");
    head.className = "wn-entry-head";

    const ver = document.createElement("span");
    ver.className = "wn-entry-version";
    ver.textContent = "v" + entry.version;
    head.appendChild(ver);

    if (entry.title) {
      const title = document.createElement("span");
      title.className = "wn-entry-title";
      title.textContent = entry.title;
      head.appendChild(title);
    }
    if (newVersions.has(entry.version)) {
      const badge = document.createElement("span");
      badge.className = "wn-badge";
      badge.textContent = "New";
      head.appendChild(badge);
    }
    if (entry.date) {
      const date = document.createElement("span");
      date.className = "wn-entry-date";
      date.textContent = entry.date;
      head.appendChild(date);
    }
    card.appendChild(head);

    const ul = document.createElement("ul");
    ul.className = "wn-items";
    for (const item of entry.items) {
      const li = document.createElement("li");
      li.textContent = item;
      ul.appendChild(li);
    }
    card.appendChild(ul);
    list.appendChild(card);
  }
}

async function wireOptOut() {
  const box = document.getElementById("wn-optout");
  try {
    const stored = await chrome.storage.local.get(OPT_OUT_KEY);
    box.checked = stored[OPT_OUT_KEY] === true;
  } catch (e) {
    console.error("[cuw] optout read failed:", e);
  }
  box.addEventListener("change", () => {
    chrome.storage.local
      .set({ [OPT_OUT_KEY]: box.checked })
      .catch((e) => console.error("[cuw] optout write failed:", e));
  });
}

render();
wireOptOut();
