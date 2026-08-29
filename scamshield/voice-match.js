/* ScamShield avatar-to-voice matcher.
 *
 * The avatar catalog and voice catalog are independent in Perxona. This layer
 * makes the product behave as users expect: choosing a masculine avatar
 * immediately selects a lower-pitched masculine Mandarin voice, while still
 * allowing manual override. It loads before app.js so the matched voice is also
 * the one used for presenter initialization after reload.
 */
(() => {
  "use strict";

  const STORAGE = {
    avatar: "scamshield.preferredAvatarId",
    voice: "scamshield.preferredVoiceId",
    key: "scamshield.perxona.publishableKey",
    profile: "scamshield.preferredVoiceProfile"
  };

  const state = {
    avatars: [],
    voices: [],
    details: new Map(),
    key: "",
    avatarReadyResolve: null,
    syncing: false,
    detailRequestStarted: false
  };

  const avatarReady = new Promise((resolve) => {
    state.avatarReadyResolve = resolve;
  });

  const MALE_NAMES = [
    "adam","adrian","alan","albert","alex","allen","andrew","anthony","aaron",
    "ben","benjamin","brian","bruce","carl","charles","chris","christian","craig",
    "daniel","david","dennis","douglas","edward","eric","ethan","frank","gary",
    "george","gerald","gregory","harold","henry","jack","james","jason","jeff",
    "jeffrey","jeremy","jerry","jesse","joe","john","johnny","jonathan","joseph",
    "josh","joshua","justin","keith","kenneth","kevin","kyle","larry","lawrence",
    "leo","louis","mark","martin","matt","matthew","michael","nathan","nicholas",
    "patrick","paul","peter","philip","ralph","raymond","robert","roger","ronald",
    "roy","ryan","sam","samuel","scott","sean","stephen","steven","terry","thomas",
    "tim","timothy","tyler","walter","wayne","william","zachary"
  ];

  const FEMALE_NAMES = [
    "alice","amber","amy","anna","aria","ava","bella","carol","charlotte","chloe",
    "claire","diana","emma","emily","grace","hannah","helen","isabella","jane","jenny",
    "jessica","julia","karen","kate","katherine","laura","linda","lisa","lucy","mary",
    "mia","nancy","natalie","olivia","rachel","rebecca","sara","sarah","sophia","susan"
  ];

  const MALE_VOICE_PATTERNS = [
    "male","masculine","man","gentleman","deep","low","baritone","bass",
    "yunjhe","yun-jhe","yunxi","yunyang","yunjian","yunhao","yunfeng","yunze",
    "yunfan","yunxiao","davis","guy","tony","brian","christopher","eric","jason",
    "andrew","roger","ryan","thomas","kevin","matthew","liam","william","james",
    "cmn-tw-wavenet-b","cmn-tw-wavenet-c","cmn-tw-standard-b","cmn-tw-standard-c"
  ];

  const FEMALE_VOICE_PATTERNS = [
    "female","feminine","woman","girl","soft","sweet","bright",
    "hsiaochen","hsiao-chen","hsiaoyu","hsiao-yu","xiaoxiao","xiaoyi","xiaohan",
    "xiaomeng","xiaomo","xiaoqiu","xiaorui","xiaoshuang","xiaoxuan","xiaoyan",
    "jenny","aria","sara","emma","ava","nancy","amber","jane","michelle",
    "cmn-tw-wavenet-a","cmn-tw-wavenet-d","cmn-tw-standard-a","cmn-tw-standard-d"
  ];

  const CHINESE_PATTERNS = [
    "mandarin","chinese","taiwan","zh-tw","zh_tw","zh-cn","zh_cn","cmn-tw","cmn-cn",
    "國語","中文","台灣"
  ];

  function textOf(value) {
    try { return JSON.stringify(value ?? {}).toLowerCase(); }
    catch { return String(value ?? "").toLowerCase(); }
  }

  function containsAny(text, terms) {
    return terms.some((term) => text.includes(term));
  }

  function itemId(kind, item) {
    if (kind === "avatar") return item?.avatar_id ?? item?.id ?? "";
    return item?.id ?? item?.voice_id ?? "";
  }

  function itemName(item) {
    return item?.name ?? item?.display_name ?? item?.title ?? "Unnamed";
  }

  function words(text) {
    return String(text || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  }

  function classifyAvatar(avatar) {
    if (!avatar) return "neutral";
    const text = textOf(avatar);
    let male = 0;
    let female = 0;

    const maleTerms = ["gender:male","gender male"," male "," man ","gentleman","businessman","masculine","adult male"];
    const femaleTerms = ["gender:female","gender female"," female "," woman ","lady","businesswoman","feminine","adult female"];
    maleTerms.forEach((term) => { if (` ${text} `.includes(term)) male += 8; });
    femaleTerms.forEach((term) => { if (` ${text} `.includes(term)) female += 8; });

    const nameWords = words(`${avatar?.name || ""} ${avatar?.description || ""}`);
    nameWords.forEach((word) => {
      if (MALE_NAMES.includes(word)) male += 4;
      if (FEMALE_NAMES.includes(word)) female += 4;
    });

    if (containsAny(text, ["beard","mustache","moustache","suit man","male avatar"])) male += 5;
    if (containsAny(text, ["female avatar","woman avatar","lady avatar"])) female += 5;

    if (male >= female + 2) return "male";
    if (female >= male + 2) return "female";
    return "neutral";
  }

  function voicePitch(voice) {
    const detail = state.details.get(itemId("voice", voice));
    const candidates = [
      detail?.audio_config?.pitch,
      detail?.audioConfig?.pitch,
      detail?.voice?.pitch,
      voice?.audio_config?.pitch,
      voice?.pitch
    ];
    const value = candidates.map(Number).find(Number.isFinite);
    return Number.isFinite(value) ? value : null;
  }

  function voiceProfile(voice) {
    const detail = state.details.get(itemId("voice", voice));
    const text = `${textOf(voice)} ${textOf(detail)}`;
    const male = containsAny(text, MALE_VOICE_PATTERNS);
    const female = containsAny(text, FEMALE_VOICE_PATTERNS);
    if (male && !female) return "male";
    if (female && !male) return "female";
    return "neutral";
  }

  function isChinese(voice) {
    const detail = state.details.get(itemId("voice", voice));
    return containsAny(`${textOf(voice)} ${textOf(detail)}`, CHINESE_PATTERNS);
  }

  function scoreVoice(voice, desired) {
    const detail = state.details.get(itemId("voice", voice));
    const text = `${textOf(voice)} ${textOf(detail)}`;
    const profile = voiceProfile(voice);
    const pitch = voicePitch(voice);
    let score = 0;

    if (isChinese(voice)) score += 120;
    if (containsAny(text, ["taiwan","zh-tw","zh_tw","cmn-tw","台灣"])) score += 35;
    if (containsAny(text, ["adult","formal","serious","narrator","news","professional"])) score += 25;
    if (containsAny(text, ["child","kid","cute","cartoon","young","cheerful"])) score -= 70;

    if (desired === "male") {
      if (profile === "male") score += 240;
      if (profile === "female") score -= 320;
      if (containsAny(text, ["deep","low","baritone","bass"])) score += 80;
    } else if (desired === "female") {
      if (profile === "female") score += 220;
      if (profile === "male") score -= 260;
      if (containsAny(text, ["soft","warm","calm"])) score += 25;
    } else {
      if (profile === "neutral") score += 30;
      if (containsAny(text, ["adult","formal","serious"])) score += 20;
    }

    if (pitch !== null) {
      if (desired === "male") score += Math.max(-40, Math.min(100, -pitch * 14));
      else if (desired === "female") score += Math.max(-30, Math.min(50, pitch * 5));
      else score -= Math.abs(pitch) * 2;
    }

    return score;
  }

  function bestVoice(desired) {
    if (!state.voices.length) return null;
    return state.voices.slice().sort((a, b) => {
      const difference = scoreVoice(b, desired) - scoreVoice(a, desired);
      if (difference !== 0) return difference;
      return itemName(a).localeCompare(itemName(b));
    })[0] ?? null;
  }

  function selectedAvatar() {
    const id = localStorage.getItem(STORAGE.avatar);
    return state.avatars.find((avatar) => itemId("avatar", avatar) === id) ?? state.avatars[0] ?? null;
  }

  function cloneResponse(response, data) {
    const headers = new Headers(response.headers);
    headers.set("content-type", "application/json");
    return new Response(JSON.stringify(data), {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  function requestKey(input, init) {
    try {
      const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
      return headers.get("X-Connect-Key") || localStorage.getItem(STORAGE.key) || "";
    } catch {
      return localStorage.getItem(STORAGE.key) || "";
    }
  }

  function isAvatarList(url) {
    return /\/api\/v1\/connect\/assets\/avatars(?:\?|$)/.test(url);
  }

  function isVoiceList(url) {
    return /\/api\/v1\/connect\/voices(?:\?|$)/.test(url);
  }

  const upstreamFetch = window.fetch.bind(window);
  window.fetch = async function scamShieldVoiceMatchFetch(input, init) {
    const response = await upstreamFetch(input, init);
    const url = typeof input === "string" ? input : input?.url ?? "";
    if (!response.ok || (!isAvatarList(url) && !isVoiceList(url))) return response;

    try {
      const data = await response.clone().json();
      if (!Array.isArray(data?.items)) return response;

      if (isAvatarList(url)) {
        state.avatars = data.items.slice();
        state.avatarReadyResolve?.();
        scheduleUiSync();
        return response;
      }

      state.key = requestKey(input, init);
      await Promise.race([avatarReady, new Promise((resolve) => setTimeout(resolve, 1200))]);
      state.voices = data.items.slice();
      const avatar = selectedAvatar();
      const desired = localStorage.getItem(STORAGE.profile) || classifyAvatar(avatar);
      const sorted = state.voices.slice().sort((a, b) => scoreVoice(b, desired) - scoreVoice(a, desired));
      state.voices = sorted;

      const match = sorted[0];
      if (match && desired !== "neutral") {
        localStorage.setItem(STORAGE.voice, itemId("voice", match));
        localStorage.setItem(STORAGE.profile, desired);
      }

      hydrateVoiceDetails(state.key);
      scheduleUiSync();
      return cloneResponse(response, { ...data, items: sorted });
    } catch (error) {
      console.warn("ScamShield voice matching skipped", error);
      return response;
    }
  };

  async function hydrateVoiceDetails(key) {
    if (state.detailRequestStarted || !key || !state.voices.length) return;
    state.detailRequestStarted = true;
    const voices = state.voices.slice(0, 24);
    await Promise.allSettled(voices.map(async (voice) => {
      const id = itemId("voice", voice);
      if (!id) return;
      const response = await upstreamFetch(`https://console.perxona.ai/asia/api/v1/connect/voices/${encodeURIComponent(id)}`, {
        headers: { "X-Connect-Key": key },
        cache: "no-store"
      });
      if (!response.ok) return;
      state.details.set(id, await response.json());
    }));

    const avatar = selectedAvatar();
    const desired = localStorage.getItem(STORAGE.profile) || classifyAvatar(avatar);
    autoMatch(desired, { showReloadHint: true });
  }

  function updateVoiceSelect(select, desired, matched) {
    if (!select || !matched) return;
    const sorted = state.voices.slice().sort((a, b) => scoreVoice(b, desired) - scoreVoice(a, desired));
    const currentValue = itemId("voice", matched);
    select.innerHTML = sorted.map((voice) => {
      const id = itemId("voice", voice);
      const profile = voiceProfile(voice);
      const pitch = voicePitch(voice);
      const badges = [];
      if (profile === "male") badges.push("男聲");
      if (profile === "female") badges.push("女聲");
      if (pitch !== null && pitch < 0) badges.push(`pitch ${pitch}`);
      const suffix = badges.length ? ` · ${badges.join(" · ")}` : "";
      return `<option value="${escapeHtml(id)}" ${id === currentValue ? "selected" : ""}>${escapeHtml(itemName(voice))}${escapeHtml(suffix)}</option>`;
    }).join("");
    select.value = currentValue;
  }

  function ensureStatus(panel) {
    if (!panel) return null;
    let status = panel.querySelector("#voiceMatchStatus");
    if (!status) {
      status = document.createElement("div");
      status.id = "voiceMatchStatus";
      status.className = "voice-match-status";
      const controls = panel.querySelector(".ux2-casting-controls") || panel;
      controls.after(status);
    }
    return status;
  }

  function ensureProfileButtons(panel) {
    if (!panel || panel.querySelector("#voiceProfileButtons")) return;
    const voiceLabel = panel.querySelector("#ux2VoiceSelect")?.closest("label");
    if (!voiceLabel) return;
    const wrapper = document.createElement("div");
    wrapper.id = "voiceProfileButtons";
    wrapper.className = "voice-profile-buttons";
    wrapper.innerHTML = `
      <span>聲線快速配對</span>
      <div>
        <button type="button" data-voice-profile="male">低沉男聲</button>
        <button type="button" data-voice-profile="neutral">中性正式</button>
        <button type="button" data-voice-profile="female">女聲</button>
      </div>`;
    voiceLabel.after(wrapper);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function autoMatch(desired, options = {}) {
    if (!state.voices.length) return null;
    const matched = bestVoice(desired);
    if (!matched) return null;
    const id = itemId("voice", matched);
    localStorage.setItem(STORAGE.voice, id);
    localStorage.setItem(STORAGE.profile, desired);

    const participantPanel = document.querySelector("#ux2ParticipantCasting");
    const settingsPanel = document.querySelector("#uxCastingPanel");
    updateVoiceSelect(participantPanel?.querySelector("#ux2VoiceSelect"), desired, matched);
    updateVoiceSelect(settingsPanel?.querySelector("#uxVoiceSelect"), desired, matched);

    const status = ensureStatus(participantPanel);
    if (status) {
      const profileText = desired === "male" ? "男生角色 → 低沉男聲" : desired === "female" ? "女生角色 → 女聲" : "中性正式聲線";
      const pitch = voicePitch(matched);
      status.innerHTML = `<strong>AUTO VOICE MATCH</strong><span>${escapeHtml(profileText)}：${escapeHtml(itemName(matched))}${pitch !== null ? `（pitch ${escapeHtml(pitch)}）` : ""}</span>${options.showReloadHint ? "<small>若人偶已載入，按「套用角色並重新載入」讓新聲音生效。</small>" : ""}`;
    }

    return matched;
  }

  function matchAvatarById(id) {
    const avatar = state.avatars.find((item) => itemId("avatar", item) === id);
    const desired = classifyAvatar(avatar);
    localStorage.setItem(STORAGE.avatar, id);
    return autoMatch(desired === "neutral" ? "male" : desired);
  }

  let syncQueued = false;
  function scheduleUiSync() {
    if (syncQueued) return;
    syncQueued = true;
    requestAnimationFrame(() => {
      syncQueued = false;
      const panel = document.querySelector("#ux2ParticipantCasting");
      if (!panel || state.syncing) return;
      state.syncing = true;
      try {
        ensureProfileButtons(panel);
        const avatar = selectedAvatar();
        const desired = localStorage.getItem(STORAGE.profile) || classifyAvatar(avatar);
        const matchedId = localStorage.getItem(STORAGE.voice);
        const matched = state.voices.find((voice) => itemId("voice", voice) === matchedId) || bestVoice(desired);
        if (matched) {
          updateVoiceSelect(panel.querySelector("#ux2VoiceSelect"), desired, matched);
          const status = ensureStatus(panel);
          if (status && !status.textContent.trim()) {
            status.innerHTML = `<strong>AUTO VOICE MATCH</strong><span>${desired === "male" ? "已配對低沉男聲" : desired === "female" ? "已配對女聲" : "已配對正式聲線"}：${escapeHtml(itemName(matched))}</span>`;
          }
        }
      } finally {
        state.syncing = false;
      }
    });
  }

  document.addEventListener("click", (event) => {
    const avatarButton = event.target.closest?.("[data-ux2-avatar], [data-avatar-id]");
    if (avatarButton) {
      const id = avatarButton.dataset.ux2Avatar || avatarButton.dataset.avatarId;
      if (id) setTimeout(() => matchAvatarById(id), 0);
      return;
    }

    const profileButton = event.target.closest?.("[data-voice-profile]");
    if (profileButton) {
      const desired = profileButton.dataset.voiceProfile || "neutral";
      document.querySelectorAll("[data-voice-profile]").forEach((button) => button.classList.toggle("is-selected", button === profileButton));
      autoMatch(desired);
    }
  }, true);

  document.addEventListener("change", (event) => {
    if (event.target?.matches?.("#ux2VoiceSelect, #uxVoiceSelect")) {
      localStorage.setItem(STORAGE.voice, event.target.value);
      const status = document.querySelector("#voiceMatchStatus");
      if (status) status.innerHTML = `<strong>MANUAL VOICE</strong><span>已手動選擇：${escapeHtml(event.target.selectedOptions?.[0]?.textContent || event.target.value)}</span>`;
    }
  }, true);

  const observer = new MutationObserver(scheduleUiSync);
  if (document.documentElement) observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scheduleUiSync, { once: true });
  else scheduleUiSync();

  const style = document.createElement("style");
  style.textContent = `
    .voice-match-status{grid-column:1/-1;display:flex;align-items:center;gap:9px;flex-wrap:wrap;border:1px solid rgba(112,240,194,.2);background:rgba(112,240,194,.055);border-radius:10px;padding:9px 11px;color:#a9b8ce;font-size:10px}
    .voice-match-status strong{color:#70f0c2;font-size:9px;letter-spacing:.13em}.voice-match-status span{color:#dce8f5}.voice-match-status small{width:100%;color:#78879d}
    .voice-profile-buttons{display:grid;gap:8px;color:#8d9bb2;font-size:10px;letter-spacing:.1em;font-weight:850}.voice-profile-buttons>div{display:flex;gap:6px;flex-wrap:wrap}
    .voice-profile-buttons button{border:1px solid rgba(255,255,255,.1);background:#0c1018;color:#cbd6e8;border-radius:9px;padding:10px 11px;font-size:10px;font-weight:800;cursor:pointer}
    .voice-profile-buttons button:hover,.voice-profile-buttons button.is-selected{border-color:rgba(112,240,194,.65);background:rgba(112,240,194,.08);color:#dffff4}
  `;
  document.head.appendChild(style);
})();
