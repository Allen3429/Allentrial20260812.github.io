const API_BASE = "https://console.perxona.ai/asia";
const PRESENTER_URL = "https://cdn.perxona.ai/asia/prod/latest/widget/entry/presenter.js";
const STORAGE_KEY = "scamshield.perxona.publishableKey";
const SAFETY_BOUNDARY_LINE = "這個模擬器只允許預先核准的防詐訓練情境，不會生成可用來攻擊第三人的詐騙話術。";

const presenter = document.querySelector("sv-presenter");
const $ = (s) => document.querySelector(s);
const els = {
  briefing: $("#briefingPanel"), game: $("#gamePanel"), result: $("#resultPanel"),
  start: $("#startBtn"), replay: $("#replayBtn"), settings: $("#settingsBtn"), dialog: $("#settingsDialog"),
  connectBtn: $("#connectBtn"), clearKeyBtn: $("#clearKeyBtn"), keyInput: $("#connectKeyInput"), catalogStatus: $("#catalogStatus"),
  badge: $("#connectionBadge"), fallback: $("#avatarFallback"), roundLabel: $("#roundLabel"), roundTitle: $("#roundTitle"),
  shieldBar: $("#shieldBar"), shieldValue: $("#shieldValue"), score: $("#scoreValue"), redFlags: $("#redFlags"),
  dialogue: $("#dialogueText"), choiceArea: $("#choiceArea"), lesson: $("#lessonBox"), interrupt: $("#interruptBtn"), interruptFeedback: $("#interruptFeedback"),
  finalScore: $("#finalScore"), resultTitle: $("#resultTitle"), resultCopy: $("#resultCopy"), resultFlags: $("#resultFlags"), showWhy: $("#showWhyBtn"), whyBox: $("#whyBox")
};

let perxona = { ready: false, key: "", avatarId: "", sceneId: "", voiceId: "", motions: [] };
let game = { round: 0, score: 0, shield: 100, flags: [], interrupted: false, presenting: false };
let engineLoaded = false;

const rounds = [
  {
    title: "權威 + 急迫",
    speech: "你好，我是校務註冊中心。系統顯示你的註冊資料異常，如果十分鐘內沒有完成驗證，今天的選課資格可能會被暫停。先不要掛電話，我現在可以直接幫你處理。",
    flag: "製造急迫感",
    choices: [
      { text: "先照他的流程做，避免真的失去資格", delta: -22, shield: -25, ok: false, lesson: "急迫感是常見操控手法。真正安全的作法不是在對方提供的流程裡驗證，而是離開這段對話，自己找到官方聯絡方式。" },
      { text: "掛斷，自己到學校官網找電話再回撥確認", delta: 30, shield: 0, ok: true, lesson: "正確。『獨立驗證』會切斷詐騙者控制的情境，是最重要的防線之一。", addFlag: "獨立驗證" },
      { text: "請他先說出更多我的資料證明身分", delta: 8, shield: -8, ok: false, lesson: "比直接相信好，但個資可能早已外洩。對方知道你的姓名、學校或電話，不代表他是真的官方人員。", addFlag: "知道個資 ≠ 身分可信" }
    ]
  },
  {
    title: "OTP 驗證碼",
    speech: "我已經替你送出系統修復了。你的手機等一下會收到一組六位數驗證碼，請直接念給我，這樣我才能完成註冊資料同步。",
    flag: "索取一次性驗證碼",
    choices: [
      { text: "念出驗證碼，反正他看起來是官方人員", delta: -30, shield: -35, ok: false, lesson: "不要把 OTP、簡訊驗證碼、密碼或重設碼提供給來電者。這類資訊可能直接讓對方接管帳號。" },
      { text: "拒絕提供驗證碼，並停止這通電話", delta: 30, shield: 0, ok: true, lesson: "正確。驗證碼就是你的數位鑰匙。任何要求你把它念出來的人，都應被視為高風險。", addFlag: "OTP 永不轉交" },
      { text: "只念前五碼，最後一碼先保留", delta: -16, shield: -18, ok: false, lesson: "仍然不安全。安全原則不是『少給一點』，而是完全不把驗證憑證交給對方。" }
    ]
  },
  {
    title: "金流隔離",
    speech: "看起來你的帳號可能已經被冒用。為了保護你的錢，我們需要先把資金暫時移到安全帳戶，等調查完成就會退回。這件事不能告訴銀行櫃員，否則會影響調查。",
    flag: "安全帳戶 + 要求保密",
    choices: [
      { text: "先轉一小筆測試，確認安全帳戶是真的", delta: -28, shield: -32, ok: false, lesson: "不存在需要你把錢轉入的『安全帳戶』。小額測試同樣可能讓你進入詐騙流程。" },
      { text: "拒絕轉帳，直接聯絡銀行與官方反詐管道", delta: 30, shield: 0, ok: true, lesson: "正確。任何要求你轉到『安全帳戶』、隱瞞銀行或不要告訴家人的說法，都應立刻停止交易。", addFlag: "安全帳戶是紅旗" },
      { text: "先問對方帳號名稱與銀行，再決定", delta: 3, shield: -10, ok: false, lesson: "詐騙者可以提供看似完整的帳戶資訊。重點不是資訊夠不夠真，而是『要求轉移資金』本身就需要你離開這段對話獨立查證。", addFlag: "不要在對方框架內驗證" }
    ]
  }
];

// Anti-abuse by design: the deployed app can only send these reviewed educational lines
// to the avatar. There is no free-text scam-script generator and no outbound messaging path.
const APPROVED_SIMULATION_LINES = new Set(rounds.map((round) => round.speech));

function setBadge(online, text) {
  els.badge.textContent = text;
  els.badge.className = `badge ${online ? "badge-online" : "badge-offline"}`;
}

function setPerxonaReady(ready, text = ready ? "Perxona ready" : "Perxona setup needed") {
  perxona.ready = ready;
  setBadge(ready, text);
  els.start.disabled = !ready;
  els.start.innerHTML = ready ? "開始視訊演練 <span>→</span>" : "先連線 Perxona <span>⚙</span>";
  els.fallback.classList.toggle("hidden", ready);
}

async function loadPresenterEngine() {
  if (engineLoaded || customElements.get("sv-presenter")) { engineLoaded = true; return; }
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = PRESENTER_URL;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Perxona Presenter SDK 載入失敗"));
    document.head.appendChild(script);
  });
  await customElements.whenDefined("sv-presenter");
  engineLoaded = true;
}

async function api(path, key) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "X-Connect-Key": key, "Content-Type": "application/json" }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || data?.details || data?.error || res.statusText);
  return data;
}

async function discoverExistingPublicKey() {
  try {
    const html = await fetch("../index.html", { cache: "no-store" }).then((r) => r.ok ? r.text() : "");
    return html.match(/apiKey=["']([^"']+)["']/i)?.[1] || "";
  } catch { return ""; }
}

async function connectPerxona(key, persist = true) {
  if (!key) throw new Error("需要 Perxona Connect Publishable Key");
  els.catalogStatus.textContent = "正在驗證 Connect key 並載入 Avatar / Scene / Voice…";
  setPerxonaReady(false, "Perxona connecting…");
  await loadPresenterEngine();

  let avatars, scenes, voices;
  try {
    [avatars, scenes, voices] = await Promise.all([
      api("/api/v1/connect/assets/avatars", key),
      api("/api/v1/connect/assets/scenes", key),
      api("/api/v1/connect/voices", key)
    ]);
  } catch (error) {
    throw new Error(`Connect catalog 驗證失敗。請確認這是 Publishable Connect Key，且 allowed domain 包含本網站。${error?.message ? ` (${error.message})` : ""}`);
  }

  const avatarId = avatars.items?.[0]?.avatar_id;
  const sceneId = scenes.items?.[0]?.scene_id;
  const voiceId = voices.items?.[0]?.id;
  if (!avatarId || !sceneId || !voiceId) throw new Error("Connect catalog 中缺少 Avatar、Scene 或 Voice");

  const motions = await api(`/api/v1/connect/assets/avatars/${encodeURIComponent(avatarId)}/motions`, key)
    .catch(() => ({ items: [] }));

  await presenter.initializeWithConnectKey(key, { avatarId, sceneId, voiceId });
  perxona = { ready: true, key, avatarId, sceneId, voiceId, motions: motions.items || [] };
  if (persist) localStorage.setItem(STORAGE_KEY, key);
  els.keyInput.value = key;
  els.catalogStatus.textContent = `已連線 · ${avatars.items.length} avatars · ${motions.items?.length || 0} motions · simulation-only safety lock ON`;
  setPerxonaReady(true);
}

function motionFor(...keywords) {
  const list = perxona.motions || [];
  const norm = (v) => String(v || "").toLowerCase();
  for (const kw of keywords) {
    const k = kw.toLowerCase();
    const found = list.find((m) => norm(m.name).includes(k) || (m.tags || []).some((t) => norm(t).includes(k)));
    if (found) return found.motion_id;
  }
  return null;
}

async function playMotion(...keywords) {
  if (!perxona.ready) return;
  const id = motionFor(...keywords);
  if (id) {
    try { await presenter.playMotion?.(id); }
    catch (e) { console.warn("motion", e); }
  }
}

function tripSafetyBoundary() {
  game.presenting = false;
  els.interrupt.disabled = true;
  els.interrupt.classList.remove("hot");
  els.dialogue.textContent = `🚨 Safety boundary: ${SAFETY_BOUNDARY_LINE}`;
  els.interruptFeedback.textContent = "未核准內容沒有送到 Perxona。";
  console.warn("ScamShield safety boundary blocked a non-whitelisted presentation request.");
}

async function speak(text, mood = "talk") {
  if (!APPROVED_SIMULATION_LINES.has(text)) {
    tripSafetyBoundary();
    return;
  }

  els.dialogue.textContent = text;
  game.presenting = true;
  game.interrupted = false;
  els.interrupt.disabled = false;
  els.interrupt.classList.add("hot");
  els.interruptFeedback.textContent = "現在可以打斷。聽到紅旗就按！";

  if (!perxona.ready) {
    tripSafetyBoundary();
    els.dialogue.textContent = "Perxona Connect 尚未就緒。請先完成連線再開始演練。";
    return;
  }

  try {
    await presenter.resumeAudioPlayback?.();
    const motion = mood === "pressure"
      ? motionFor("angry", "serious", "point", "explain")
      : motionFor("talk", "gesture", "explain", "welcome");
    const payload = motion ? `[MOTION ${motion}] ${text}` : text;
    const result = await presenter.present(payload);
    if (result && result.success === false) console.warn("Perxona present failed", result);
  } catch (e) {
    console.warn("Perxona speech", e);
  }
  finishSpeaking();
}

function finishSpeaking() {
  game.presenting = false;
  els.interrupt.disabled = true;
  els.interrupt.classList.remove("hot");
  renderChoices();
}

function addFlag(flag) {
  if (!flag || game.flags.includes(flag)) return;
  game.flags.push(flag);
  renderFlags();
}

function renderFlags() {
  els.redFlags.innerHTML = game.flags.length
    ? game.flags.map((f) => `<span class="flag">⚑ ${escapeHtml(f)}</span>`).join("")
    : `<div class="empty-state">你抓到的紅旗會出現在這裡。</div>`;
}

function updateHud() {
  els.score.textContent = `${Math.max(0, game.score)} pts`;
  els.shieldValue.textContent = game.shield;
  els.shieldBar.style.width = `${Math.max(0, game.shield)}%`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>'"]/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[c]);
}

function renderRound() {
  const r = rounds[game.round];
  els.roundLabel.textContent = `ROUND ${game.round + 1} / ${rounds.length}`;
  els.roundTitle.textContent = r.title;
  els.choiceArea.innerHTML = "";
  els.lesson.classList.add("hidden");
  speak(r.speech, game.round === 0 ? "talk" : "pressure");
}

function renderChoices() {
  const r = rounds[game.round];
  if (!r) return;
  els.choiceArea.innerHTML = r.choices
    .map((c, i) => `<button class="choice" type="button" data-choice="${i}"><b>${String.fromCharCode(65 + i)}</b>${escapeHtml(c.text)}</button>`)
    .join("");
  els.choiceArea.querySelectorAll(".choice").forEach((btn) =>
    btn.addEventListener("click", () => choose(Number(btn.dataset.choice)))
  );
}

async function choose(index) {
  const r = rounds[game.round];
  const c = r.choices[index];
  els.choiceArea.innerHTML = "";
  game.score += c.delta;
  game.shield = Math.max(0, Math.min(100, game.shield + c.shield));
  if (c.addFlag) addFlag(c.addFlag);
  if (c.ok) addFlag(r.flag);
  updateHud();
  els.lesson.className = `lesson ${c.ok ? "" : "bad"}`;
  els.lesson.textContent = c.lesson;
  els.lesson.classList.remove("hidden");
  await playMotion(...(c.ok ? ["surprise", "confused", "nervous"] : ["happy", "agree", "talk"]));
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
  try { presenter.interruptPresentation?.(); } catch {}
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
    els.catalogStatus.textContent = "Hackathon demo 已鎖定為 Connect Kit 模式：請先連線 Perxona。";
    if (!els.dialog.open) els.dialog.showModal();
    return;
  }
  game = { round: 0, score: 0, shield: 100, flags: [], interrupted: false, presenting: false };
  els.briefing.classList.add("hidden");
  els.result.classList.add("hidden");
  els.game.classList.remove("hidden");
  renderFlags();
  updateHud();
  renderRound();
}

function finishGame() {
  const raw = Math.max(0, Math.min(100, Math.round(55 + game.score * 0.5 + (game.shield - 50) * 0.35)));
  els.finalScore.textContent = raw;
  els.resultTitle.textContent = raw >= 85
    ? "你守住了判斷力。"
    : raw >= 65
      ? "你有警覺，但還會被情境帶著走。"
      : "你需要練的是『停下來』。";
  els.resultCopy.textContent = raw >= 85
    ? "你能辨認急迫感、OTP 與安全帳戶等高風險訊號，而且知道要離開對方控制的情境，改用官方管道獨立驗證。"
    : "詐騙最危險的不是知識不足，而是人在壓力下會把『立即處理』誤認為『趕快解決問題』。再玩一次，目標是更早打斷操控。";
  els.resultFlags.innerHTML = game.flags.map((f) => `<span class="flag">✓ ${escapeHtml(f)}</span>`).join("");
  els.game.classList.add("hidden");
  els.result.classList.remove("hidden");
  if (raw >= 85) playMotion("happy", "cheer", "celebrate");
  else playMotion("thinking", "sad", "confused");
}

els.interrupt.addEventListener("click", interrupt);
els.start.addEventListener("click", startGame);
els.replay.addEventListener("click", startGame);
els.showWhy.addEventListener("click", () => els.whyBox.classList.toggle("hidden"));
els.settings.addEventListener("click", () => {
  if (!els.dialog.open) els.dialog.showModal();
});

els.connectBtn.addEventListener("click", async () => {
  els.connectBtn.disabled = true;
  try {
    await connectPerxona(els.keyInput.value.trim());
    els.dialog.close();
  } catch (e) {
    els.catalogStatus.textContent = `連線失敗：${e.message}`;
    setPerxonaReady(false);
  } finally {
    els.connectBtn.disabled = false;
  }
});

els.clearKeyBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  els.keyInput.value = "";
  perxona = { ready: false, key: "", avatarId: "", sceneId: "", voiceId: "", motions: [] };
  setPerxonaReady(false);
  els.catalogStatus.textContent = "已清除本機 Connect key。";
});

presenter.addEventListener?.("PRESENTER_STATUS", (event) => {
  if (event.detail?.status === "Ready" && perxona.key) {
    setPerxonaReady(true);
  }
});

(async function boot() {
  setPerxonaReady(false, "Perxona connecting…");
  let key = localStorage.getItem(STORAGE_KEY) || "";
  let source = "saved Connect key";

  if (!key) {
    key = await discoverExistingPublicKey();
    source = "existing site public key";
  }

  if (key) {
    els.keyInput.value = key;
    try {
      await connectPerxona(key, false);
      els.catalogStatus.textContent += ` · auto-connected from ${source}`;
      return;
    } catch (e) {
      console.warn("Auto-connect failed", e);
    }
  }

  setPerxonaReady(false);
  els.catalogStatus.textContent = "需要一把可用的 Perxona Connect Publishable Key。舊站 key 若不是 Connect key，請在這裡換成今天 Hackathon 建立的 key。";
})();
