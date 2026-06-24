// Centralized, manifest-derived runtime constants. Keeping the product name in
// one place (manifest.json -> "name") means a rename only touches the manifest.
// Available in any extension context where `chrome` exists: the background
// worker and content scripts, including the modules loader.js imports into the
// isolated world.
export const ENV = {
  AppTitle: chrome.runtime.getManifest().name,
};
