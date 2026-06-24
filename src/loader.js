// Classic content script. Dynamic-import the ES module entrypoint into the
// extension's isolated world so the rest of the code can use ES modules.
// loader.js is a classic (non-module) content script, so it can't `import`
// ENV.js — it reads the manifest name directly, the same source ENV.AppTitle uses.
import(chrome.runtime.getURL("src/content.js")).catch((e) =>
  console.error(`[${chrome.runtime.getManifest().name}] loader failed to import content.js:`, e)
);
