// SPIKE STUB — replaced by the full orchestrator in Task 7.
let pipWindow = null;

async function open() {
  if (pipWindow) { pipWindow.focus(); return; }
  if (!("documentPictureInPicture" in window)) {
    console.warn("[Claude Usage PiP] Document PiP unsupported in this browser.");
    return;
  }
  pipWindow = await documentPictureInPicture.requestWindow({ width: 280, height: 200 });
  const b = pipWindow.document.body;
  b.style.font = "13px system-ui, sans-serif";
  b.style.padding = "12px";
  b.textContent = "Claude Usage PiP — spike OK";
  pipWindow.addEventListener("pagehide", () => { pipWindow = null; });
}

function close() { if (pipWindow) pipWindow.close(); }
function toggle() { if (pipWindow) close(); else open(); }

window.claudeUsagePip = { open, close, toggle };
console.log("[Claude Usage PiP] content stub ready");
