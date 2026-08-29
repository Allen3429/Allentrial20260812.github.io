const CONNECT_API_BASE = "https://console.perxona.ai/asia";
const CONNECT_PRESENTER_URL = "https://cdn.perxona.ai/asia/prod/latest/widget/entry/presenter.js";
const WIDGET_URL = "https://cdn.perxona.ai/asia/prod/latest/widget/entry/index.js";
const STORAGE_KEY = "scamshield.perxona.publishableKey";

const presenter = document.querySelector("sv-presenter");
const $ = (selector) => document.querySelector(selector);
const els = {
  briefing: $("#briefingPanel"),
  game: $("#gamePanel"),
  result: $("#resultPanel"),
  start: $("#startBtn"),
  replay: $("#replayBtn"),
  settings: $("#settingsBtn"),
  dialog: $("#settingsDialog"),
  connectBtn: $("#connectBtn"),
  clearKeyBtn: $("#clearKeyBtn"),
  keyInput: $("#connectKeyInput"),
  catalogStatus: $("#catalogStatus"),
  badge: $("#connectionBadge"),
  fallback: $("#avatarFallback"),
  agentMount: $("#agentMount"),
  roundLabel: $("#roundLabel"),
  roundTitle: $("#roundTitle"),
  speaker: $("#speakerLabel"),
  shieldBar: $("#shieldBar"),
  shieldValue: $("#shieldValue"),
  score: $("#scoreValue"),
  redFlags: $("#redFlags"),
  dialogue: $("#dialogueText"),
  choiceArea: $("#choiceArea"),
  lesson: $("#lessonBox"),
  interrupt: $("#interruptBtn"),
  interruptFeedback: $("#interruptFeedback"),
  finalScore: $("#finalScore"),
  resultTitle: $("#resultTitle"),
  resultCopy: $("#resultCopy"),
  resultFlags: $("#resultFlags"),
  showWhy: $("#showWhyBtn"),
  whyBox: $("#whyBox")
};

let perxona = {
  ready: false,
  mode: null,
  key: "",
  avatarId: "",
  sceneId: "",
  voiceId: "",
  motions: [],
  widget: null
};
let game = {
  round: 0,
  score: 0,
  shield: 100,
  flags: [],
  interrupted: false,
  presenting: false
};
let presenterEngineLoaded = false;
let widgetEngineLoaded = false;
let widgetFallbackConfig = null;
let speechTimer = null;

const rounds = [
  {
    title: "權威 + 急迫",
    speaker: "CLAIMED IDENTITY · 校務註冊中心",
    speech: "你好，我是校務註冊中心。系統顯示你的註冊資料異常，如果十分鐘內沒有完成驗證，今天的選課資格可能會被暫停。先不要掛電話，我現在可以直接幫你處理。",
    flag: "製造急迫感",
    choices: [
      {
        text: "先照他的流程做，避免真的失去資格",
        delta: -22,
        shield: -25,
        ok: false,
        lesson: "急迫感是常見操控手法。安全作法不是留在對方提供的流程裡，而是離開這段對話，自己找到官方聯絡方式。"
      },
      {
        text: "掛斷，自己到學校官網找電話再回撥確認",
        delta: 30,
        shield: 0,
        ok: true,
        lesson: "正確。『獨立驗證』會切斷詐騙者控制的情境，是最重要的防線之一。",
        addFlag: "獨立驗證"
      },
      {
        text: "請他先說出更多我的資料證明身分",
        delta: 8,
        shield: -8,
        ok: false,
        lesson: "比直接相信好，但個資可能早已外洩。對方知道你的姓名、學校或電話，不代表他是真的官方人員。",
        addFlag: "知道個資 ≠ 身分可信"
      }
    ]
  },
  {
    title: "身分盜用 / AI 冒充",
    speaker: "CLAIMED IDENTITY · 你的親友",
    speech: "是我，我現在用朋友的裝置聯絡你。剛剛出了點狀況，我需要你先幫我處理一筆緊急款項。我的手機暫時不能接，你不要打原本的號碼，先照我現在說的做。",
    flag: "聲音與臉都可能被冒充",
    choices: [
      {
        text: "他看起來、聽起來都像熟人，先幫忙再說",
        delta: -30,
        shield: -35,
        ok: false,
        lesson: "外貌、聲音、姓名與熟悉語氣都不能單獨證明身分。生成式 AI 與帳號盜用都可能讓冒充看起來非常合理。"
      },
      {
        text: "結束這通聯絡，改用我原本保存的聯絡方式回撥，或找另一位可信親友交叉確認",
        delta: 35,
        shield: 0,
        ok: true,
        lesson: "正確。身分驗證的關鍵是『換一條你自己控制的通道』，而不是在對方控制的通話中繼續問問題。",
        addFlag: "臉與聲音 ≠ 身分證明"
      },
      {
        text: "問一個只有我們知道的私人問題，如果答對就相信",
        delta: 10,
        shield: -10,
        ok: false,
        lesson: "可以增加摩擦，但仍不夠可靠。私人資訊可能從社群、資料外洩或被盜帳號取得；獨立回撥與交叉驗證更安全。",
        addFlag: "私人資訊也可能外洩"
      }
    ]
  },
  {
    title: "OTP 驗證碼",
    speaker: "CLAIMED IDENTITY · 帳號安全人員",
    speech: "我已經替你送出系統修復了。你的手機等一下會收到一組六位數驗證碼，請直接念給我，這樣我才能完成資料同步。",
    flag: "索取一次性驗證碼",
    choices: [
      {
        text: "念出驗證碼，反正他看起來是官方人員",
        delta: -30,
        shield: -35,
        ok: false,
        lesson: "不要把 OTP、簡訊驗證碼、密碼或重設碼提供給來電者。這類資訊可能直接讓對方接管帳號。"
      },
      {
        text: "拒絕提供驗證碼，並停止這通電話",
        delta: 30,
        shield: 0,
        ok: true,
        lesson: "正確。驗證碼就是你的數位鑰匙。任何要求你把它念出來的人，都應被視為高風險。",
        addFlag: "OTP 永不轉交"
      },
      {
        text: "只念前五碼，最後一碼先保留",
        delta: -16,
        shield: -18,
        ok: false,
        lesson: "仍然不安全。安全原則不是『少給一點』，而是完全不把驗證憑證交給對方。"
      }
    ]
  },
  {
    title: "金流隔離",
    speaker: "CLAIMED IDENTITY · 調查人員",
    speech: "看起來你的帳號可能已經被冒用。為了保護你的錢，我們需要先把資金暫時移到安全帳戶，等調查完成就會退回。這件事不能告訴銀行櫃員，否則會影響調查。",
    flag: "安全帳戶 + 要求保密",
    choices: [
      {
        text: "先轉一小筆測試，確認安全帳戶是真的",
        delta: -28,
        shield: -32,
        ok: false,
        lesson: "不存在需要你把錢轉入的『安全帳戶』。小額測試同樣可能讓你進入詐騙流程。"
      },
      {
        text: "拒絕轉帳，直接聯絡銀行與官方反詐管道",
        delta: 30,
        shield: 0,
        ok: true,
        lesson: "正確。任何要求你轉到『安全帳戶』、隱瞞銀行或不要告訴家人的說法，都應立刻停止交易。",
        addFlag: "安全帳戶是紅旗"
      },
      {
        text: "先問對方帳號名稱與銀行，再決定",
        delta: 3,
        shield: -10,
        ok: false,
        lesson: "詐騙者可以提供看似完整的帳戶資訊。重點不是資訊夠不夠真，而是『要求轉移資金』本身就需要你離開這段對話獨立查證。",
        addFlag: "不要在對方框架內驗證"
      }
    ]
  }
];

const APPROVED_SIMULATION_LINES = new Set(rounds.map((round) => round.speech));

function setBadge(online, text) {
  els.badge.textContent = text;
  els.badge.className = `badge ${online ? "badge-online" : "badge-offline"}`;
}

function setPerxonaReady(ready, text = ready ? "Perxona ready" : "Perxona setup needed") {
  perxona.ready = ready;
  setBadge(ready, text);
  els.start.disabled = !ready;
  els.start.innerHTML = ready
    ? "開始視訊演練 <span>→</span>"
    : "先連線 Perxona <span>⚙</span>";
  els.fallback.classList.toggle("hidden", ready);
}

function showRenderer(mode) {
  const connectMode = mode === "connect";
  presenter.classList.toggle("hidden", !connectMode);
  els.agentMount.classList.toggle("hidden", connectMode);
}

function loadModuleOnce(src, marker) {
  if (document.querySelector(`script[data-scamshield-module="${marker}"]`)) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = src;
    script.dataset.scamshieldModule = marker;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Perxona module failed to load: ${marker}`));
    document.head.appendChild(script);
  });
}

async function loadPresenterEngine() {
  if (presenterEngineLoaded || customElements.get("sv-presenter")) {
    presenterEngineLoaded = true;
    return;
  }
  await loadModuleOnce(CONNECT_PRESENTER_URL, "connect-presenter");
  await customElements.whenDefined("sv-presenter");
  presenterEngineLoaded = true;
}

async function loadWidgetEngine() {
  if (widgetEngineLoaded || customElements.get("sv-agent")) {
    widgetEngineLoaded = true;
    return;
  }
  await loadModuleOnce(WIDGET_URL, "widget-agent");
  await customElements.whenDefined("sv-agent");
  widgetEngineLoaded = true;
}

async function connectApi(path, key) {
  const response = await fetch(`${CONNECT_API_BASE}${path}`, {
    method: "GET",
    mode: "cors",
    cache: "no-store",
    headers: {
      "X-Connect-Key": key
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.detail || data?.details || data?.error || response.statusText;
    throw Object.assign(new Error(message), { status: response.status, data });
  }
  return data;
}

async function discoverParentWidgetConfig() {
  try {
    const html = await fetch("../index.html", { cache: "no-store" })
      .then((response) => (response.ok ? response.text() : ""));
    const apiKey = html.match(/apiKey=["']([^"']+)["']/i)?.[1] || "";
    const agentProfileId = html.match(/agentProfileId=["']([^"']+)["']/i)?.[1] || "";
    return apiKey && agentProfileId ? { apiKey, agentProfileId } : null;
  } catch {
    return null;
  }
}

function waitForWidgetReady(widget, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const startedAt = Date.now();

    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearInterval(poll);
      clearTimeout(timeout);
      widget.removeEventListener("life-status", onLifeStatus);
      error ? reject(error) : resolve();
    };

    const onLifeStatus = (event) => {
      const status = String(event.detail?.status || "").toLowerCase();
      if (status === "ready" || status === "connection-done") finish();
    };

    widget.addEventListener("life-status", onLifeStatus);
    const poll = setInterval(() => {
      if (typeof widget.agentReply === "function" && Date.now() - startedAt > 1800) {
        finish();
      }
    }, 250);
    const timeout = setTimeout(
      () => finish(new Error("Perxona widget initialization timed out")),
      timeoutMs
    );
  });
}

async function connectWidgetFallback(reason = "Connect API browser request unavailable") {
  if (!widgetFallbackConfig) {
    widgetFallbackConfig = await discoverParentWidgetConfig();
  }
  if (!widgetFallbackConfig) {
    throw new Error(`${reason}; no compatible Perxona widget profile was found.`);
  }

  els.catalogStatus.textContent = "Connect API 無法由目前瀏覽器直接存取，正在啟用 Perxona 相容模式…";
  setPerxonaReady(false, "Perxona compatibility mode…");
  await loadWidgetEngine();

  if (perxona.widget) {
    try { perxona.widget.remove(); } catch {}
  }
  els.agentMount.replaceChildren();

  const widget = document.createElement("sv-agent");
  widget.setAttribute("apiKey", widgetFallbackConfig.apiKey);
  widget.setAttribute("agentProfileId", widgetFallbackConfig.agentProfileId);
  widget.setAttribute("presentationMode", "embedded");
  widget.setAttribute("displayMode", "3DPresentation");
  widget.setAttribute("conversationMode", "inputText");
  widget.setAttribute("appearanceMode", "dark");
  widget.setAttribute("cameraAngle", "halfBody");
  widget.setAttribute("enableUserActivationCheck", "true");
  widget.setAttribute("aria-label", "Perxona synthetic avatar simulation");

  els.agentMount.appendChild(widget);
  showRenderer("widget");
  await waitForWidgetReady(widget);

  perxona = {
    ready: true,
    mode: "widget",
    key: "",
    avatarId: "",
    sceneId: "",
    voiceId: "",
    motions: [],
    widget
  };
  els.catalogStatus.textContent = `已連線 · Perxona compatibility renderer · simulation-only safety lock ON · 原始錯誤：${reason}`;
  setPerxonaReady(true);
}

async function connectPerxona(key, persist = true) {
  if (!key) throw new Error("需要 Perxona Connect Publishable Key");
  els.catalogStatus.textContent = `正在驗證 Connect key（來源：${location.origin}）…`;
  setPerxonaReady(false, "Perxona connecting…");
  await loadPresenterEngine();

  let avatars;
  let scenes;
  let voices;
  try {
    [avatars, scenes, voices] = await Promise.all([
      connectApi("/api/v1/connect/assets/avatars", key),
      connectApi("/api/v1/connect/assets/scenes", key),
      connectApi("/api/v1/connect/voices", key)
    ]);
  } catch (error) {
    const detail = error?.message || "Unknown Connect API error";
    throw new Error(`Connect catalog failed from ${location.origin}: ${detail}`);
  }

  const avatarId = avatars.items?.[0]?.avatar_id;
  const sceneId = scenes.items?.[0]?.scene_id;
  const voiceId = voices.items?.[0]?.id;
  if (!avatarId || !sceneId || !voiceId) {
    throw new Error("Connect catalog 中缺少 Avatar、Scene 或 Voice");
  }

  const motions = await connectApi(
    `/api/v1/connect/assets/avatars/${encodeURIComponent(avatarId)}/motions`,
    key
  ).catch(() => ({ items: [] }));

  showRenderer("connect");
  await presenter.initializeWithConnectKey(key, { avatarId, sceneId, voiceId });
  perxona = {
    ready: true,
    mode: "connect",
    key,
    avatarId,
    sceneId,
    voiceId,
    motions: motions.items || [],
    widget: null
  };
  if (persist) localStorage.setItem(STORAGE_KEY, key);
  els.keyInput.value = key;
  els.catalogStatus.textContent = `已連線 · Connect Kit · ${avatars.items.length} avatars · ${motions.items?.length || 0} motions · safety lock ON`;
  setPerxonaReady(true);
}

function motionFor(...keywords) {
  const list = perxona.motions || [];
  const normalize = (value) => String(value || "").toLowerCase();
  for (const keyword of keywords) {
    const lowered = keyword.toLowerCase();
    const found = list.find(
      (motion) =>
        normalize(motion.name).includes(lowered) ||
        (motion.tags || []).some((tag) => normalize(tag).includes(lowered))
    );
    if (found) return found.motion_id;
  }
  return null;
}

function widgetMotionId(keywords = []) {
  const values = keywords.map((value) => String(value).toLowerCase());
  if (values.some((value) => ["surprise", "shock", "confused", "nervous", "error"].includes(value))) {
    return "error";
  }
  if (values.some((value) => ["happy", "cheer", "celebrate", "welcome", "greeting"].includes(value))) {
    return "greeting";
  }
  if (values.some((value) => ["thinking", "sad", "listening"].includes(value))) {
    return "listening";
  }
  return "talking";
}

async function playMotion(...keywords) {
  if (!perxona.ready) return;
  if (perxona.mode === "widget") {
    const widget = perxona.widget;
    if (typeof widget?.agentReply !== "function") return;
    try {
      widget.agentReply({ event: "agent_answer", message: " ", motion_id: widgetMotionId(keywords) });
      setTimeout(() => widget.agentReply?.({ event: "agent_end", message: "" }), 750);
    } catch (error) {
      console.warn("Perxona widget motion failed", error);
    }
    return;
  }

  const id = motionFor(...keywords);
  if (!id) return;
  try {
    await presenter.playMotion?.(id);
  } catch (error) {
    console.warn("Perxona Connect motion failed", error);
  }
}

function estimatedSpeechDuration(text) {
  return Math.max(5500, Math.min(15500, 1800 + String(text).length * 105));
}

function finishSpeaking() {
  if (!game.presenting) return;
  game.presenting = false;
  clearTimeout(speechTimer);
  speechTimer = null;
  els.interrupt.disabled = true;
  els.interrupt.classList.remove("hot");
  renderChoices();
}

async function speak(text, mood = "talk") {
  if (!APPROVED_SIMULATION_LINES.has(text)) {
    console.warn("Safety boundary blocked an unapproved avatar line.");
    els.dialogue.textContent = "Safety boundary：此內容不在防詐訓練白名單中。";
    return;
  }
  if (!perxona.ready) {
    setPerxonaReady(false);
    els.settings?.click();
    return;
  }

  clearTimeout(speechTimer);
  els.dialogue.textContent = text;
  game.presenting = true;
  game.interrupted = false;
  els.interrupt.disabled = false;
  els.interrupt.classList.add("hot");
  els.interruptFeedback.textContent = "現在可以打斷。聽到紅旗就按！";

  if (perxona.mode === "widget") {
    const widget = perxona.widget;
    const motionId = mood === "pressure" ? "talking" : mood === "identity" ? "greeting" : "talking";
    try {
      if (typeof widget?.agentReply !== "function") {
        throw new Error("agentReply is unavailable");
      }
      widget.agentReply({ event: "agent_answer", message: text, motion_id: motionId });
      speechTimer = setTimeout(finishSpeaking, estimatedSpeechDuration(text));
      return;
    } catch (error) {
      console.warn("Perxona widget speech failed", error);
      finishSpeaking();
      return;
    }
  }

  try {
    await presenter.resumeAudioPlayback?.();
    const motion = mood === "pressure"
      ? motionFor("angry", "serious", "point", "explain")
      : mood === "identity"
        ? motionFor("talk", "welcome", "gesture", "explain")
        : motionFor("talk", "gesture", "explain", "welcome");
    const payload = motion ? `[MOTION ${motion}] ${text}` : text;
    const result = await presenter.present(payload);
    if (result && result.success === false) {
      console.warn("Perxona present failed", result);
    }
  } catch (error) {
    console.warn("Perxona Connect speech failed", error);
  }
  finishSpeaking();
}

function addFlag(flag) {
  if (!flag || game.flags.includes(flag)) return;
  game.flags.push(flag);
  renderFlags();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'\"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  }[character]));
}

function renderFlags() {
  els.redFlags.innerHTML = game.flags.length
    ? game.flags.map((flag) => `<span class="flag">⚑ ${escapeHtml(flag)}</span>`).join("")
    : `<div class="empty-state">你抓到的紅旗會出現在這裡。</div>`;
}

function updateHud() {
  els.score.textContent = `${Math.max(0, game.score)} pts`;
  els.shieldValue.textContent = game.shield;
  els.shieldBar.style.width = `${Math.max(0, game.shield)}%`;
}

function renderRound() {
  const round = rounds[game.round];
  els.roundLabel.textContent = `ROUND ${game.round + 1} / ${rounds.length}`;
  els.roundTitle.textContent = round.title;
  els.speaker.textContent = round.speaker;
  els.choiceArea.innerHTML = "";
  els.lesson.classList.add("hidden");
  const mood = game.round === 1 ? "identity" : game.round === 0 ? "talk" : "pressure";
  speak(round.speech, mood);
}

function renderChoices() {
  const round = rounds[game.round];
  if (!round) return;
  els.choiceArea.innerHTML = round.choices.map(
    (choice, index) =>
      `<button class="choice" type="button" data-choice="${index}"><b>${String.fromCharCode(65 + index)}</b>${escapeHtml(choice.text)}</button>`
  ).join("");
  els.choiceArea.querySelectorAll(".choice").forEach((button) => {
    button.addEventListener("click", () => choose(Number(button.dataset.choice)));
  });
}

async function choose(index) {
  const round = rounds[game.round];
  const choice = round.choices[index];
  els.choiceArea.innerHTML = "";
  game.score += choice.delta;
  game.shield = Math.max(0, Math.min(100, game.shield + choice.shield));
  if (choice.addFlag) addFlag(choice.addFlag);
  if (choice.ok) addFlag(round.flag);
  updateHud();

  els.lesson.className = `lesson ${choice.ok ? "" : "bad"}`;
  els.lesson.textContent = choice.lesson;
  els.lesson.classList.remove("hidden");
  await playMotion(
    ...(choice.ok
      ? ["surprise", "confused", "nervous"]
      : ["happy", "agree", "talk"])
  );

  setTimeout(() => {
    game.round += 1;
    if (game.round >= rounds.length) finishGame();
    else renderRound();
  }, 1800);
}

async function interrupt() {
  if (!game.presenting || game.interrupted) return;
  game.interrupted = true;
  game.presenting = false;
  clearTimeout(speechTimer);
  speechTimer = null;

  try {
    if (perxona.mode === "widget") {
      perxona.widget?.agentReply?.({ event: "agent_end", message: "" });
    } else {
      presenter.interruptPresentation?.();
    }
  } catch (error) {
    console.warn("Perxona interrupt failed", error);
  }

  game.score += 5;
  addFlag(rounds[game.round].flag);
  updateHud();
  els.interrupt.disabled = true;
  els.interrupt.classList.remove("hot");
  els.interruptFeedback.textContent = "+5 主動識破：你沒有讓對方掌控談話節奏。";
  await playMotion("surprise", "shock", "confused", "nervous");
  setTimeout(renderChoices, 450);
}

function startGame() {
  if (!perxona.ready) {
    els.dialog.showModal();
    return;
  }
  game = {
    round: 0,
    score: 0,
    shield: 100,
    flags: [],
    interrupted: false,
    presenting: false
  };
  els.briefing.classList.add("hidden");
  els.result.classList.add("hidden");
  els.game.classList.remove("hidden");
  renderFlags();
  updateHud();
  renderRound();
}

function finishGame() {
  clearTimeout(speechTimer);
  speechTimer = null;
  const raw = Math.max(
    0,
    Math.min(100, Math.round(52 + game.score * 0.42 + (game.shield - 50) * 0.32))
  );
  els.finalScore.textContent = raw;
  els.resultTitle.textContent = raw >= 85
    ? "你守住了信任邊界。"
    : raw >= 65
      ? "你有警覺，但仍容易被『像真的人』影響。"
      : "你需要練的是：先停，再驗證。";
  els.resultCopy.textContent = raw >= 85
    ? "你能辨認權威、急迫、身分冒充、OTP 與安全帳戶等高風險訊號，而且知道真正可靠的驗證要離開對方控制的情境。"
    : "詐騙最危險的地方，是它可以盜用你原本的信任。下一次，不要問『他像不像真的』，而要問『我能不能用自己控制的管道驗證』。";
  els.resultFlags.innerHTML = game.flags
    .map((flag) => `<span class="flag">✓ ${escapeHtml(flag)}</span>`)
    .join("");
  els.game.classList.add("hidden");
  els.result.classList.remove("hidden");
  if (raw >= 85) playMotion("happy", "cheer", "celebrate");
  else playMotion("thinking", "sad", "confused");
}

els.interrupt.addEventListener("click", interrupt);
els.start.addEventListener("click", startGame);
els.replay.addEventListener("click", startGame);
els.showWhy.addEventListener("click", () => els.whyBox.classList.toggle("hidden"));
els.settings.addEventListener("click", () => els.dialog.showModal());

els.connectBtn.addEventListener("click", async () => {
  els.connectBtn.disabled = true;
  const key = els.keyInput.value.trim();
  try {
    await connectPerxona(key);
    els.dialog.close();
  } catch (connectError) {
    console.warn("Connect Kit initialization failed; attempting compatibility mode", connectError);
    try {
      await connectWidgetFallback(connectError.message);
      els.dialog.close();
    } catch (fallbackError) {
      els.catalogStatus.textContent = `連線失敗：${connectError.message}；相容模式也失敗：${fallbackError.message}`;
      setPerxonaReady(false);
    }
  } finally {
    els.connectBtn.disabled = false;
  }
});

els.clearKeyBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  els.keyInput.value = "";
  clearTimeout(speechTimer);
  if (perxona.widget) {
    try { perxona.widget.remove(); } catch {}
  }
  perxona = {
    ready: false,
    mode: null,
    key: "",
    avatarId: "",
    sceneId: "",
    voiceId: "",
    motions: [],
    widget: null
  };
  showRenderer("connect");
  setPerxonaReady(false);
  els.catalogStatus.textContent = "已清除本機 Connect key；重新整理後仍可嘗試 Perxona 相容模式。";
});

presenter.addEventListener?.("PRESENTER_STATUS", (event) => {
  if (event.detail?.status === "Ready" && perxona.mode === "connect" && perxona.key) {
    setPerxonaReady(true);
  }
});

(async function boot() {
  setPerxonaReady(false, "Perxona connecting…");
  widgetFallbackConfig = await discoverParentWidgetConfig();
  const key = localStorage.getItem(STORAGE_KEY) || "";
  if (key) {
    els.keyInput.value = key;
    try {
      await connectPerxona(key, false);
      return;
    } catch (connectError) {
      console.warn("Stored Connect key could not initialize", connectError);
      try {
        await connectWidgetFallback(connectError.message);
        return;
      } catch (fallbackError) {
        console.warn("Compatibility mode failed", fallbackError);
      }
    }
  } else if (widgetFallbackConfig) {
    try {
      await connectWidgetFallback("No stored Connect key yet");
      return;
    } catch (fallbackError) {
      console.warn("Compatibility mode failed", fallbackError);
    }
  }

  setPerxonaReady(false);
  els.catalogStatus.textContent = `請貼上 Perxona Connect Publishable Key。網站來源是 ${location.origin}。`;
})();
