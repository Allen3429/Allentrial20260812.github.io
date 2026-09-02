(() => {
  "use strict";

  const presenter = () => document.querySelector("#presenter");
  const badge = () => document.querySelector("#connectionBadge");
  const stateLabel = () => document.querySelector("#directAvatarState");
  const caption = () => document.querySelector(".preview-caption");
  const log = () => document.querySelector("#directAvatarLog");
  const buttons = () => [...document.querySelectorAll("[data-avatar-action]")];
  const loadingOverlay = () => document.querySelector("#avatarLoading");
  const host = () => document.querySelector("#presenterHost");

  let speaking = false;
  let readyEventSeen = false;
  let visuallyReady = false;
  let boundPresenter = null;
  let visualProbeToken = 0;

  const scripts = {
    start: "我是公司財務主管。這筆款項非常急，現在立刻照我說的操作。不要再確認，不要拖時間，現在就做。",
    verify: "你還要另外驗證？我已經說過這是主管指示。不要浪費時間，先做，其他流程之後再補。",
    otp: "只是一次性驗證碼。立刻念給我，現在就要。你再拖，整個流程就會被你卡住。"
  };

  function setLog(label, text) {
    const node = log();
    if (!node) return;
    node.innerHTML = `<strong>${label}</strong> ${text}`;
  }

  function canvasLooksRendered() {
    const p = presenter();
    if (!p) return false;
    const roots = [p.shadowRoot, p].filter(Boolean);
    for (const root of roots) {
      const canvases = root.querySelectorAll?.("canvas") || [];
      for (const canvas of canvases) {
        const rect = canvas.getBoundingClientRect?.();
        if ((canvas.width || 0) >= 64 && (canvas.height || 0) >= 64 && rect?.width >= 80 && rect?.height >= 80) return true;
      }
    }
    return false;
  }

  function hostLooksRenderable() {
    const h = host();
    const overlay = loadingOverlay();
    const p = presenter();
    if (!h || !p) return false;
    const rect = h.getBoundingClientRect();
    const overlayHidden = overlay?.classList.contains("is-hidden") || overlay?.hidden;
    return Boolean(overlayHidden && rect.width >= 120 && rect.height >= 120 && getComputedStyle(p).display !== "none");
  }

  function setVisualState(isReady) {
    visuallyReady = Boolean(isReady);
    const label = stateLabel();
    const previewCaption = caption();
    if (label) {
      label.textContent = visuallyReady ? "Avatar 已顯示 · 可直接互動" : readyEventSeen ? "Avatar Ready · 等待畫面顯示…" : "正在建立 Avatar…";
      label.classList.toggle("is-ready", visuallyReady);
    }
    if (previewCaption) {
      previewCaption.textContent = visuallyReady ? "LIVE PERXONA CONNECT · 可直接操作" : readyEventSeen ? "PERXONA READY · 正在顯示 AVATAR" : "PERXONA CONNECT · 正在載入 AVATAR";
      previewCaption.classList.toggle("is-ready", visuallyReady);
    }
    buttons().forEach((button) => {
      button.disabled = !visuallyReady || (speaking && button.dataset.avatarAction !== "stop");
    });
  }

  function confirmVisualReady() {
    const token = ++visualProbeToken;
    const started = performance.now();
    const probe = () => {
      if (token !== visualProbeToken || visuallyReady || !readyEventSeen) return;
      if (canvasLooksRendered()) {
        setVisualState(true);
        setLog("系統：", "Avatar 已實際顯示，現在可以直接互動。");
        return;
      }
      // Some Perxona builds keep their renderer in a closed shadow root. In
      // that case, require the real Ready event, hidden loading overlay, a real
      // host size, and several painted frames before enabling controls.
      if (performance.now() - started >= 700 && hostLooksRenderable()) {
        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (token !== visualProbeToken || !readyEventSeen) return;
          setVisualState(true);
          setLog("系統：", "Avatar 畫面已完成切換，現在可以直接互動。");
        }));
        return;
      }
      requestAnimationFrame(probe);
    };
    requestAnimationFrame(probe);
  }

  function readStatus(event) {
    const detail = event?.detail;
    if (typeof detail === "string") return detail;
    return String(detail?.status || detail?.state || detail?.value || "");
  }

  function syncReady() {
    const badgeReady = badge()?.classList.contains("is-ready") === true;
    if (badgeReady && !readyEventSeen) {
      readyEventSeen = true;
      setVisualState(false);
      confirmVisualReady();
    } else if (!badgeReady && !readyEventSeen) {
      setVisualState(false);
    }
    bindPresenterEvents();
  }

  function onPresenterStatus(event) {
    const status = readStatus(event);
    if (status === "Ready") {
      readyEventSeen = true;
      setVisualState(false);
      setLog("系統：", "Perxona 已 Ready，正在等待 Avatar 畫面真正顯示。");
      confirmVisualReady();
    } else if (status && status !== "Presenting" && !visuallyReady) {
      const label = stateLabel();
      if (label) label.textContent = `Perxona：${status}`;
    }
  }

  function onFinished() {
    speaking = false;
    setVisualState(visuallyReady);
  }

  function bindPresenterEvents() {
    const current = presenter();
    if (!current || current === boundPresenter) return;
    if (boundPresenter) {
      boundPresenter.removeEventListener("PRESENTER_STATUS", onPresenterStatus);
      boundPresenter.removeEventListener("ALL_PERFORMANCE_FINISHED", onFinished);
    }
    boundPresenter = current;
    readyEventSeen = false;
    visuallyReady = false;
    visualProbeToken += 1;
    current.addEventListener("PRESENTER_STATUS", onPresenterStatus);
    current.addEventListener("ALL_PERFORMANCE_FINISHED", onFinished);
    setVisualState(false);
  }

  async function say(text, label) {
    if (!visuallyReady || speaking) return;
    const p = presenter();
    if (!p?.present) {
      setLog("系統：", "Presenter 尚未可用，請稍候。");
      return;
    }
    speaking = true;
    setVisualState(true);
    setLog("Avatar：", label);
    try {
      await p.resumeAudioPlayback?.();
      const result = await p.present(text);
      if (result && result.success === false) throw new Error(result.message || "Perxona present failed");
    } catch (error) {
      setLog("系統：", `Avatar 發話失敗：${error.message}`);
    } finally {
      setTimeout(() => {
        speaking = false;
        setVisualState(visuallyReady);
      }, 900);
    }
  }

  function stop() {
    const p = presenter();
    try { p?.interruptPresentation?.(); } catch {}
    speaking = false;
    setLog("你：", "已中斷 Avatar。接下來改用你自己找到的官方聯絡方式驗證。");
    setVisualState(visuallyReady);
  }

  function bind() {
    buttons().forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.avatarAction;
        if (action === "stop") return stop();
        if (action === "start") return say(scripts.start, "急躁男性主管開始施壓，要求你立即執行。");
        if (action === "verify") return say(scripts.verify, "你要求獨立驗證，他會繼續催促你繞過流程。");
        if (action === "otp") return say(scripts.otp, "你拒絕提供 OTP，他會加大時間壓力。");
      });
    });

    const observer = new MutationObserver(syncReady);
    const badgeNode = badge();
    if (badgeNode) observer.observe(badgeNode, { attributes: true, attributeFilter: ["class"], childList: true, subtree: true });

    const hostNode = host();
    if (hostNode) new MutationObserver(() => {
      bindPresenterEvents();
      if (readyEventSeen && !visuallyReady) confirmVisualReady();
    }).observe(hostNode, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });

    bindPresenterEvents();
    syncReady();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind, { once: true });
  else bind();
})();
