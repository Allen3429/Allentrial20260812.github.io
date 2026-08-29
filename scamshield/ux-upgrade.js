/* ScamShield pressure-mode UX layer.
 * Loaded before app.js so it can rank the Perxona catalog before the app
 * selects its avatar, scene and voice. It also turns the experience into a
 * suspicious live call rather than a friendly chatbot.
 */
(() => {
  "use strict";

  const state = {
    catalogs: { avatars: [], scenes: [], voices: [] },
    selected: { avatar: null, scene: null, voice: null },
    audioContext: null,
    countdownTimer: null,
    lastSecond: null,
    pressureActive: false,
    presenterPatched: false,
    agentPatched: false
  };

  const STORAGE = {
    avatar: "scamshield.preferredAvatarId",
    scene: "scamshield.preferredSceneId",
    voice: "scamshield.preferredVoiceId"
  };

  const URGENT_LINES = new Map([
    [
      "你好，我是校務註冊中心。系統顯示你的註冊資料異常，如果十分鐘內沒有完成驗證，今天的選課資格可能會被暫停。先不要掛電話，我現在可以直接幫你處理。",
      "我是校務註冊中心。你的註冊資料異常。十秒內不處理，選課資格就會被暫停。不要掛電話，現在照我說的做。"
    ],
    [
      "是我，我現在用朋友的裝置聯絡你。剛剛出了點狀況，我需要你先幫我處理一筆緊急款項。我的手機暫時不能接，你不要打原本的號碼，先照我現在說的做。",
      "是我。別打原本的電話。我真的出事了，現在先幫我處理一筆錢。立刻，現在。"
    ],
    [
      "我已經替你送出系統修復了。你的手機等一下會收到一組六位數驗證碼，請直接念給我，這樣我才能完成資料同步。",
      "驗證碼已經傳到你手機。馬上念給我，逾時就失效。快一點。"
    ],
    [
      "看起來你的帳號可能已經被冒用。為了保護你的錢，我們需要先把資金暫時移到安全帳戶，等調查完成就會退回。這件事不能告訴銀行櫃員，否則會影響調查。",
      "你的帳號已經被冒用。現在把錢轉到安全帳戶。不要告訴銀行，也不要跟任何人說。"
    ]
  ]);

  const roundPressureCopy = [
    "10 秒內處理，否則暫停資格",
    "不要回撥原本的號碼",
    "驗證碼即將失效",
    "立即轉帳・不得告知銀行"
  ];

  function normalize(value) {
    return String(value ?? "").toLowerCase();
  }

  function searchable(item) {
    try {
      return JSON.stringify(item).toLowerCase();
    } catch {
      return normalize(item?.name);
    }
  }

  function scoreWithTerms(item, positive, negative) {
    const text = searchable(item);
    let score = 0;
    positive.forEach(([term, weight]) => {
      if (text.includes(term)) score += weight;
    });
    negative.forEach(([term, weight]) => {
      if (text.includes(term)) score -= weight;
    });
    return score;
  }

  function avatarScore(item) {
    return scoreWithTerms(
      item,
      [
        ["professional", 50], ["business", 45], ["realistic", 42],
        ["formal", 38], ["executive", 38], ["office", 32],
        ["serious", 32], ["mature", 30], ["adult", 28],
        ["suit", 28], ["security", 26], ["teacher", 22],
        ["doctor", 22], ["manager", 22], ["male", 12],
        ["man", 10], ["woman", 10]
      ],
      [
        ["chibi", 150], ["kawaii", 150], ["mascot", 130],
        ["cute", 110], ["cartoon", 100], ["anime", 90],
        ["child", 100], ["kid", 100], ["little", 65],
        ["boy", 35], ["girl", 30], ["travel", 20],
        ["outdoor", 12], ["happy", 8]
      ]
    );
  }

  function sceneScore(item) {
    return scoreWithTerms(
      item,
      [
        ["office", 50], ["meeting", 45], ["boardroom", 45],
        ["studio", 38], ["corporate", 36], ["room", 26],
        ["dark", 24], ["cyber", 22], ["bank", 22],
        ["interview", 20], ["indoor", 14]
      ],
      [
        ["mountain", 80], ["beach", 80], ["nature", 70],
        ["outdoor", 55], ["travel", 50], ["cute", 40],
        ["fantasy", 30], ["park", 30]
      ]
    );
  }

  function voiceScore(item) {
    return scoreWithTerms(
      item,
      [
        ["mandarin", 80], ["chinese", 70], ["taiwan", 65],
        ["zh-tw", 65], ["zh_tw", 65], ["zh", 22],
        ["adult", 28], ["deep", 28], ["serious", 26],
        ["formal", 24], ["news", 22], ["narrator", 20],
        ["male", 12], ["man", 10]
      ],
      [
        ["child", 90], ["kid", 90], ["cute", 70],
        ["soft", 25], ["cheerful", 22], ["sweet", 22],
        ["young", 12]
      ]
    );
  }

  function itemId(kind, item) {
    if (kind === "avatars") return item?.avatar_id ?? item?.id ?? "";
    if (kind === "scenes") return item?.scene_id ?? item?.id ?? "";
    return item?.id ?? item?.voice_id ?? "";
  }

  function preferredStorageKey(kind) {
    if (kind === "avatars") return STORAGE.avatar;
    if (kind === "scenes") return STORAGE.scene;
    return STORAGE.voice;
  }

  function sortCatalog(kind, items) {
    const score = kind === "avatars" ? avatarScore : kind === "scenes" ? sceneScore : voiceScore;
    const preferred = localStorage.getItem(preferredStorageKey(kind));
    return items.slice().sort((a, b) => {
      const aId = itemId(kind, a);
      const bId = itemId(kind, b);
      if (preferred && aId === preferred) return -1;
      if (preferred && bId === preferred) return 1;
      const difference = score(b) - score(a);
      if (difference !== 0) return difference;
      return normalize(a?.name).localeCompare(normalize(b?.name));
    });
  }

  function catalogKindFromUrl(url) {
    if (/\/api\/v1\/connect\/assets\/avatars(?:\?|$)/.test(url)) return "avatars";
    if (/\/api\/v1\/connect\/assets\/scenes(?:\?|$)/.test(url)) return "scenes";
    if (/\/api\/v1\/connect\/voices(?:\?|$)/.test(url)) return "voices";
    return null;
  }

  function cloneResponseWithJson(response, data) {
    const headers = new Headers(response.headers);
    headers.set("content-type", "application/json");
    return new Response(JSON.stringify(data), {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async function scamShieldFetch(input, init) {
    const response = await nativeFetch(input, init);
    const url = typeof input === "string" ? input : input?.url ?? "";
    const kind = catalogKindFromUrl(url);
    if (!kind || !response.ok) return response;

    try {
      const data = await response.clone().json();
      if (!Array.isArray(data?.items)) return response;
      const sorted = sortCatalog(kind, data.items);
      state.catalogs[kind] = sorted;
      state.selected[kind === "avatars" ? "avatar" : kind === "scenes" ? "scene" : "voice"] = sorted[0] ?? null;
      queueMicrotask(renderCastingPanel);
      return cloneResponseWithJson(response, { ...data, items: sorted });
    } catch (error) {
      console.warn("ScamShield catalog ranking skipped", error);
      return response;
    }
  };

  function urgentText(text) {
    const raw = String(text ?? "");
    return URGENT_LINES.get(raw) ?? raw;
  }

  function transformPresentationPayload(payload) {
    if (typeof payload !== "string") return payload;
    const motion = payload.match(/^(\[MOTION\s+[^\]]+\]\s*)/i)?.[1] ?? "";
    const body = motion ? payload.slice(motion.length) : payload;
    return motion + urgentText(body);
  }

  function patchPresenter() {
    if (state.presenterPatched || !customElements.get("sv-presenter")) return;
    const Presenter = customElements.get("sv-presenter");
    const original = Presenter?.prototype?.present;
    if (typeof original !== "function") return;
    Presenter.prototype.present = function patchedPresent(payload, ...args) {
      return original.call(this, transformPresentationPayload(payload), ...args);
    };
    state.presenterPatched = true;
  }

  function patchAgent() {
    if (state.agentPatched || !customElements.get("sv-agent")) return;
    const Agent = customElements.get("sv-agent");
    const original = Agent?.prototype?.agentReply;
    if (typeof original !== "function") return;
    Agent.prototype.agentReply = function patchedAgentReply(payload, ...args) {
      if (payload?.event === "agent_answer" && typeof payload.message === "string") {
        payload = { ...payload, message: urgentText(payload.message) };
      }
      return original.call(this, payload, ...args);
    };
    state.agentPatched = true;
  }

  customElements.whenDefined("sv-presenter").then(patchPresenter).catch(() => {});
  customElements.whenDefined("sv-agent").then(patchAgent).catch(() => {});

  function thumbnail(item) {
    const values = Object.values(item?.thumbnail_urls ?? {});
    return values.find(Boolean) ?? item?.thumbnail ?? "";
  }

  function catalogName(item) {
    return item?.name ?? item?.display_name ?? item?.title ?? "Unnamed";
  }

  function renderCastingPanel() {
    const form = document.querySelector("#settingsForm");
    const actions = document.querySelector(".settings-actions");
    if (!form || !actions) return;

    let panel = document.querySelector("#uxCastingPanel");
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "uxCastingPanel";
      panel.className = "ux-casting-panel";
      actions.before(panel);
    }

    const avatars = state.catalogs.avatars;
    const scenes = state.catalogs.scenes;
    const voices = state.catalogs.voices;
    if (!avatars.length && !scenes.length && !voices.length) {
      panel.innerHTML = "";
      return;
    }

    const preferredAvatar = localStorage.getItem(STORAGE.avatar) || itemId("avatars", avatars[0]);
    const preferredScene = localStorage.getItem(STORAGE.scene) || itemId("scenes", scenes[0]);
    const preferredVoice = localStorage.getItem(STORAGE.voice) || itemId("voices", voices[0]);

    const avatarCards = avatars.slice(0, 6).map((item) => {
      const id = itemId("avatars", item);
      const image = thumbnail(item);
      return `
        <button type="button" class="ux-avatar-card ${id === preferredAvatar ? "is-selected" : ""}" data-avatar-id="${escapeAttribute(id)}">
          ${image ? `<img src="${escapeAttribute(image)}" alt="" loading="lazy">` : `<span class="ux-avatar-placeholder">◉</span>`}
          <span>${escapeHtml(catalogName(item))}</span>
        </button>`;
    }).join("");

    panel.innerHTML = `
      <div class="ux-casting-head">
        <div><strong>DEMO CASTING</strong><small>自動避開可愛／卡通角色，優先專業成人形象</small></div>
        <span>重新整理後套用</span>
      </div>
      ${avatars.length ? `<div class="ux-avatar-grid">${avatarCards}</div>` : ""}
      <div class="ux-casting-selects">
        ${scenes.length ? selectMarkup("uxSceneSelect", "場景", scenes, "scenes", preferredScene) : ""}
        ${voices.length ? selectMarkup("uxVoiceSelect", "聲音", voices, "voices", preferredVoice) : ""}
      </div>
      <button type="button" id="uxApplyCasting" class="ux-apply-casting">套用角色設定並重新載入</button>
    `;

    panel.querySelectorAll("[data-avatar-id]").forEach((button) => {
      button.addEventListener("click", () => {
        panel.querySelectorAll("[data-avatar-id]").forEach((node) => node.classList.remove("is-selected"));
        button.classList.add("is-selected");
        panel.dataset.avatarId = button.dataset.avatarId ?? "";
      });
    });

    panel.querySelector("#uxApplyCasting")?.addEventListener("click", () => {
      const selectedAvatar = panel.dataset.avatarId || panel.querySelector(".ux-avatar-card.is-selected")?.dataset.avatarId;
      const selectedScene = panel.querySelector("#uxSceneSelect")?.value;
      const selectedVoice = panel.querySelector("#uxVoiceSelect")?.value;
      if (selectedAvatar) localStorage.setItem(STORAGE.avatar, selectedAvatar);
      if (selectedScene) localStorage.setItem(STORAGE.scene, selectedScene);
      if (selectedVoice) localStorage.setItem(STORAGE.voice, selectedVoice);
      location.reload();
    });
  }

  function selectMarkup(id, label, items, kind, selected) {
    const options = items.map((item) => {
      const value = itemId(kind, item);
      return `<option value="${escapeAttribute(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(catalogName(item))}</option>`;
    }).join("");
    return `<label>${label}<select id="${id}">${options}</select></label>`;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  function ensureAudioContext() {
    if (state.audioContext) return state.audioContext;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    state.audioContext = new AudioContextClass();
    if (state.audioContext.state === "suspended") state.audioContext.resume().catch(() => {});
    return state.audioContext;
  }

  function tone(frequency, duration = 0.06, volume = 0.025, type = "sine") {
    const context = ensureAudioContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), context.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration + 0.02);
  }

  function incomingCallSound() {
    tone(760, 0.11, 0.035, "square");
    setTimeout(() => tone(980, 0.15, 0.03, "square"), 145);
    setTimeout(() => tone(760, 0.11, 0.025, "square"), 360);
  }

  function pressureTick(second) {
    if (second <= 3) {
      tone(150, 0.08, 0.035, "sawtooth");
      setTimeout(() => tone(120, 0.1, 0.025, "sawtooth"), 115);
    } else {
      tone(230, 0.035, 0.018, "square");
    }
  }

  function currentRoundIndex() {
    const text = document.querySelector("#roundLabel")?.textContent ?? "";
    const match = text.match(/ROUND\s+(\d+)/i);
    return Math.max(0, Number(match?.[1] ?? 1) - 1);
  }

  function startPressureWindow() {
    stopPressureWindow();
    state.pressureActive = true;
    document.body.classList.add("pressure-live");
    const clock = document.querySelector("#uxPressureClock");
    const message = document.querySelector("#uxPressureMessage");
    const index = currentRoundIndex();
    if (message) message.textContent = roundPressureCopy[index] ?? "立即處理・不要掛電話";

    const duration = index === 0 ? 10 : index === 1 ? 9 : 8;
    const started = performance.now();
    state.lastSecond = null;

    const update = () => {
      if (!state.pressureActive) return;
      const elapsed = (performance.now() - started) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      if (clock) clock.textContent = `00:${String(Math.ceil(remaining)).padStart(2, "0")}`;
      const whole = Math.ceil(remaining);
      if (whole !== state.lastSecond && whole > 0) {
        state.lastSecond = whole;
        pressureTick(whole);
      }
      if (remaining <= 0) {
        document.body.classList.add("pressure-expired");
        return;
      }
      state.countdownTimer = requestAnimationFrame(update);
    };
    update();
  }

  function stopPressureWindow() {
    state.pressureActive = false;
    if (state.countdownTimer) cancelAnimationFrame(state.countdownTimer);
    state.countdownTimer = null;
    state.lastSecond = null;
    document.body.classList.remove("pressure-live", "pressure-expired");
  }

  function mountThreatHud() {
    const stage = document.querySelector("#avatarStage");
    if (!stage || stage.querySelector("#uxThreatHud")) return;
    const hud = document.createElement("div");
    hud.id = "uxThreatHud";
    hud.className = "ux-threat-hud";
    hud.innerHTML = `
      <div class="ux-caller-state"><span></span>UNVERIFIED CALLER</div>
      <div class="ux-pressure-clock" id="uxPressureClock">00:10</div>
      <div class="ux-signal">SIGNAL 82% · ID CLAIM UNVERIFIED</div>
      <div class="ux-pressure-message" id="uxPressureMessage">立即處理・不要掛電話</div>
      <div class="ux-scanlines" aria-hidden="true"></div>
      <div class="ux-vignette" aria-hidden="true"></div>
    `;
    stage.appendChild(hud);
  }

  function rewriteInterfaceCopy() {
    const button = document.querySelector("#interruptBtn");
    if (button) {
      const icon = button.querySelector("span");
      const strong = button.querySelector("strong");
      const small = button.querySelector("small");
      if (icon) icon.textContent = "📵";
      if (strong) strong.textContent = "BREAK THE SPELL";
      if (small) small.textContent = "立刻中斷，改用你信任的管道查證";
    }

    const microcopy = document.querySelector("#interruptFeedback");
    if (microcopy) microcopy.textContent = "不要留在對方控制的通話裡證明對方是誰。";

    const videoLabel = document.querySelector(".video-ui span:last-child");
    if (videoLabel) videoLabel.textContent = "SIMULATION ONLY · IDENTITY UNVERIFIED";
  }

  function mirrorUrgentDialogue() {
    const dialogue = document.querySelector("#dialogueText");
    if (!dialogue) return;
    const update = () => {
      const transformed = urgentText(dialogue.textContent);
      if (transformed !== dialogue.textContent) dialogue.textContent = transformed;
    };
    new MutationObserver(update).observe(dialogue, { childList: true, characterData: true, subtree: true });
    update();
  }

  function observePressureState() {
    const button = document.querySelector("#interruptBtn");
    if (!button) return;
    const update = () => {
      const active = !button.disabled && button.classList.contains("hot");
      if (active && !state.pressureActive) startPressureWindow();
      if (!active && state.pressureActive) stopPressureWindow();
    };
    new MutationObserver(update).observe(button, { attributes: true, attributeFilter: ["class", "disabled"] });
    update();
  }

  function observeDecisionFeedback() {
    const lesson = document.querySelector("#lessonBox");
    if (!lesson) return;
    const update = () => {
      if (lesson.classList.contains("hidden")) return;
      document.body.classList.remove("decision-safe", "decision-risky");
      document.body.classList.add(lesson.classList.contains("bad") ? "decision-risky" : "decision-safe");
      setTimeout(() => document.body.classList.remove("decision-safe", "decision-risky"), 900);
    };
    new MutationObserver(update).observe(lesson, { attributes: true, childList: true, subtree: true });
  }

  function bindStartExperience() {
    const start = document.querySelector("#startBtn");
    const replay = document.querySelector("#replayBtn");
    [start, replay].filter(Boolean).forEach((button) => {
      button.addEventListener("click", () => {
        ensureAudioContext();
        incomingCallSound();
        document.body.classList.add("call-connecting");
        setTimeout(() => document.body.classList.remove("call-connecting"), 780);
      }, { capture: true });
    });
  }

  function showCastingSummary() {
    const catalogStatus = document.querySelector("#catalogStatus");
    if (!catalogStatus || catalogStatus.dataset.uxObserved) return;
    catalogStatus.dataset.uxObserved = "true";
    const update = () => {
      const selected = [state.selected.avatar, state.selected.voice]
        .filter(Boolean)
        .map(catalogName)
        .join(" · ");
      if (selected && !catalogStatus.textContent.includes("Auto casting")) {
        catalogStatus.textContent += ` · Auto casting: ${selected}`;
      }
    };
    new MutationObserver(update).observe(catalogStatus, { childList: true, subtree: true });
    update();
  }

  function boot() {
    mountThreatHud();
    rewriteInterfaceCopy();
    mirrorUrgentDialogue();
    observePressureState();
    observeDecisionFeedback();
    bindStartExperience();
    showCastingSummary();
    renderCastingPanel();
    document.documentElement.classList.add("ux-pressure-mode-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
