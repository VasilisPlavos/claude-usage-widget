const KEYS = { session: "five_hour", allModels: "seven_day", sonnet: "seven_day_sonnet" };

function readBucket(json, key) {
  const b = json && json[key];
  if (!b || typeof b.utilization !== "number") return null;
  return {
    pct: Math.max(0, Math.min(100, Math.round(b.utilization))),
    resetsAt: b.resets_at ? new Date(b.resets_at) : null,
  };
}

export function parseUsage(json) {
  return {
    session: readBucket(json, KEYS.session),
    allModels: readBucket(json, KEYS.allModels),
    sonnet: readBucket(json, KEYS.sonnet),
  };
}

export async function fetchOrgId() {
  const res = await fetch("/api/organizations", { credentials: "include" });
  if (!res.ok) throw new Error(`organizations HTTP ${res.status}`);
  const orgs = await res.json();
  const id = Array.isArray(orgs) && orgs[0] && orgs[0].uuid;
  if (!id) throw new Error("no organization found");
  return id;
}

export async function fetchUsage(orgId) {
  const res = await fetch(`/api/organizations/${orgId}/usage`, { credentials: "include" });
  if (!res.ok) throw new Error(`usage HTTP ${res.status}`);
  return parseUsage(await res.json());
}
