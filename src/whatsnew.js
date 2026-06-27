// Pure version + changelog helpers. No DOM, no chrome — fully unit-testable.

// Compare dotted version strings numerically. Missing/garbage segments count
// as 0. Returns -1 if a < b, 0 if equal, 1 if a > b.
export function compareVersions(a, b) {
  const pa = String(a).split(".");
  const pb = String(b).split(".");
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = parseInt(pa[i], 10) || 0;
    const nb = parseInt(pb[i], 10) || 0;
    if (na !== nb) return na > nb ? 1 : -1;
  }
  return 0;
}

const VERSION_RE = /^\d+(\.\d+)*$/;

// Changelog entries strictly newer than `since`. If `since` is missing or not
// version-shaped (e.g. page opened manually with no ?since=), returns [].
export function entriesSince(changelog, since) {
  if (!since || !VERSION_RE.test(String(since))) return [];
  return changelog.filter((e) => compareVersions(e.version, since) > 0);
}

export function hasUpdatesSince(changelog, since) {
  return entriesSince(changelog, since).length > 0;
}

// Full decision for the background worker: open only on an update event, when
// the user hasn't opted out, and there is changelog content newer than their
// previous version.
export function shouldOpenWhatsNew({ reason, previousVersion, optedOut }, changelog) {
  if (reason !== "update") return false;
  if (optedOut === true) return false;
  return hasUpdatesSince(changelog, previousVersion);
}
