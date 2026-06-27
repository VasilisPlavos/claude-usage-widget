const INDICATORS = new Set(["none", "minor", "major", "critical"]);
const IMPACT_RANK = { critical: 3, major: 2, minor: 1, none: 0, maintenance: 0 };

function readIncident(inc) {
  const name = inc && typeof inc.name === "string" ? inc.name : "";
  const impact = inc && typeof inc.impact === "string" ? inc.impact : "none";
  const status = inc && typeof inc.status === "string" ? inc.status : "";
  const updates = inc && Array.isArray(inc.incident_updates) ? inc.incident_updates : [];
  const body = updates.length && typeof updates[0].body === "string" ? updates[0].body : "";
  return { name, impact, status, body };
}

export function parseStatus(json) {
  const status = json && json.status;
  const indicator = status && INDICATORS.has(status.indicator) ? status.indicator : "unknown";
  const description = status && typeof status.description === "string"
    ? status.description
    : "Status unavailable";
  const raw = json && Array.isArray(json.incidents) ? json.incidents : [];
  const incidents = raw
    .map(readIncident)
    .sort((a, b) => (IMPACT_RANK[b.impact] || 0) - (IMPACT_RANK[a.impact] || 0));
  return { indicator, description, incidents };
}

export async function fetchStatus() {
  const res = await fetch("https://status.claude.com/api/v2/summary.json", { credentials: "omit" });
  if (!res.ok) throw new Error(`status HTTP ${res.status}`);
  return parseStatus(await res.json());
}

export function statusDotClass(indicator) {
  switch (indicator) {
    case "none": return "cu-dot--ok";
    case "minor": return "cu-dot--minor";
    case "major": return "cu-dot--major";
    case "critical": return "cu-dot--critical";
    default: return "cu-dot--unknown";
  }
}
