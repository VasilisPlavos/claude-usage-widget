export function formatResetCountdown(resetsAt, now = new Date()) {
  const ms = resetsAt.getTime() - now.getTime();
  if (ms <= 0) return "Resetting…";
  if (ms < 60000) return "Resets in <1 min";
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 60) return `Resets in ${totalMin} min`;
  const hrs = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return mins === 0 ? `Resets in ${hrs} hr` : `Resets in ${hrs} hr ${mins} min`;
}

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
