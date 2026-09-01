(() => {
  "use strict";

  const API_KEY = "9208afe0-ae4b-4ab6-a26b-0f39519225a4";
  const PROFILE_ID = "01KZTY7DR2FC4AT24YS0YKF1H5";
  const SAFE_LINE = "我是公司資訊部。你的帳號正在遭到入侵，現在立刻核准手機上的 MFA 通知，不要掛斷。";

  const els = {
    shell: document.querySelector("#avatarShell"),
    status: document.querySelector("#status"),
    phase: document.querySelector("#phase"),
    progress: document.querySelector("#progress"),
    detail: document.querySelector("#loadingDetail"),
    play: document.querySelector("#playBtn"),
    interrupt: document.querySelector("#interruptBtn"),
    react: document.querySelector("#reactBtn"),
    errorBox: document.querySelector("#errorBox"),
    errorText: document.querySelector("#errorText"),
    retry: document.querySelector("#retryBtn")
  };

  let widget = document.querySelector("#liveAvatar");
  let trulyReady = false;
  let speaking = false;
  let readyTimer = null;
  let endTimer = null;
  let disconnects = 0;
  let mode = "3DPresentation";
  const assetProgress = { avatar: 0, motion: 0, scene: 0 };

  function status(kind, text) {
    els.status.className = `status ${kind}`;
    els.status.querySelector("span").textContent = text;
  }

  function setControls(enabled) {
    els.play.disabled = !enabled;
    els.react.disabled = !enabled;
    els.interrupt.disabled = !enabled || !speaking;
    els.play.textContent = enabled ? "播放防詐情境" : "Avatar 載入中…";
  }

  function setPhase(text, detail) {
    els.phase.textContent = text;
    if (detail) els.detail.textContent = detail;
  }

  function updateProgress() {
    const values = Object.values(assetProgress);
    const known = values.filter((value) => value > 0);
    const average = known.length ? Math.round(known.reduce((a, b) => a + b, 0) / known.length) : 0;
    els.progress.textContent = `${Math.min(99, average)}%`;
  }

  function clearTimers() {
    clearTimeout(readyTimer);
    clearTimeout(endTimer);
  }

  function detach() {
    if (!widget) return;
    widget.removeEventListener("life-status", onLifeStatus);
    widget.removeEventListener("asset-download-status", onAssetProgress);
    widget.removeEventListener("conversation-status", onConversationStatus);
    widget.removeEventListener("agent-response-message", onAgentMessage);
  }

  function onAssetProgress(event) {
    const asset = String(event.detail?.asset || "").toLowerCase();
    const progress = Number(event.detail?.progress || 0);
    if (asset in assetProgress && Number.isFinite(progress)) {
      assetProgress[asset] = Math.max(assetProgress[asset], progress);
      updateProgress();
      setPhase(`正在下載 ${asset} 資產`, `Perxona 回報 ${asset} ${Math.round(progress)}%。`);
    }
  }

  function onLifeStatus(event) {
    const value = String(event.detail?.status || "").toLowerCase();
    console.info("Perxona life-status", value, event.detail);

    if (value === "agent-preparation") {
      setPhase("正在準備 Avatar", "驗證公開 Agent Profile 並建立角色工作階段。");
      status("loading", "正在準備 Perxona Avatar");
      return;
    }
    if (value === "downloading-assets") {
      setPhase("正在下載 3D 資產", "下載 Avatar、Motion 與 Scene；進度會顯示於右上角。");
      return;
    }
    if (value === "connection-start") {
      setPhase("正在連線 Avatar 服務", "連線完成不等於可操作；本站只在 Perxona 回報 ready 後解鎖。");
      return;
    }
    if (value === "connection-done") {
      setPhase("服務已連線，等待 3D 畫面", "正在等待 Perxona 的最終 ready 事件。");
      els.progress.textContent = "99%";
      return;
    }
    if (value === "ready") {
      markReady();
      return;
    }
    if (value === "disconnected") {
      disconnects += 1;
      if (!trulyReady) {
        setPhase("正在重新連線", `Perxona 尚未 ready，已自動重試 ${disconnects} 次。`);
        status("loading", "Perxona 重新連線中");
      } else {
        markError("Perxona Avatar 已斷線。請按重新載入後再操作。");
      }
    }
  }

  function onConversationStatus(event) {
    const value = String(event.detail?.status || "").toLowerCase();
    if (value === "rendering-response") {
      speaking = true;
      els.interrupt.disabled = false;
      els.play.textContent = "Avatar 正在說話…";
    }
    if (value === "idle" || value === "timeout") {
      finishSpeech();
    }
  }

  function onAgentMessage(event) {
    const value = String(event.detail?.event || "").toLowerCase();
    if (value === "agent-answer") {
      speaking = true;
      els.interrupt.disabled = false;
    }
    if (value === "agent-end") finishSpeech();
  }

  function markReady() {
    if (trulyReady) return;
    trulyReady = true;
    clearTimeout(readyTimer);
    els.shell.classList.add("is-ready");
    els.shell.setAttribute("aria-busy", "false");
    els.progress.textContent = "READY";
    setPhase("Avatar 已顯示，可直接操作", "點「播放防詐情境」，再於說話途中按「中斷 Avatar」。");
    status("ready", "Perxona Avatar 可互動");
    setControls(true);
    els.errorBox.hidden = true;
  }

  function markError(message) {
    trulyReady = false;
    speaking = false;
    clearTimers();
    status("error", "Perxona Avatar 未連線");
    setPhase("Avatar 尚未 ready", "不會把元件存在或 connection-done 誤判成可操作。");
    setControls(false);
    els.errorText.textContent = message;
    els.errorBox.hidden = false;
  }

  function finishSpeech() {
    speaking = false;
    clearTimeout(endTimer);
    els.interrupt.disabled = true;
    if (trulyReady) {
      els.play.disabled = false;
      els.play.textContent = "再播放一次";
      els.react.disabled = false;
    }
  }

  function bind(target) {
    target.addEventListener("life-status", onLifeStatus);
    target.addEventListener("asset-download-status", onAssetProgress);
    target.addEventListener("conversation-status", onConversationStatus);
    target.addEventListener("agent-response-message", onAgentMessage);
  }

  function createWidget(displayMode) {
    const target = document.createElement("sv-agent");
    target.id = "liveAvatar";
    target.setAttribute("apiKey", API_KEY);
    target.setAttribute("agentProfileId", PROFILE_ID);
    target.setAttribute("displayMode", displayMode);
    target.setAttribute("conversationMode", "inputText");
    target.setAttribute("readyToShowPolicy", "showWhenAssetsLoading");
    target.setAttribute("cameraAngle", "halfBody");
    target.setAttribute("initFov", JSON.stringify({ distance: 1, horizontal: 0, vertical: 0 }));
    target.setAttribute("enableUserActivationCheck", "true");
    target.setAttribute("appearanceMode", "dark");
    target.setAttribute("aria-label", "Live Perxona AI Avatar");
    return target;
  }

  function startTimeout() {
    clearTimeout(readyTimer);
    readyTimer = setTimeout(() => {
      if (trulyReady) return;
      if (mode === "3DPresentation") {
        mode = "fullPresentation";
        setPhase("切換 Perxona 官方完整顯示模式", "3D-only 模式尚未 ready，正在用 fullPresentation 重新建立 Avatar。");
        status("loading", "切換 Perxona 顯示模式");
        replaceWidget(mode);
      } else {
        markError("在 40 秒內未收到 Perxona 的 life-status: ready。這通常代表 Agent Profile、API Key、網域白名單或方案狀態需要在 Perxona Console 重新確認。");
      }
    }, mode === "3DPresentation" ? 18000 : 22000);
  }

  function replaceWidget(displayMode) {
    detach();
    widget?.remove();
    trulyReady = false;
    speaking = false;
    disconnects = 0;
    Object.keys(assetProgress).forEach((key) => { assetProgress[key] = 0; });
    updateProgress();
    els.shell.classList.remove("is-ready");
    els.shell.setAttribute("aria-busy", "true");
    els.errorBox.hidden = true;
    setControls(false);

    widget = createWidget(displayMode);
    bind(widget);
    els.shell.insertBefore(widget, els.shell.firstChild);
    startTimeout();
  }

  function play() {
    if (!trulyReady || typeof widget?.agentReply !== "function") return;
    speaking = true;
    els.play.disabled = true;
    els.play.textContent = "Avatar 正在說話…";
    els.react.disabled = true;
    els.interrupt.disabled = false;
    try {
      const accepted = widget.agentReply({
        event: "agent_answer",
        message: SAFE_LINE,
        motion_id: "talking"
      });
      console.info("Perxona agentReply accepted", accepted);
      endTimer = setTimeout(() => {
        try { widget.agentReply({ event: "agent_end", message: "" }); } catch {}
        finishSpeech();
      }, 11000);
    } catch (error) {
      markError(`Avatar 已 ready，但播放呼叫失敗：${error?.message || error}`);
    }
  }

  function interrupt() {
    if (!trulyReady || !speaking) return;
    try { widget.agentReply({ event: "agent_end", message: "" }); } catch {}
    finishSpeech();
    els.play.textContent = "已成功中斷 · 再播放";
  }

  function react() {
    if (!trulyReady || typeof widget?.agentReply !== "function") return;
    try {
      widget.agentReply({ event: "agent_answer", message: "你沒有在我的壓力下直接照做。", motion_id: "error" });
      speaking = true;
      els.interrupt.disabled = false;
      endTimer = setTimeout(() => {
        try { widget.agentReply({ event: "agent_end", message: "" }); } catch {}
        finishSpeech();
      }, 5000);
    } catch (error) {
      markError(`反應動作播放失敗：${error?.message || error}`);
    }
  }

  bind(widget);
  setControls(false);
  startTimeout();

  els.play.addEventListener("click", play);
  els.interrupt.addEventListener("click", interrupt);
  els.react.addEventListener("click", react);
  els.retry.addEventListener("click", () => location.reload());
})();
