import { WIDGET_CSS } from "./widget.css.js";
import { formatResetCountdown, escapeHtml } from "./format.js";
import { statusDotClass } from "./status-api.js";

export function mountWidget(pipDocument) {
  const style = pipDocument.createElement("style");
  style.textContent = WIDGET_CSS;
  pipDocument.head.appendChild(style);
  pipDocument.body.innerHTML =
    '<button class="cu-close" title="Close" aria-label="Close">×</button>' +
    '<div class="cu-card" id="cu-card"></div>' +
    '<div class="cu-status" id="cu-status" tabindex="0" aria-label="Claude service status"></div>';
  return {
    card: pipDocument.getElementById("cu-card"),
    status: pipDocument.getElementById("cu-status"),
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

export function renderStatus(statusEl, status) {
  if (!status) { statusEl.innerHTML = ""; return; }
  const head =
    '<div class="cu-status-head">' +
      '<span class="cu-dot ' + statusDotClass(status.indicator) + '"></span>' +
      '<span class="cu-status-label">' + escapeHtml(status.description) + "</span>" +
    "</div>";
  let detail = "";
  if (status.incidents && status.incidents.length) {
    detail =
      '<div class="cu-status-detail">' +
        status.incidents.map((inc) =>
          '<div class="cu-incident">' +
            '<div class="cu-incident-name">' + escapeHtml(inc.name) + "</div>" +
            (inc.body ? '<div class="cu-incident-body">' + escapeHtml(inc.body) + "</div>" : "") +
          "</div>"
        ).join("") +
      "</div>";
  }
  statusEl.innerHTML = head + detail;
}
