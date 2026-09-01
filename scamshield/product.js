const CONFIG = window.SCAMSHIELD_CONFIG;
const CONTENT = window.SCAMSHIELD_CAMPAIGN_DATA;

if (!CONFIG?.publishableConnectKey || !CONTENT?.stages?.length) {
  throw new Error("ScamShield configuration or campaign data is missing.");
}

const STORAGE = {
  mode: "scamshield.product.mode",
  avatar: "scamshield.product.avatar",
  scene: "scamshield.product.scene",
  voice: "scamshield.product.voice",
  best: "scamshield.product.best"
};

const $ = (selector) => document.querySelector(selector);
const UI = {
  badge: $("#connectionBadge"), customize: $("#customizeBtn"), startupDetail: $("#startupDetail"),
  landing: $("#landingPanel"), training: $("#trainingPanel"), start: $("#startBtn"),
  stagePath: $("#stagePath"), roundCount: $("#roundCount"), combo: $("#comboValue"), interrupts: $("#interruptCount"),
  roundEyebrow: $("#roundEyebrow"), roundTitle: $("#roundTitle"), shieldBar: $("#shieldBar"), shieldValue: $("#shieldValue"),
  avatarStage: $("#avatarStage"), avatarLoading: $("#avatarLoading"), loadingTitle: $("#loadingTitle"), loadingDetail: $("#loadingDetail"),
  prop: $("#propCard"), interrupt: $("#interruptBtn"),
  score: $("#scoreValue"), speaker: $("#speakerLabel"), speech: $("#speechText"), choices: $("#choiceArea"), feedback: $("#feedbackBox"), flags: $("#flagList"), exit: $("#exitBtn"),
  checkpointDialog: $("#checkpointDialog"), checkpointEyebrow: $("#checkpointEyebrow"), checkpointTitle: $("#checkpointTitle"), checkpointStars: $("#checkpointStars"), checkpointCopy: $("#checkpointCopy"), checkpointStats: $("#checkpointStats"), checkpointBtn: $("#checkpointBtn"),
  resultDialog: $("#resultDialog"), finalScore: $("#finalScore"), resultTitle: $("#resultTitle"), resultCopy: $("#resultCopy"), resultStats: $("#resultStats"), replay: $("#replayBtn"), home: $("#homeBtn"),
  settingsDialog: $("#settingsDialog"), avatarSelect: $("#avatarSelect"), sceneSelect: $("#sceneSelect"), voiceSelect: $("#voiceSelect"), voiceMeta: $("#voiceMeta"), applyCasting: $("#applyCastingBtn"),
  fatal: $("#fatalError"), fatalText: $("#fatalErrorText"), retry: $("#retryBtn")
};

let presenter = $("#presenter");
const state = {
  ready: false,
  initializing: false,
  mode: localStorage.getItem(STORAGE.mode) || "campaign",
  catalogs: { avatars: [], scenes: [], voices: [], motions: [] },
  voiceDetails: new Map(),
  asset: { avatarId: "", sceneId: "", voiceId: "" },
  active: false,
  stageIndex: 0,
  roundIndex: 0,
  score: 0,
  shield: 100,
  safe: 0,
  risky: 0,
  combo: 0,
  maxCombo: 0,
  interruptCount: 0,
  flags: [],
  interrupted: false,
  presenting: false,
  choicesRendered: false,
  speechToken: 0,
  stageSafe: 0,
  stageRisky: 0,
  stageInterrupts: 0,
  recoveries: 0,
  pendingCheckpoint: false
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function setConnection(kind, text) {
  UI.badge.className = `connection is-${kind}`;
  UI.badge.querySelector("span").textContent = text;
}

function setStartup(text, detail = text) {
  UI.startupDetail.textContent = detail;
  UI.loadingDetail.textContent = detail;
}

function showFatal(error) {
  state.ready = false;
  state.initializing = false;
  setConnection("error", "Perxona 無法連線");
  UI.start.disabled = true;
  UI.customize.disabled = true;
  UI.fatalText.textContent = error instanceof Error ? error.message : String(error);
  UI.fatal.hidden = false;
}

function hideFatal() {
  UI.fatal.hidden = true;
}

function loadPresenterEngine() {
  if (customElements.get("sv-presenter")) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-perxona-presenter="1"]');
    if (existing) {
      customElements.whenDefined("sv-presenter").then(resolve, reject);
      return;
    }
    const script = document.createElement("script");
    script.type = "module";
    script.src = CONFIG.presenterUrl;
    script.dataset.perxonaPresenter = "1";
    script.onload = () => customElements.whenDefined("sv-presenter").then(resolve, reject);
    script.onerror = () => reject(new Error("Perxona Presenter SDK 下載失敗。"));
    document.head.appendChild(script);
  });
}

async function connectApi(path, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("request timeout")), timeoutMs);
  try {
    const response = await fetch(`${CONFIG.apiBase}${path}`, {
      headers: { "X-Connect-Key": CONFIG.publishableConnectKey },
      mode: "cors",
      cache: "no-store",
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.detail || data?.details || data?.error || response.statusText || `HTTP ${response.status}`;
      throw new Error(`Perxona Connect API：${message}`);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function itemId(kind, item) {
  if (kind === "avatar") return item?.avatar_id ?? item?.id ?? "";
  if (kind === "scene") return item?.scene_id ?? item?.id ?? "";
  if (kind === "voice") return item?.id ?? item?.voice_id ?? "";
  return item?.motion_id ?? item?.id ?? "";
}

function itemName(item) {
  return item?.display_name ?? item?.name ?? item?.title ?? item?.id ?? "Unnamed";
}

function searchable(item) {
  try { return JSON.stringify(item).toLowerCase(); } catch { return String(item).toLowerCase(); }
}

function rankAvatar(item) {
  const id = itemId("avatar", item);
  const text = searchable(item);
  let score = CONFIG.preferredAvatarIds.includes(id) ? 1000 : 0;
  for (const term of ["professional", "business", "finance", "office", "executive", "formal", "adult", "male", "suit", "security"]) if (text.includes(term)) score += 18;
  for (const term of ["cute", "chibi", "child", "kid", "cartoon", "anime", "mascot", "trip", "fashion"]) if (text.includes(term)) score -= 25;
  return score;
}

function rankScene(item) {
  const text = searchable(item);
  let score = 0;
  for (const term of ["office", "meeting", "boardroom", "studio", "business", "bank", "room", "interior"]) if (text.includes(term)) score += 18;
  for (const term of ["outdoor", "mountain", "travel", "beach", "forest", "fantasy"]) if (text.includes(term)) score -= 18;
  return score;
}

function numericPitch(detail) {
  const candidates = [detail?.audio_config?.pitch, detail?.audioConfig?.pitch, detail?.config?.pitch, detail?.pitch];
  return candidates.map(Number).find(Number.isFinite) ?? 0;
}

function numericRate(detail) {
  const candidates = [detail?.audio_config?.speakingRate, detail?.audio_config?.speaking_rate, detail?.audioConfig?.speakingRate, detail?.speakingRate];
  return candidates.map(Number).find(Number.isFinite) ?? 1;
}

function rankVoice(item) {
  const id = itemId("voice", item);
  const detail = state.voiceDetails.get(id) || {};
  const text = `${searchable(item)} ${searchable(detail)}`;
  let score = 0;
  for (const term of ["zh-tw", "zh_tw", "taiwan", "mandarin", "chinese", "中文", "國語"]) if (text.includes(term)) score += 25;
  for (const term of ["male", "man", "masculine", "deep", "baritone", "bass", "mature", "serious", "formal", "professional"]) if (text.includes(term)) score += 13;
  for (const term of ["female", "child", "kid", "cute", "young", "gentle", "bright", "high", "cheerful"]) if (text.includes(term)) score -= 12;
  const pitch = numericPitch(detail);
  if (pitch < 0) score += Math.min(24, Math.abs(pitch) * 4);
  if (pitch > 0) score -= Math.min(24, pitch * 4);
  const rate = numericRate(detail);
  if (rate >= 1.02 && rate <= 1.3) score += 5;
  return score;
}

async function hydrateVoiceDetails(voices) {
  const candidates = [...voices]
    .sort((a, b) => {
      const at = searchable(a), bt = searchable(b);
      const base = (text) => (/zh|mandarin|chinese|taiwan/.test(text) ? 30 : 0) + (/male|man|deep|mature|serious/.test(text) ? 12 : 0);
      return base(bt) - base(at);
    })
    .slice(0, 10);
  await Promise.all(candidates.map(async (voice) => {
    const id = itemId("voice", voice);
    if (!id) return;
    try {
      state.voiceDetails.set(id, await connectApi(`/api/v1/connect/voices/${encodeURIComponent(id)}`, 10000));
    } catch (error) {
      console.warn("Voice detail unavailable", id, error);
    }
  }));
}

function sortedCatalogs() {
  return {
    avatars: [...state.catalogs.avatars].sort((a, b) => rankAvatar(b) - rankAvatar(a)),
    scenes: [...state.catalogs.scenes].sort((a, b) => rankScene(b) - rankScene(a)),
    voices: [...state.catalogs.voices].sort((a, b) => rankVoice(b) - rankVoice(a))
  };
}

function validStored(kind, items) {
  const key = kind === "avatar" ? STORAGE.avatar : kind === "scene" ? STORAGE.scene : STORAGE.voice;
  const id = localStorage.getItem(key) || "";
  return items.some((item) => itemId(kind, item) === id) ? id : "";
}

function populateSelect(select, kind, items, selectedId) {
  select.innerHTML = items.map((item) => {
    const id = itemId(kind, item);
    return `<option value="${escapeHtml(id)}" ${id === selectedId ? "selected" : ""}>${escapeHtml(itemName(item))}</option>`;
  }).join("");
}

function updateVoiceMeta() {
  const detail = state.voiceDetails.get(UI.voiceSelect.value) || {};
  const pitch = numericPitch(detail);
  const rate = numericRate(detail);
  UI.voiceMeta.textContent = `Voice profile · pitch ${pitch} · native speaking rate ${rate}`;
}

async function fetchCatalogs() {
  setStartup("正在讀取 Perxona catalog…", "讀取 Avatar、Scene 與 Voice catalog。");
  const [avatars, scenes, voices] = await Promise.all([
    connectApi("/api/v1/connect/assets/avatars?page=1&size=100"),
    connectApi("/api/v1/connect/assets/scenes?page=1&size=100"),
    connectApi("/api/v1/connect/voices?page=1&size=100")
  ]);
  state.catalogs.avatars = avatars.items || [];
  state.catalogs.scenes = scenes.items || [];
  state.catalogs.voices = voices.items || [];
  if (!state.catalogs.avatars.length || !state.catalogs.scenes.length || !state.catalogs.voices.length) {
    throw new Error("Perxona catalog 缺少 Avatar、Scene 或 Voice。請在 Perxona Console 檢查組織資產。");
  }
  await hydrateVoiceDetails(state.catalogs.voices);
}

function chooseAssets(overrides = {}) {
  const sorted = sortedCatalogs();
  const avatarId = overrides.avatarId || validStored("avatar", sorted.avatars) || itemId("avatar", sorted.avatars[0]);
  const sceneId = overrides.sceneId || validStored("scene", sorted.scenes) || itemId("scene", sorted.scenes[0]);
  const voiceId = overrides.voiceId || validStored("voice", sorted.voices) || itemId("voice", sorted.voices[0]);
  state.asset = { avatarId, sceneId, voiceId };
  populateSelect(UI.avatarSelect, "avatar", sorted.avatars, avatarId);
  populateSelect(UI.sceneSelect, "scene", sorted.scenes, sceneId);
  populateSelect(UI.voiceSelect, "voice", sorted.voices, voiceId);
  updateVoiceMeta();
  return sorted;
}

function recreatePresenter() {
  const replacement = document.createElement("sv-presenter");
  replacement.id = "presenter";
  presenter.replaceWith(replacement);
  presenter = replacement;
}

function waitForPresenterReady(timeoutMs = 45000) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      presenter.removeEventListener("PRESENTER_STATUS", onStatus);
      error ? reject(error) : resolve();
    };
    const onStatus = (event) => {
      const status = String(event.detail?.status || "");
      console.info("Perxona PRESENTER_STATUS", status, event.detail);
      if (status) {
        UI.loadingTitle.textContent = `Perxona：${status}`;
        setStartup(status, `Perxona Presenter 狀態：${status}`);
      }
      if (status === "Ready") finish();
    };
    presenter.addEventListener("PRESENTER_STATUS", onStatus);
    const timeout = setTimeout(() => finish(new Error("Perxona Avatar 初始化逾時，未收到 PRESENTER_STATUS: Ready。")), timeoutMs);
  });
}

async function fetchMotions(avatarId) {
  const response = await connectApi(`/api/v1/connect/assets/avatars/${encodeURIComponent(avatarId)}/motions?page=1&size=100`, 12000).catch(() => ({ items: [] }));
  state.catalogs.motions = response.items || [];
}

async function initializePresenter(target) {
  setStartup("正在初始化 3D Avatar…", "等待 Perxona Presenter 完成角色、場景與語音解析。");
  UI.avatarLoading.classList.remove("is-hidden");
  UI.avatarStage.setAttribute("aria-busy", "true");
  const readyPromise = waitForPresenterReady();
  const initializePromise = presenter.initializeWithConnectKey(CONFIG.publishableConnectKey, target);
  await Promise.all([initializePromise, readyPromise]);
  state.ready = true;
  UI.avatarStage.setAttribute("aria-busy", "false");
  UI.avatarLoading.classList.add("is-hidden");
  UI.start.disabled = false;
  UI.start.querySelector(".button-label").textContent = state.mode === "quick" ? "開始快速演練" : "開始完整闖關";
  UI.start.querySelector("i").textContent = "→";
  UI.customize.disabled = false;
  setConnection("ready", "Perxona Avatar ready");
  setStartup("Perxona Avatar 已可操作", "Avatar、語音、動作與中斷控制均已連線。");
  const greeting = findMotion("greeting", "welcome", "idle");
  if (greeting) presenter.playMotion?.(greeting).catch(() => {});
}

async function initializeProduct(overrides = {}, allowRetry = true) {
  if (state.initializing) return;
  state.initializing = true;
  state.ready = false;
  hideFatal();
  setConnection("loading", "正在連線 Perxona");
  UI.start.disabled = true;
  UI.customize.disabled = true;
  try {
    await loadPresenterEngine();
    if (!state.catalogs.avatars.length) await fetchCatalogs();
    chooseAssets(overrides);
    await fetchMotions(state.asset.avatarId);
    await initializePresenter(state.asset);
  } catch (error) {
    console.error("ScamShield initialization failed", error);
    if (allowRetry && state.catalogs.avatars.length > 1) {
      try {
        recreatePresenter();
        const sorted = sortedCatalogs();
        const fallback = {
          avatarId: itemId("avatar", sorted.avatars.find((item) => itemId("avatar", item) !== state.asset.avatarId) || sorted.avatars[0]),
          sceneId: itemId("scene", sorted.scenes.find((item) => itemId("scene", item) !== state.asset.sceneId) || sorted.scenes[0]),
          voiceId: itemId("voice", sorted.voices.find((item) => itemId("voice", item) !== state.asset.voiceId) || sorted.voices[0])
        };
        state.asset = fallback;
        await fetchMotions(fallback.avatarId);
        await initializePresenter(fallback);
      } catch (retryError) {
        showFatal(retryError);
      }
    } else {
      showFatal(error);
    }
  } finally {
    state.initializing = false;
  }
}

function activeStages() {
  return state.mode === "quick" ? [CONTENT.stages[0]] : CONTENT.stages;
}

function currentStage() {
  return activeStages()[state.stageIndex];
}

function currentRound() {
  return currentStage()?.rounds?.[state.roundIndex];
}

function totalRounds() {
  return activeStages().reduce((sum, stage) => sum + stage.rounds.length, 0);
}

function globalRoundNumber() {
  return activeStages().slice(0, state.stageIndex).reduce((sum, stage) => sum + stage.rounds.length, 0) + state.roundIndex + 1;
}

function renderStagePath() {
  UI.stagePath.innerHTML = activeStages().map((stage, index) => {
    const className = index < state.stageIndex ? "is-complete" : index === state.stageIndex ? "is-active" : "";
    return `<div class="${className}"><i>${index < state.stageIndex ? "✓" : stage.number}</i><span>${escapeHtml(stage.name)}</span></div>`;
  }).join("");
}

function updateHud() {
  UI.roundCount.textContent = `${globalRoundNumber()}/${totalRounds()}`;
  UI.combo.textContent = `×${state.combo}`;
  UI.interrupts.textContent = String(state.interruptCount);
  UI.score.textContent = String(Math.max(0, state.score));
  UI.shieldValue.textContent = String(state.shield);
  UI.shieldBar.style.width = `${state.shield}%`;
  UI.flags.innerHTML = state.flags.length
    ? state.flags.slice(-9).map((flag) => `<b>⚑ ${escapeHtml(flag)}</b>`).join("")
    : "<small>尚未辨認紅旗。</small>";
  renderStagePath();
}

function renderProp(prop) {
  if (!prop) {
    UI.prop.hidden = true;
    return;
  }
  UI.prop.hidden = false;
  UI.prop.innerHTML = `<div class="prop-top"><span>${escapeHtml(prop.eyebrow || "EVIDENCE")}</span><b>${escapeHtml(prop.code || "")}</b></div><div class="prop-icon">${escapeHtml(prop.icon || "!")}</div><strong>${escapeHtml(prop.title || "Verification request")}</strong><small>${escapeHtml(prop.detail || "UNVERIFIED")}</small>`;
}

function findMotion(...terms) {
  for (const term of terms) {
    const lowered = term.toLowerCase();
    const match = state.catalogs.motions.find((motion) => searchable(motion).includes(lowered));
    if (match) return itemId("motion", match);
  }
  return itemId("motion", state.catalogs.motions[0]);
}

function motionForRound(round) {
  const type = round?.prop?.type || "";
  if (/phone|mfa/.test(type)) return findMotion("phone", "talk", "explain", "point");
  if (/invoice|approval|payroll|clipboard|document/.test(type)) return findMotion("document", "present", "show", "point", "explain");
  if (/otp|terminal|tablet/.test(type)) return findMotion("tablet", "show", "point", "explain");
  return findMotion("talk", "explain", "gesture");
}

function stopPresentationVisuals() {
  state.presenting = false;
  UI.avatarStage.classList.remove("is-speaking");
  UI.interrupt.disabled = true;
}

async function playRoundSpeech(round) {
  const token = ++state.speechToken;
  state.presenting = true;
  state.interrupted = false;
  state.choicesRendered = false;
  UI.interrupt.disabled = false;
  UI.avatarStage.classList.add("is-speaking");
  UI.choices.innerHTML = '<div class="startup-detail">Avatar 正在施壓。你可以直接 BREAK THE SPELL。</div>';
  try {
    await presenter.resumeAudioPlayback?.();
    const motionId = motionForRound(round);
    const payload = motionId ? `[MOTION ${motionId}] ${round.speech}` : round.speech;
    const result = await presenter.present(payload);
    if (token !== state.speechToken || state.interrupted) return;
    if (result && result.success === false) {
      throw new Error(`${result.code || "PRESENT_FAILED"}：${result.message || "Perxona present() returned success=false"}`);
    }
    stopPresentationVisuals();
    renderChoices(round);
  } catch (error) {
    if (token !== state.speechToken || state.interrupted) return;
    stopPresentationVisuals();
    UI.feedback.hidden = false;
    UI.feedback.className = "feedback-box is-risk";
    UI.feedback.textContent = `Avatar 語音暫時失敗：${error.message}。你仍可完成決策；重新連線可恢復語音。`;
    renderChoices(round);
  }
}

function renderRound() {
  const stage = currentStage();
  const round = currentRound();
  if (!stage || !round) return;
  state.choicesRendered = false;
  UI.roundEyebrow.textContent = `STAGE ${stage.number} · ROUND ${state.roundIndex + 1}/${stage.rounds.length}`;
  UI.roundTitle.textContent = round.title;
  UI.speaker.textContent = round.speaker;
  UI.speech.textContent = round.speech;
  UI.feedback.hidden = true;
  UI.feedback.className = "feedback-box";
  UI.choices.innerHTML = "";
  renderProp(round.prop);
  updateHud();
  playRoundSpeech(round);
}

function renderChoices(round) {
  if (state.choicesRendered) return;
  state.choicesRendered = true;
  UI.choices.innerHTML = round.choices.map((choice, index) => `<button class="choice-button" type="button" data-choice="${index}"><b>${String.fromCharCode(65 + index)}</b><span>${escapeHtml(choice.text)}</span></button>`).join("");
  UI.choices.querySelectorAll("[data-choice]").forEach((button) => {
    button.addEventListener("click", () => choose(Number(button.dataset.choice)), { once: true });
  });
}

function addFlag(flag) {
  if (flag && !state.flags.includes(flag)) state.flags.push(flag);
}

async function interruptSpeech() {
  if (!state.presenting || state.interrupted) return;
  state.interrupted = true;
  state.speechToken += 1;
  state.interruptCount += 1;
  state.stageInterrupts += 1;
  state.score += 5;
  addFlag(currentRound()?.flag || "主動中斷操控");
  try { presenter.interruptPresentation?.(); } catch (error) { console.warn(error); }
  stopPresentationVisuals();
  UI.feedback.hidden = false;
  UI.feedback.className = "feedback-box";
  UI.feedback.textContent = "✓ 你主動中斷了對方控制的節奏。接著要用可信管道驗證，而不是留在同一段對話裡。";
  updateHud();
  setTimeout(() => renderChoices(currentRound()), 250);
  const reaction = findMotion("surprise", "confused", "error", "shock");
  if (reaction) presenter.playMotion?.(reaction).catch(() => {});
}

function applyDecision(choice, recovery = false) {
  state.score += Number(choice.points || 0);
  state.shield = Math.max(0, Math.min(100, state.shield + Number(choice.shield || 0)));
  if (choice.addFlag) addFlag(choice.addFlag);
  if (!recovery) {
    if (choice.ok) {
      state.safe += 1;
      state.stageSafe += 1;
      state.combo += 1;
      state.maxCombo = Math.max(state.maxCombo, state.combo);
      if (state.combo >= 2) state.score += 3;
      addFlag(currentRound()?.flag);
    } else {
      state.risky += 1;
      state.stageRisky += 1;
      state.combo = 0;
    }
  } else if (choice.ok) {
    state.recoveries += 1;
  }
  updateHud();
}

function renderNextButton(label, action) {
  UI.choices.innerHTML = `<button id="nextAction" class="primary-button" type="button"><span class="button-label">${escapeHtml(label)}</span><i>→</i></button>`;
  $("#nextAction").addEventListener("click", action, { once: true });
}

async function choose(index) {
  const round = currentRound();
  const choice = round?.choices?.[index];
  if (!choice) return;
  UI.choices.querySelectorAll("button").forEach((button) => { button.disabled = true; });
  applyDecision(choice, false);
  UI.feedback.hidden = false;
  UI.feedback.className = `feedback-box ${choice.ok ? "" : "is-risk"}`;
  UI.feedback.textContent = `${choice.ok ? "✓" : "⚠"} ${choice.lesson}`;
  const reaction = choice.ok ? findMotion("surprise", "confused", "error") : findMotion("happy", "talk", "greeting");
  if (reaction) presenter.playMotion?.(reaction).catch(() => {});
  const recovery = !choice.ok && choice.recovery ? CONTENT.recovery?.[choice.recovery] : null;
  if (recovery?.choices?.length) renderNextButton("進入事故止損", () => renderRecovery(recovery));
  else renderNextButton("下一關", advance);
}

function renderRecovery(recovery) {
  UI.roundEyebrow.textContent = "RECOVERY CHECK";
  UI.roundTitle.textContent = recovery.title || "事故止損";
  UI.speaker.textContent = "SYSTEM · INCIDENT CONTAINMENT";
  UI.speech.textContent = recovery.prompt || recovery.description || "你已經做出高風險操作，現在要怎麼止損？";
  UI.feedback.hidden = true;
  UI.choices.innerHTML = recovery.choices.map((choice, index) => `<button class="choice-button" type="button" data-recovery="${index}"><b>${String.fromCharCode(65 + index)}</b><span>${escapeHtml(choice.text)}</span></button>`).join("");
  UI.choices.querySelectorAll("[data-recovery]").forEach((button) => {
    button.addEventListener("click", () => {
      const choice = recovery.choices[Number(button.dataset.recovery)];
      UI.choices.querySelectorAll("button").forEach((node) => { node.disabled = true; });
      applyDecision(choice, true);
      UI.feedback.hidden = false;
      UI.feedback.className = `feedback-box ${choice.ok ? "" : "is-risk"}`;
      UI.feedback.textContent = `${choice.ok ? "✓ RECOVERED" : "⚠ DAMAGE CONTINUES"} · ${choice.lesson}`;
      renderNextButton("下一關", advance);
    }, { once: true });
  });
}

function checkpoint() {
  state.pendingCheckpoint = true;
  const stage = currentStage();
  const stars = state.stageSafe >= Math.max(3, stage.rounds.length - 1) ? 3 : state.stageSafe >= 2 ? 2 : 1;
  const heal = Math.min(12, 100 - state.shield);
  state.shield += heal;
  UI.checkpointEyebrow.textContent = `STAGE ${stage.number} CHECKPOINT`;
  UI.checkpointTitle.textContent = `${stage.name}完成`;
  UI.checkpointStars.textContent = "★".repeat(stars) + "☆".repeat(3 - stars);
  UI.checkpointCopy.textContent = `本階段安全決策 ${state.stageSafe} 次、風險決策 ${state.stageRisky} 次、主動中斷 ${state.stageInterrupts} 次。Trust Shield 修復 +${heal}。`;
  UI.checkpointStats.innerHTML = `<div><span>SAFE</span><b>${state.stageSafe}</b></div><div><span>RISKY</span><b>${state.stageRisky}</b></div><div><span>INTERRUPTS</span><b>${state.stageInterrupts}</b></div>`;
  const finalStage = state.stageIndex >= activeStages().length - 1;
  UI.checkpointBtn.querySelector(".button-label").textContent = finalStage ? "查看總結" : "進入下一階段";
  UI.checkpointDialog.showModal();
}

function advance() {
  state.roundIndex += 1;
  if (state.roundIndex >= currentStage().rounds.length) {
    checkpoint();
    return;
  }
  renderRound();
}

function continueFromCheckpoint() {
  UI.checkpointDialog.close();
  const finalStage = state.stageIndex >= activeStages().length - 1;
  if (finalStage) {
    finishCampaign();
    return;
  }
  state.stageIndex += 1;
  state.roundIndex = 0;
  state.stageSafe = 0;
  state.stageRisky = 0;
  state.stageInterrupts = 0;
  state.pendingCheckpoint = false;
  renderRound();
}

function computeFinalScore() {
  const total = totalRounds();
  const decision = total ? (state.safe / total) * 66 : 0;
  const shield = (state.shield / 100) * 22;
  const interrupts = Math.min(1, state.interruptCount / Math.max(4, total / 2)) * 8;
  const recovery = state.risky ? Math.min(4, (state.recoveries / state.risky) * 4) : 4;
  return Math.max(0, Math.min(100, Math.round(decision + shield + interrupts + recovery)));
}

function finishCampaign() {
  const score = computeFinalScore();
  localStorage.setItem(STORAGE.best, String(Math.max(score, Number(localStorage.getItem(STORAGE.best)) || 0)));
  UI.finalScore.textContent = String(score);
  UI.resultTitle.textContent = score >= 88 ? "你守住了整條信任鏈。" : score >= 68 ? "你會防守，但仍有可被施壓的缺口。" : "下一輪要更早停下來驗證。";
  UI.resultCopy.textContent = `${totalRounds()} 回合完成：安全決策 ${state.safe}、風險決策 ${state.risky}、主動中斷 ${state.interruptCount}、最高連擊 ×${state.maxCombo}、剩餘 Trust Shield ${state.shield}。`;
  UI.resultStats.innerHTML = `<div><span>SAFE RATE</span><b>${Math.round((state.safe / totalRounds()) * 100)}%</b></div><div><span>RECOVERIES</span><b>${state.recoveries}</b></div><div><span>BEST</span><b>${localStorage.getItem(STORAGE.best)}</b></div>`;
  UI.resultDialog.showModal();
}

function resetGame() {
  Object.assign(state, {
    active: true, stageIndex: 0, roundIndex: 0, score: 0, shield: 100, safe: 0, risky: 0,
    combo: 0, maxCombo: 0, interruptCount: 0, flags: [], interrupted: false, presenting: false,
    choicesRendered: false, stageSafe: 0, stageRisky: 0, stageInterrupts: 0, recoveries: 0, pendingCheckpoint: false
  });
  state.speechToken += 1;
}

function startTraining() {
  if (!state.ready) return;
  resetGame();
  UI.landing.hidden = true;
  UI.training.hidden = false;
  renderRound();
}

function goHome() {
  state.active = false;
  state.speechToken += 1;
  try { presenter.interruptPresentation?.(); } catch {}
  stopPresentationVisuals();
  UI.training.hidden = true;
  UI.landing.hidden = false;
  UI.checkpointDialog.close();
  UI.resultDialog.close();
}

async function applyCasting() {
  const selected = {
    avatarId: UI.avatarSelect.value,
    sceneId: UI.sceneSelect.value,
    voiceId: UI.voiceSelect.value
  };
  localStorage.setItem(STORAGE.avatar, selected.avatarId);
  localStorage.setItem(STORAGE.scene, selected.sceneId);
  localStorage.setItem(STORAGE.voice, selected.voiceId);
  UI.settingsDialog.close();
  if (state.active) goHome();
  recreatePresenter();
  state.ready = false;
  state.catalogs.motions = [];
  await initializeProduct(selected, true);
}

function bindEvents() {
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      localStorage.setItem(STORAGE.mode, state.mode);
      document.querySelectorAll("[data-mode]").forEach((node) => node.classList.toggle("is-selected", node === button));
      if (state.ready) UI.start.querySelector(".button-label").textContent = state.mode === "quick" ? "開始快速演練" : "開始完整闖關";
    });
    button.classList.toggle("is-selected", button.dataset.mode === state.mode);
  });
  UI.start.addEventListener("click", startTraining);
  UI.interrupt.addEventListener("click", interruptSpeech);
  UI.exit.addEventListener("click", goHome);
  UI.checkpointBtn.addEventListener("click", continueFromCheckpoint);
  UI.replay.addEventListener("click", () => { UI.resultDialog.close(); startTraining(); });
  UI.home.addEventListener("click", goHome);
  UI.customize.addEventListener("click", () => UI.settingsDialog.showModal());
  UI.voiceSelect.addEventListener("change", updateVoiceMeta);
  UI.applyCasting.addEventListener("click", applyCasting);
  UI.retry.addEventListener("click", async () => {
    hideFatal();
    recreatePresenter();
    state.catalogs = { avatars: [], scenes: [], voices: [], motions: [] };
    state.voiceDetails.clear();
    await initializeProduct({}, true);
  });
}

bindEvents();
initializeProduct({}, true);
