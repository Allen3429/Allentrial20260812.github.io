(() => {
  "use strict";

  const presenter = () => document.querySelector("#presenter");
  const badge = () => document.querySelector("#connectionBadge");
  const stateLabel = () => document.querySelector("#directAvatarState");
  const log = () => document.querySelector("#directAvatarLog");
  const buttons = () => [...document.querySelectorAll("[data-avatar-action]")];

  let speaking = false;
  let ready = false;
  let boundPresenter = null;

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

  function applyReady(isReady) {
    ready = Boolean(isReady);
    const label = stateLabel();
    if (label) {
      label.textContent = ready ? "Avatar 可直接互動" : "正在建立 Avatar…";
      label.classList.toggle("is-ready", ready);
    }
    buttons().forEach((button) => {
      button.disabled = !ready || (speaking && button.dataset.avatarAction !== "stop");
    });
  }

  function readStatus(event) {
    const detail = event?.detail;
    if (typeof detail === "string") return detail;
    return String(detail?.status || detail?.state || detail?.value || "");
  }

  function syncReady() {
    const badgeReady = badge()?.classList.contains("is-ready") === true;
    if (badgeReady) applyReady(true);
    else if (!ready) applyReady(false);
    bindPresenterEvents();
  }

  function onPresenterStatus(event) {
    const status = readStatus(event);
    if (status === "Ready") {
      applyReady(true);
      setLog("系統：", "Perxona Avatar 已 Ready。現在可以直接點按鈕與它互動。 ");
    } else if (status && status !== "Presenting") {
      if (!ready) {
        const label = stateLabel();
        if (label) label.textContent = `Perxona：${status}`;
      }
    }
  }

  function onFinished() {
    speaking = false;
    syncReady();
  }

  function bindPresenterEvents() {
    const current = presenter();
    if (!current || current === boundPresenter) return;
    if (boundPresenter) {
      boundPresenter.removeEventListener("PRESENTER_STATUS", onPresenterStatus);
      boundPresenter.removeEventListener("ALL_PERFORMANCE_FINISHED", onFinished);
    }
    boundPresenter = current;
    current.addEventListener("PRESENTER_STATUS", onPresenterStatus);
    current.addEventListener("ALL_PERFORMANCE_FINISHED", onFinished);
  }

  async function say(text, label) {
    if (!ready || speaking) return;
    const p = presenter();
    if (!p?.present) {
      setLog("系統：", "Presenter 尚未可用，請稍候。 ");
      return;
    }
    speaking = true;
    syncReady();
    setLog("Avatar：", label);
    try {
      await p.resumeAudioPlayback?.();
      const result = await p.present(text);
      if (result && result.success === false) throw new Error(result.message || "Perxona present failed");
    } catch (error) {
      setLog("系統：", `Avatar 發話失敗：${error.message}`);
    } finally {
      // Some SDK versions resolve present() before playback has fully finished.
      // ALL_PERFORMANCE_FINISHED will clear speaking when available; this timeout
      // prevents the direct controls from ever remaining locked.
      setTimeout(() => {
        speaking = false;
        syncReady();
      }, 900);
    }
  }

  function stop() {
    const p = presenter();
    try { p?.interruptPresentation?.(); } catch {}
    speaking = false;
    setLog("你：", "已中斷 Avatar。接下來改用你自己找到的官方聯絡方式驗證。 ");
    syncReady();
  }

  function bind() {
    buttons().forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.avatarAction;
        if (action === "stop") return stop();
        if (action === "start") return say(scripts.start, "急躁男性主管開始施壓，要求你立即執行。 ");
        if (action === "verify") return say(scripts.verify, "你要求獨立驗證，他會繼續催促你繞過流程。 ");
        if (action === "otp") return say(scripts.otp, "你拒絕提供 OTP，他會加大時間壓力。 ");
      });
    });

    const observer = new MutationObserver(syncReady);
    const badgeNode = badge();
    if (badgeNode) observer.observe(badgeNode, { attributes: true, attributeFilter: ["class"], childList: true, subtree: true });

    // Presenter can be recreated during fallback. Watch the host and rebind to
    // the replacement element so direct interaction survives automatic retry.
    const host = document.querySelector("#presenterHost");
    if (host) new MutationObserver(bindPresenterEvents).observe(host, { childList: true, subtree: true });

    bindPresenterEvents();
    syncReady();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind, { once: true });
  else bind();
})();
