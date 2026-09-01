const API_BASE = "https://console.perxona.ai/asia";
const PRESENTER_URL = "https://cdn.perxona.ai/asia/prod/latest/widget/entry/presenter.js";
const SAFE_LINE = "我是公司資訊部。你的帳號正在遭到入侵，現在立刻核准手機上的 MFA 通知，不要掛斷。";

const presenter = document.querySelector("#liveAvatar");
const els = {
  status: document.querySelector("#status"),
  shell: document.querySelector("#avatarShell"),
  phase: document.querySelector("#phase"),
  progress: document.querySelector("#progress"),
  detail: document.querySelector("#loadingDetail"),
  keySetup: document.querySelector("#keySetup"),
  keyInput: document.querySelector("#keyInput"),
  buildLink: document.querySelector("#buildLink"),
  shareBox: document.querySelector("#shareBox"),
  shareUrl: document.querySelector("#shareUrl"),
  copyUrl: document.querySelector("#copyUrl"),
  play: document.querySelector("#playBtn"),
  interrupt: document.querySelector("#interruptBtn"),
  react: document.querySelector("#reactBtn"),
  errorBox: document.querySelector("#errorBox"),
  errorText: document.querySelector("#errorText"),
  retry: document.querySelector("#retryBtn")
};

let ready = false;
let speaking = false;
let motions = [];
let readyTimeout = null;
let engineLoaded = false;

function keyFromHash() {
  const raw = location.hash.replace(/^#/, "");
  if (!raw) return "";
  const params = new URLSearchParams(raw);
  return (params.get("connect") || params.get("key") || "").trim();
}

function directUrl(key) {
  const url = new URL(location.href);
  url.hash = `connect=${encodeURIComponent(key)}`;
  return url.href;
}

function setStatus(kind, text) {
  els.status.className = `status ${kind}`;
  els.status.querySelector("span").textContent = text;
}

function setPhase(title, detail, progress) {
  els.phase.textContent = title;
  if (detail) els.detail.textContent = detail;
  if (progress != null) els.progress.textContent = progress;
}

function setControls(enabled) {
  els.play.disabled = !enabled;
  els.react.disabled = !enabled;
  els.interrupt.disabled = !enabled || !speaking;
  if (!enabled) els.play.textContent = "Avatar 尚未 ready";
  else if (!speaking) els.play.textContent = "播放防詐情境";
}

function showError(message) {
  clearTimeout(readyTimeout);
  ready = false;
  speaking = false;
  setStatus("error", "Perxona Connect 未 ready");
  setPhase("Connect Kit 連線未完成", "請確認 Publishable Key 的 allowed domain 包含 allen3429.github.io。", "ERROR");
  setControls(false);
  els.errorText.textContent = message;
  els.errorBox.hidden = false;
}

function loadPresenterEngine() {
  if (engineLoaded || customElements.get("sv-presenter")) {
    engineLoaded = true;
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = PRESENTER_URL;
    script.onload = async () => {
      try {
        await customElements.whenDefined("sv-presenter");
        engineLoaded = true;
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    script.onerror = () => reject(new Error("Perxona presenter SDK failed to load"));
    document.head.appendChild(script);
  });
}

async function connectApi(path, key) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "X-Connect-Key": key },
    cache: "no-store",
    mode: "cors"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.detail || data?.details || data?.error || response.statusText;
    throw Object.assign(new Error(message), { status: response.status, data });
  }
  return data;
}

function markReady() {
  if (ready) return;
  clearTimeout(readyTimeout);
  ready = true;
  els.shell.classList.add("is-ready");
  els.shell.setAttribute("aria-busy", "false");
  document.body.classList.add("connect-ready");
  setStatus("ready", "Perxona Connect Avatar 可互動");
  setPhase("PRESENTER_STATUS: Ready", "現在可播放台詞、播放 Motion，或在說話途中中斷。", "READY");
  setControls(true);
  els.errorBox.hidden = true;
}

// Official Connect sample: subscribe before initialization. Ready is an event,
// not readable state.
presenter.addEventListener("PRESENTER_STATUS", (event) => {
  const status = event.detail?.status;
  console.info("Perxona PRESENTER_STATUS", status, event.detail);
  if (status === "Ready") markReady();
  else if (status) setPhase(`Presenter: ${status}`, "等待 Perxona 最終 Ready 事件。", "…");
});

async function initialize(key) {
  if (!key) return;
  els.keySetup.hidden = true;
  els.shareBox.hidden = false;
  els.shareUrl.textContent = directUrl(key);
  setStatus("loading", "Perxona Connect 初始化中");
  setPhase("載入 Perxona Presenter SDK", "正在建立真實 Connect Kit 流程。", "1/4");

  try {
    await loadPresenterEngine();
    setPhase("讀取 Avatar / Scene / Voice catalog", "使用 Publishable Connect Key 直接讀取公開 catalog。", "2/4");

    const [avatars, scenes, voices] = await Promise.all([
      connectApi("/api/v1/connect/assets/avatars?page=1&size=50", key),
      connectApi("/api/v1/connect/assets/scenes?page=1&size=50", key),
      connectApi("/api/v1/connect/voices?page=1&size=50", key)
    ]);

    const avatarId = avatars.items?.[0]?.avatar_id;
    const sceneId = scenes.items?.[0]?.scene_id;
    const voiceId = voices.items?.[0]?.id;
    if (!avatarId || !sceneId || !voiceId) {
      throw new Error("Connect catalog 缺少 Avatar、Scene 或 Voice");
    }

    setPhase("載入 Avatar Motion catalog", "正在準備可直接操作的動作。", "3/4");
    const motionData = await connectApi(
      `/api/v1/connect/assets/avatars/${encodeURIComponent(avatarId)}/motions?page=1&size=100`,
      key
    ).catch(() => ({ items: [] }));
    motions = motionData.items || [];

    setPhase("初始化 3D Avatar", "只有收到 PRESENTER_STATUS: Ready 才會解鎖。", "4/4");
    readyTimeout = setTimeout(() => {
      if (!ready) showError("初始化後 35 秒仍未收到 PRESENTER_STATUS: Ready。請重新建立 Publishable Key，並確認 allowed domain 為 allen3429.github.io。 ");
    }, 35000);

    await presenter.initializeWithConnectKey(key, { avatarId, sceneId, voiceId });
  } catch (error) {
    showError(`${error?.message || error}${error?.status ? `（HTTP ${error.status}）` : ""}`);
  }
}

async function play() {
  if (!ready || speaking) return;
  speaking = true;
  els.play.disabled = true;
  els.play.textContent = "Avatar 正在說話…";
  els.react.disabled = true;
  els.interrupt.disabled = false;

  try {
    await presenter.resumeAudioPlayback?.();
    const result = await presenter.present(SAFE_LINE);
    if (!result?.success) {
      throw new Error(`${result?.code || "PRESENT_FAILED"}: ${result?.message || "present() returned success=false"}`);
    }
  } catch (error) {
    if (speaking) {
      els.errorText.textContent = `Avatar 已顯示，但台詞播放失敗：${error?.message || error}`;
      els.errorBox.hidden = false;
    }
  } finally {
    speaking = false;
    els.interrupt.disabled = true;
    els.react.disabled = !ready;
    els.play.disabled = !ready;
    if (ready) els.play.textContent = "再播放一次";
  }
}

function interrupt() {
  if (!ready || !speaking) return;
  try { presenter.interruptPresentation?.(); } catch (error) { console.warn(error); }
  speaking = false;
  els.interrupt.disabled = true;
  els.react.disabled = false;
  els.play.disabled = false;
  els.play.textContent = "已中斷 · 再播放";
}

async function react() {
  if (!ready || !motions.length) {
    els.errorText.textContent = motions.length ? "Motion 尚未 ready。" : "此 Avatar catalog 沒有可用 Motion；語音與中斷仍可操作。";
    els.errorBox.hidden = false;
    return;
  }
  const motionId = motions.find((item) => /error|surprise|confus|angry|point/i.test(`${item.name || ""} ${(item.tags || []).join(" ")}`))?.motion_id || motions[0]?.motion_id;
  if (!motionId) return;
  try {
    await presenter.playMotion?.(motionId);
  } catch (error) {
    els.errorText.textContent = `Motion 播放失敗：${error?.message || error}`;
    els.errorBox.hidden = false;
  }
}

els.buildLink.addEventListener("click", () => {
  const key = els.keyInput.value.trim();
  if (!key) return;
  location.replace(directUrl(key));
});

els.keyInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") els.buildLink.click();
});

els.copyUrl.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(els.shareUrl.textContent);
    els.copyUrl.textContent = "已複製，可直接回信補交";
  } catch {
    els.copyUrl.textContent = "請手動複製上方網址";
  }
});

els.play.addEventListener("click", play);
els.interrupt.addEventListener("click", interrupt);
els.react.addEventListener("click", react);
els.retry.addEventListener("click", () => location.reload());

const key = keyFromHash();
if (key) initialize(key);
else {
  setStatus("loading", "等待 Publishable Connect Key");
  setPhase("建立直接驗收網址", "在左側貼上 Publishable Connect Key；網址 fragment 不會傳到 GitHub Pages。", "LOCKED");
  setControls(false);
}
