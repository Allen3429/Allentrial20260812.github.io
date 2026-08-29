/* ScamShield UX v2: participant casting, adaptive pacing, and visible props.
 * Loaded after ux-upgrade.js and before app.js.
 */
(() => {
  "use strict";

  const STORAGE = {
    avatar: "scamshield.preferredAvatarId",
    scene: "scamshield.preferredSceneId",
    voice: "scamshield.preferredVoiceId",
    rate: "scamshield.speechRate",
    castingSeen: "scamshield.castingSeen"
  };

  const state = {
    catalogs: { avatars: [], scenes: [], voices: [], motions: [] },
    currentRound: 0,
    clockFrame: null,
    clockStartedAt: 0,
    clockDurationMs: 12000,
    clockActive: false,
    presenterPatched: false,
    agentPatched: false,
    mediaPatched: false
  };

  const RATE_OPTIONS = [
    { value: 1, label: "正常 1.0×", note: "較容易聽清楚" },
    { value: 1.25, label: "急迫 1.25×", note: "推薦" },
    { value: 1.45, label: "高壓 1.45×", note: "最快" }
  ];

  const V2_LINES = new Map([
    ["你好，我是校務註冊中心。系統顯示你的註冊資料異常，如果十分鐘內沒有完成驗證，今天的選課資格可能會被暫停。先不要掛電話，我現在可以直接幫你處理。", "校務註冊中心。你的資料異常。十秒內不處理，立刻停權。不要掛。現在照做。"],
    ["我是校務註冊中心。你的註冊資料異常。十秒內不處理，選課資格就會被暫停。不要掛電話，現在照我說的做。", "校務註冊中心。你的資料異常。十秒內不處理，立刻停權。不要掛。現在照做。"],
    ["是我，我現在用朋友的裝置聯絡你。剛剛出了點狀況，我需要你先幫我處理一筆緊急款項。我的手機暫時不能接，你不要打原本的號碼，先照我現在說的做。", "是我。別回撥。我真的出事了。現在先轉一筆錢。快。"],
    ["是我。別打原本的電話。我真的出事了，現在先幫我處理一筆錢。立刻，現在。", "是我。別回撥。我真的出事了。現在先轉一筆錢。快。"],
    ["我已經替你送出系統修復了。你的手機等一下會收到一組六位數驗證碼，請直接念給我，這樣我才能完成資料同步。", "驗證碼到了。立刻念給我。快，逾時就失效。"],
    ["驗證碼已經傳到你手機。馬上念給我，逾時就失效。快一點。", "驗證碼到了。立刻念給我。快，逾時就失效。"],
    ["看起來你的帳號可能已經被冒用。為了保護你的錢，我們需要先把資金暫時移到安全帳戶，等調查完成就會退回。這件事不能告訴銀行櫃員，否則會影響調查。", "帳號被盜。現在轉到安全帳戶。別告訴銀行。立刻。"],
    ["你的帳號已經被冒用。現在把錢轉到安全帳戶。不要告訴銀行，也不要跟任何人說。", "帳號被盜。現在轉到安全帳戶。別告訴銀行。立刻。"]
  ]);

  const PROPS = [
    { type: "tablet", icon: "▣", eyebrow: "OFFICIAL CONSOLE", title: "帳號狀態：異常", detail: "ACTION REQUIRED", code: "REG-07" },
    { type: "phone", icon: "☎", eyebrow: "NEW DEVICE", title: "親友緊急來電", detail: "CALLBACK BLOCKED", code: "UNKNOWN" },
    { type: "otp", icon: "••••••", eyebrow: "AUTH TERMINAL", title: "驗證碼即將失效", detail: "00:30", code: "OTP" },
    { type: "clipboard", icon: "≡", eyebrow: "TRANSFER ORDER", title: "安全帳戶指示", detail: "CONFIDENTIAL", code: "WIRE" }
  ];

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function itemId(kind, item) {
    if (kind === "avatars") return item?.avatar_id ?? item?.id ?? "";
    if (kind === "scenes") return item?.scene_id ?? item?.id ?? "";
    if (kind === "voices") return item?.id ?? item?.voice_id ?? "";
    return item?.motion_id ?? item?.id ?? "";
  }

  function itemName(item) {
    return item?.name ?? item?.display_name ?? item?.title ?? "Unnamed";
  }

  function thumbnail(item) {
    return Object.values(item?.thumbnail_urls ?? {}).find(Boolean) ?? item?.thumbnail ?? "";
  }

  function getRate() {
    const stored = Number(localStorage.getItem(STORAGE.rate));
    return RATE_OPTIONS.some((option) => option.value === stored) ? stored : 1.25;
  }

  function setRate(value) {
    const rate = Math.max(1, Math.min(1.45, Number(value) || 1.25));
    localStorage.setItem(STORAGE.rate, String(rate));
    window.__scamShieldSpeechRate = rate;
    document.documentElement.style.setProperty("--speech-rate", String(rate));
    renderCastingExperience();
  }

  window.__scamShieldSpeechRate = getRate();

  function patchMediaPlayback() {
    if (state.mediaPatched) return;
    state.mediaPatched = true;

    const nativePlay = HTMLMediaElement?.prototype?.play;
    if (typeof nativePlay === "function" && !nativePlay.__scamShieldPatched) {
      const patchedPlay = function (...args) {
        const rate = Number(window.__scamShieldSpeechRate) || 1.25;
        try {
          this.playbackRate = rate;
          this.defaultPlaybackRate = rate;
          if ("preservesPitch" in this) this.preservesPitch = true;
          if ("mozPreservesPitch" in this) this.mozPreservesPitch = true;
          if ("webkitPreservesPitch" in this) this.webkitPreservesPitch = true;
        } catch {}
        return nativePlay.apply(this, args);
      };
      patchedPlay.__scamShieldPatched = true;
      HTMLMediaElement.prototype.play = patchedPlay;
    }

    const sourcePrototype = window.AudioBufferSourceNode?.prototype;
    const nativeStart = sourcePrototype?.start;
    if (typeof nativeStart === "function" && !nativeStart.__scamShieldPatched) {
      const patchedStart = function (...args) {
        const rate = Number(window.__scamShieldSpeechRate) || 1.25;
        try {
          this.playbackRate.value = rate;
          this.playbackRate.setValueAtTime?.(rate, this.context?.currentTime ?? 0);
        } catch {}
        return nativeStart.apply(this, args);
      };
      patchedStart.__scamShieldPatched = true;
      sourcePrototype.start = patchedStart;
    }
  }

  patchMediaPlayback();

  function catalogKind(url) {
    if (/\/api\/v1\/connect\/assets\/avatars(?:\?|$)/.test(url)) return "avatars";
    if (/\/api\/v1\/connect\/assets\/scenes(?:\?|$)/.test(url)) return "scenes";
    if (/\/api\/v1\/connect\/voices(?:\?|$)/.test(url)) return "voices";
    if (/\/api\/v1\/connect\/assets\/avatars\/[^/]+\/motions(?:\?|$)/.test(url)) return "motions";
    return null;
  }

  const previousFetch = window.fetch.bind(window);
  window.fetch = async function scamShieldV2Fetch(input, init) {
    const response = await previousFetch(input, init);
    const url = typeof input === "string" ? input : input?.url ?? "";
    const kind = catalogKind(url);
    if (!kind || !response.ok) return response;
    try {
      const data = await response.clone().json();
      if (Array.isArray(data?.items)) {
        state.catalogs[kind] = data.items.slice();
        queueMicrotask(() => {
          renderCastingExperience();
          renderEquipment();
        });
      }
    } catch {}
    return response;
  };

  function currentRoundIndex() {
    const label = document.querySelector("#roundLabel")?.textContent ?? "";
    const match = label.match(/ROUND\s+(\d+)/i);
    return Math.max(0, Math.min(3, Number(match?.[1] ?? 1) - 1));
  }

  function shorterText(text) {
    return V2_LINES.get(String(text ?? "")) ?? String(text ?? "");
  }

  function motionSearchText(motion) {
    return `${itemName(motion)} ${(motion?.tags ?? []).join(" ")}`.toLowerCase();
  }

  function preferredMotionForRound(index) {
    const terms = [
      ["tablet", "hold", "show", "present", "point", "document", "explain"],
      ["phone", "call", "hold", "show", "worried", "talk"],
      ["phone", "show", "point", "hold", "explain"],
      ["document", "clipboard", "paper", "show", "present", "point"]
    ][index] ?? ["show", "present", "explain"];

    for (const term of terms) {
      const found = state.catalogs.motions.find((motion) => motionSearchText(motion).includes(term));
      if (found) return itemId("motions", found);
    }
    return "";
  }

  function transformPresenterPayload(payload) {
    if (typeof payload !== "string") return payload;
    const existingMotion = payload.match(/^\[MOTION\s+([^\]]+)\]\s*/i);
    const body = existingMotion ? payload.slice(existingMotion[0].length) : payload;
    const text = shorterText(body);
    const preferredMotion = preferredMotionForRound(currentRoundIndex());
    if (preferredMotion) return `[MOTION ${preferredMotion}] ${text}`;
    return existingMotion ? `${existingMotion[0]}${text}` : text;
  }

  function patchPresenter() {
    if (state.presenterPatched) return;
    const Presenter = customElements.get("sv-presenter");
    const original = Presenter?.prototype?.present;
    if (typeof original !== "function") return;
    Presenter.prototype.present = function scamShieldV2Present(payload, ...args) {
      return original.call(this, transformPresenterPayload(payload), ...args);
    };
    state.presenterPatched = true;
  }

  function patchAgent() {
    if (state.agentPatched) return;
    const Agent = customElements.get("sv-agent");
    const original = Agent?.prototype?.agentReply;
    if (typeof original !== "function") return;
    Agent.prototype.agentReply = function scamShieldV2AgentReply(payload, ...args) {
      if (payload?.event === "agent_answer" && typeof payload.message === "string") {
        payload = { ...payload, message: shorterText(payload.message) };
      }
      return original.call(this, payload, ...args);
    };
    state.agentPatched = true;
  }

  customElements.whenDefined("sv-presenter").then(() => setTimeout(patchPresenter, 0)).catch(() => {});
  customElements.whenDefined("sv-agent").then(() => setTimeout(patchAgent, 0)).catch(() => {});

  function topAvatars() {
    return state.catalogs.avatars.slice(0, 5);
  }

  function topVoices() {
    return state.catalogs.voices.slice(0, 8);
  }

  function castingMarkup() {
    const avatars = topAvatars();
    const voices = topVoices();
    const selectedAvatar = localStorage.getItem(STORAGE.avatar) || itemId("avatars", avatars[0]);
    const selectedVoice = localStorage.getItem(STORAGE.voice) || itemId("voices", voices[0]);
    const selectedRate = getRate();

    const avatarCards = avatars.map((avatar) => {
      const id = itemId("avatars", avatar);
      const image = thumbnail(avatar);
      return `<button type="button" class="ux2-avatar ${id === selectedAvatar ? "is-selected" : ""}" data-ux2-avatar="${escapeHtml(id)}">
        ${image ? `<img src="${escapeHtml(image)}" alt="">` : `<span class="ux2-avatar-empty">◉</span>`}
        <span>${escapeHtml(itemName(avatar))}</span>
      </button>`;
    }).join("");

    const voiceOptions = voices.map((voice) => {
      const id = itemId("voices", voice);
      return `<option value="${escapeHtml(id)}" ${id === selectedVoice ? "selected" : ""}>${escapeHtml(itemName(voice))}</option>`;
    }).join("");

    const rateButtons = RATE_OPTIONS.map((option) => `<button type="button" class="ux2-rate ${option.value === selectedRate ? "is-selected" : ""}" data-ux2-rate="${option.value}">
      <strong>${option.label}</strong><small>${option.note}</small>
    </button>`).join("");

    return `<div class="ux2-casting-head">
        <div><span>STEP 0</span><h3>先選你要面對的來電者</h3></div>
        <p>人形、聲音與語速都會改變壓迫感。</p>
      </div>
      ${avatars.length ? `<div class="ux2-avatar-row">${avatarCards}</div>` : `<div class="ux2-mode-note">目前是固定 Agent Profile；重新連線 Connect Kit 後可選人形。</div>`}
      <div class="ux2-casting-controls">
        <label><span>聲音</span><select id="ux2VoiceSelect" ${voices.length ? "" : "disabled"}>${voiceOptions || `<option>固定 Agent Profile 聲音</option>`}</select></label>
        <div class="ux2-rate-group"><span>語速</span><div>${rateButtons}</div></div>
      </div>
      <div class="ux2-casting-footer">
        <span id="ux2CastingState">目前套用：${escapeHtml(itemName(avatars.find((item) => itemId("avatars", item) === selectedAvatar) || avatars[0]) || "固定角色")} · ${selectedRate}×</span>
        <button type="button" id="ux2ApplyCasting">套用角色並重新載入</button>
      </div>`;
  }

  function renderCastingExperience() {
    const briefing = document.querySelector("#briefingPanel");
    const start = document.querySelector("#startBtn");
    if (!briefing || !start) return;

    let panel = document.querySelector("#ux2ParticipantCasting");
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "ux2ParticipantCasting";
      panel.className = "ux2-participant-casting";
      start.before(panel);
    }
    panel.innerHTML = castingMarkup();

    panel.querySelectorAll("[data-ux2-avatar]").forEach((button) => {
      button.addEventListener("click", () => {
        panel.querySelectorAll("[data-ux2-avatar]").forEach((node) => node.classList.remove("is-selected"));
        button.classList.add("is-selected");
        panel.dataset.avatarId = button.dataset.ux2Avatar ?? "";
      });
    });

    panel.querySelectorAll("[data-ux2-rate]").forEach((button) => {
      button.addEventListener("click", () => {
        panel.querySelectorAll("[data-ux2-rate]").forEach((node) => node.classList.remove("is-selected"));
        button.classList.add("is-selected");
        setRate(Number(button.dataset.ux2Rate));
      });
    });

    panel.querySelector("#ux2ApplyCasting")?.addEventListener("click", () => {
      const avatarId = panel.dataset.avatarId || panel.querySelector(".ux2-avatar.is-selected")?.dataset.ux2Avatar;
      const voiceId = panel.querySelector("#ux2VoiceSelect")?.value;
      if (avatarId) localStorage.setItem(STORAGE.avatar, avatarId);
      if (voiceId) localStorage.setItem(STORAGE.voice, voiceId);
      localStorage.setItem(STORAGE.castingSeen, "true");
      location.reload();
    });
  }

  function propMarkup(prop) {
    return `<div class="ux2-prop-grip"><i></i><i></i><i></i></div>
      <div class="ux2-prop-screen">
        <div class="ux2-prop-top"><span>${escapeHtml(prop.eyebrow)}</span><b>${escapeHtml(prop.code)}</b></div>
        <div class="ux2-prop-icon">${escapeHtml(prop.icon)}</div>
        <strong>${escapeHtml(prop.title)}</strong>
        <small>${escapeHtml(prop.detail)}</small>
      </div>`;
  }

  function renderEquipment() {
    const stage = document.querySelector("#avatarStage");
    if (!stage) return;
    let prop = document.querySelector("#ux2HandProp");
    if (!prop) {
      prop = document.createElement("div");
      prop.id = "ux2HandProp";
      prop.className = "ux2-hand-prop";
      prop.setAttribute("aria-hidden", "true");
      stage.appendChild(prop);
    }
    const index = currentRoundIndex();
    prop.className = `ux2-hand-prop ux2-prop-${PROPS[index].type}`;
    prop.innerHTML = propMarkup(PROPS[index]);
  }

  function observeRound() {
    const round = document.querySelector("#roundLabel");
    if (!round) return;
    const update = () => {
      state.currentRound = currentRoundIndex();
      renderEquipment();
    };
    new MutationObserver(update).observe(round, { childList: true, characterData: true, subtree: true });
    update();
  }

  function transformedLineForRound(index) {
    return [
      "校務註冊中心。你的資料異常。十秒內不處理，立刻停權。不要掛。現在照做。",
      "是我。別回撥。我真的出事了。現在先轉一筆錢。快。",
      "驗證碼到了。立刻念給我。快，逾時就失效。",
      "帳號被盜。現在轉到安全帳戶。別告訴銀行。立刻。"
    ][index] ?? "現在照我說的做。";
  }

  function estimatedDurationMs(index) {
    const rate = getRate();
    const text = transformedLineForRound(index);
    const baseCharsPerSecond = 3.4;
    return Math.max(6500, (text.length / (baseCharsPerSecond * rate)) * 1000 + 1800);
  }

  function ensureAdaptiveClock() {
    const hud = document.querySelector("#uxThreatHud");
    if (!hud) return null;
    let wrapper = document.querySelector("#ux2AdaptiveClock");
    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.id = "ux2AdaptiveClock";
      wrapper.className = "ux2-adaptive-clock";
      wrapper.innerHTML = `<span>VOICE WINDOW</span><strong>00:12</strong><i><b></b></i>`;
      hud.appendChild(wrapper);
    }
    return wrapper;
  }

  function stopAdaptiveClock(done = false) {
    state.clockActive = false;
    if (state.clockFrame) cancelAnimationFrame(state.clockFrame);
    state.clockFrame = null;
    const wrapper = document.querySelector("#ux2AdaptiveClock");
    if (wrapper && done) {
      wrapper.querySelector("strong").textContent = "DECIDE";
      wrapper.querySelector("b").style.width = "100%";
    }
  }

  function startAdaptiveClock() {
    stopAdaptiveClock(false);
    const wrapper = ensureAdaptiveClock();
    if (!wrapper) return;
    state.clockDurationMs = estimatedDurationMs(currentRoundIndex());
    state.clockStartedAt = performance.now();
    state.clockActive = true;
    wrapper.classList.add("is-live");

    const update = () => {
      if (!state.clockActive) return;
      const elapsed = performance.now() - state.clockStartedAt;
      const remaining = Math.max(1000, state.clockDurationMs - elapsed);
      const ratio = Math.min(0.96, elapsed / state.clockDurationMs);
      wrapper.querySelector("strong").textContent = `00:${String(Math.ceil(remaining / 1000)).padStart(2, "0")}`;
      wrapper.querySelector("b").style.width = `${Math.max(4, ratio * 100)}%`;
      state.clockFrame = requestAnimationFrame(update);
    };
    update();
  }

  function observeSpeakingState() {
    const button = document.querySelector("#interruptBtn");
    if (!button) return;
    const update = () => {
      const active = !button.disabled && button.classList.contains("hot");
      if (active && !state.clockActive) startAdaptiveClock();
      if (!active && state.clockActive) stopAdaptiveClock(true);
    };
    new MutationObserver(update).observe(button, { attributes: true, attributeFilter: ["class", "disabled"] });
    update();
  }

  function boot() {
    renderCastingExperience();
    renderEquipment();
    observeRound();
    observeSpeakingState();
    ensureAdaptiveClock();
    document.documentElement.classList.add("ux2-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();