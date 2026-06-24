// Classic content script. Dynamic-import the ES module entrypoint into the
// extension's isolated world so the rest of the code can use ES modules.
import(chrome.runtime.getURL("src/content.js")).catch((e) =>
  console.error("[Claude Usage Widget Lite] loader failed to import content.js:", e)
);
