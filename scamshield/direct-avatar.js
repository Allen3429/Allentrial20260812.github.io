(() => {
  "use strict";

  const presenter = () => document.querySelector("#presenter");
  const badge = () => document.querySelector("#connectionBadge");
  const stateLabel = () => document.querySelector("#directAvatarState");
  const log = () => document.querySelector("#directAvatarLog");
  const buttons = () => [...document.querySelectorAll("[data-avatar-action]")];

  let speaking = false;
  let ready = false;

  const scripts = {
    start: "我是公司財務主管。這筆款項非常急，現在立刻照我說的操作，不要再經過其他人確認。",
    verify: "你現在還要另外驗證？我已經說過這是主管指示。不要浪費時間，先做再說。",
    otp: "只是一次性驗證碼而已，傳給我就能立刻完成。這件事很急，不要卡住流程。"
  };

  function setLog(label, text) {
    const node = log();
    if (!node) return;
    node.innerHTML = `<strong>${label}</strong> ${text}`;
  }

  function syncReady() {
    const isReady = badge()?.classList.contains("is-ready") === true;
    ready = isReady;
    const label = stateLabel();
    if (label) {
      label.textContent = isReady ? "Avatar 可直接互動" : "等待 Avatar Ready";
      label.classList.toggle("is-ready", isReady);
    }
    buttons().forEach((button) => {
      button.disabled = !isReady || (speaking && button.dataset.avatarAction !== "stop");
    });
  }

  async function say(text, label) {
    if (!ready || speaking) return;
    const p = presenter();
    if (!p?.present) return;
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
      speaking = false;
      syncReady();
    }
  }

  function stop() {
    const p = presenter();
    try { p?.interruptPresentation?.(); } catch {}
    speaking = false;
    setLog("你：", "已中斷 Avatar。接下來應改用你自己找到的官方聯絡方式驗證。 ");
    syncReady();
  }

  function bind() {
    buttons().forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.avatarAction;
        if (action === "stop") return stop();
        if (action === "start") return say(scripts.start, "以急迫與權威施壓，要求你立即執行。 ");
        if (action === "verify") return say(scripts.verify, "你要求改走獨立驗證管道，Avatar 會繼續施壓。 ");
        if (action === "otp") return say(scripts.otp, "你拒絕提供 OTP，Avatar 會試圖合理化要求。 ");
      });
    });

    const observer = new MutationObserver(syncReady);
    const badgeNode = badge();
    if (badgeNode) observer.observe(badgeNode, { attributes: true, attributeFilter: ["class"], childList: true, subtree: true });

    document.querySelector("#presenter")?.addEventListener("ALL_PERFORMANCE_FINISHED", () => {
      speaking = false;
      syncReady();
    });

    syncReady();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind, { once: true });
  else bind();
})();
