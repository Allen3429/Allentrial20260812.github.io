/* Public-review stability guard.
 * The old prototype considered the presence of agentReply/connection-done enough
 * to mark the Avatar ready. Perxona documents `life-status: ready` as the
 * successful avatar-ready signal. This guard prevents premature gameplay and
 * removes the undocumented presentationMode="embedded" value.
 */
(() => {
  "use strict";

  window.SCAMSHIELD_AVATAR_READY = false;
  window.SCAMSHIELD_AVATAR_STATUS = "booting";

  const nativeCreateElement = Document.prototype.createElement;
  Document.prototype.createElement = function patchedCreateElement(tagName, options) {
    const element = nativeCreateElement.call(this, tagName, options);
    if (String(tagName).toLowerCase() !== "sv-agent") return element;

    const nativeSetAttribute = element.setAttribute.bind(element);
    element.setAttribute = function safeAgentAttribute(name, value) {
      const key = String(name).toLowerCase();
      if (key === "presentationmode" && String(value).toLowerCase() === "embedded") {
        // `embedded` is not in the public SDK documentation. Omitting the value
        // keeps the official component layout path instead of entering an
        // undefined presentation state.
        return;
      }
      if (key === "enableuseractivationcheck") {
        return nativeSetAttribute(name, "false");
      }
      return nativeSetAttribute(name, value);
    };

    nativeSetAttribute("readyToShowPolicy", "showWhenAssetsLoading");
    nativeSetAttribute("enableUserActivationCheck", "false");
    return element;
  };

  function badge() { return document.querySelector("#connectionBadge"); }
  function startButton() { return document.querySelector("#startBtn"); }
  function loadingDetail() { return document.querySelector(".reviewer-boot-note, #loadingDetail"); }

  function showLoading(text = "正在等待 Perxona 3D Avatar 完成") {
    window.SCAMSHIELD_AVATAR_READY = false;
    window.SCAMSHIELD_AVATAR_STATUS = "loading";
    const b = badge();
    if (b) {
      b.textContent = "Perxona Avatar loading…";
      b.className = "badge badge-offline";
    }
    const start = startButton();
    if (start) {
      start.disabled = true;
      start.innerHTML = "正在載入真正的 Perxona Avatar… <span>◌</span>";
    }
    const detail = loadingDetail();
    if (detail) detail.textContent = text;
  }

  function showReady() {
    window.SCAMSHIELD_AVATAR_READY = true;
    window.SCAMSHIELD_AVATAR_STATUS = "ready";
    const b = badge();
    if (b) {
      b.textContent = "Perxona Avatar ready";
      b.className = "badge badge-online";
    }
    const start = startButton();
    if (start) {
      start.disabled = false;
      start.innerHTML = "開始 Perxona Avatar 演練 <span>→</span>";
    }
    document.body.classList.add("verified-avatar-ready");
    document.dispatchEvent(new CustomEvent("scamshield-avatar-ready"));
  }

  function showDisconnected() {
    window.SCAMSHIELD_AVATAR_READY = false;
    window.SCAMSHIELD_AVATAR_STATUS = "disconnected";
    const b = badge();
    if (b) {
      b.textContent = "Perxona Avatar reconnecting…";
      b.className = "badge badge-offline";
    }
    const start = startButton();
    if (start) start.disabled = true;
  }

  function bind(widget) {
    if (!widget || widget.dataset.scamshieldStrictReady === "1") return;
    widget.dataset.scamshieldStrictReady = "1";
    showLoading();

    widget.addEventListener("asset-download-status", (event) => {
      const asset = event.detail?.asset || "3D";
      const progress = Number(event.detail?.progress || 0);
      showLoading(`正在下載 ${asset} 資產：${Math.round(progress)}%`);
    });

    widget.addEventListener("life-status", (event) => {
      const state = String(event.detail?.status || "").toLowerCase();
      window.SCAMSHIELD_AVATAR_STATUS = state;
      console.info("ScamShield strict Perxona status:", state, event.detail);
      if (state === "ready") showReady();
      else if (state === "disconnected") showDisconnected();
      else if (state === "connection-done") showLoading("服務已連線；正在等待 3D Avatar 畫面完成。只有 ready 才會解鎖。 ");
      else if (state === "downloading-assets") showLoading("正在下載 Perxona Avatar、Motion 與 Scene。 ");
      else if (state === "agent-preparation" || state === "connection-start") showLoading("正在建立 Perxona Avatar 工作階段。 ");
    });
  }

  function scan() {
    document.querySelectorAll("#agentMount sv-agent, sv-agent").forEach(bind);
  }

  document.addEventListener("click", (event) => {
    const start = event.target.closest?.("#startBtn");
    if (start && !window.SCAMSHIELD_AVATAR_READY) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showLoading("Avatar 還沒真的 ready；本站不會再讓計時器或關卡提前開始。 ");
    }
  }, true);

  const domObserver = new MutationObserver(() => {
    scan();
    const b = badge();
    if (!window.SCAMSHIELD_AVATAR_READY && b?.classList.contains("badge-online")) {
      // app.js may still finish its legacy promise early. Immediately restore
      // the strict state until the widget emits the documented `ready` event.
      showLoading("Perxona 元件已建立，仍在等待實際 Avatar ready 事件。 ");
    }
  });

  function boot() {
    scan();
    domObserver.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
