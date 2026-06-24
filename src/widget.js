import { WIDGET_CSS } from "./widget.css.js";
import { formatResetCountdown } from "./format.js";

export function mountWidget(pipDocument) {
  const style = pipDocument.createElement("style");
  style.textContent = WIDGET_CSS;
  pipDocument.head.appendChild(style);
  pipDocument.body.innerHTML =
    '<button class="cu-close" title="Close" aria-label="Close">×</button>' +
    '<div class="cu-card" id="cu-card"></div>';
  return {
    card: pipDocument.getElementById("cu-card"),
    closeBtn: pipDocument.querySelector(".cu-close"),
  };
}

function barRow(label, pct) {
  return (
    '<div class="cu-row">' +
      '<div class="cu-row-head">' +
        '<span class="cu-row-label">' + label + "</span>" +
        '<span class="cu-row-pct">' + pct + "%</span>" +
      "</div>" +
      '<div class="cu-bar"><div class="cu-bar-fill" style="width:' + pct + '%"></div></div>' +
    "</div>"
  );
}

export function renderUsage(card, data, now = new Date()) {
  const parts = [];
  if (data.session) {
    parts.push('<div class="cu-title">Current session</div>');
    if (data.session.resetsAt) {
      parts.push('<div class="cu-sub">' + formatResetCountdown(data.session.resetsAt, now) + "</div>");
    }
    parts.push(barRow("", data.session.pct));
  }
  if (data.allModels) parts.push(barRow("All models", data.allModels.pct));
  if (data.sonnet) parts.push(barRow("Sonnet only", data.sonnet.pct));
  if (!parts.length) { renderMessage(card, "No usage data available."); return; }
  card.innerHTML = parts.join("");
}

export function renderMessage(card, message) {
  card.innerHTML = '<div class="cu-title">Claude usage</div><div class="cu-msg">' + message + "</div>";
}
