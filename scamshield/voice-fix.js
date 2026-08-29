/* Voice matching fix: rank Mandarin/Taiwan adult voices and prefer lower configured pitch.
 * Loaded before app.js so the first voice selected by Connect is less likely to sound too high.
 */
(() => {
  "use strict";

  const previousFetch = window.fetch.bind(window);
  const DETAIL_TIMEOUT_MS = 2200;

  function isVoiceCatalog(url) {
    return /\/api\/v1\/connect\/voices(?:\?|$)/.test(url);
  }

  function textOf(item, detail) {
    try {
      return `${JSON.stringify(item)} ${JSON.stringify(detail)}`.toLowerCase();
    } catch {
      return String(item?.name || "").toLowerCase();
    }
  }

  function voiceId(item) {
    return item?.id || item?.voice_id || "";
  }

  function configuredPitch(detail) {
    const candidates = [
      detail?.audio_config?.pitch,
      detail?.audioConfig?.pitch,
      detail?.prosody?.pitch,
      detail?.pitch
    ];
    for (const value of candidates) {
      const number = Number(value);
      if (Number.isFinite(number)) return number;
    }
    return null;
  }

  function score(item, detail) {
    const text = textOf(item, detail);
    let value = 0;

    // Language / locale first.
    if (/zh[-_]?tw|taiwan|traditional chinese|mandarin/.test(text)) value += 140;
    else if (/chinese|zh[-_]?cn|zh/.test(text)) value += 85;

    // Prefer adult, formal, lower-register voices when metadata exposes it.
    if (/adult|mature|professional|formal|serious|narrator|news/.test(text)) value += 45;
    if (/male|masculine|man\b/.test(text)) value += 32;
    if (/deep|low|baritone|bass/.test(text)) value += 40;

    // Avoid obviously youthful / high / cute voices.
    if (/child|kid|boy|young|cute|sweet|cheerful|bright|high/.test(text)) value -= 75;
    if (/female|feminine|woman\b/.test(text)) value -= 8;

    // Perxona exposes Google TTS audio_config.speakingRate + pitch in voice detail.
    // Lower configured pitch gets a strong preference for the default threatening male caller.
    const pitch = configuredPitch(detail);
    if (pitch !== null) {
      value += Math.max(-70, Math.min(70, -pitch * 12));
      if (pitch <= -2) value += 20;
      if (pitch >= 2) value -= 28;
    }

    return value;
  }

  async function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("voice detail timeout")), ms))
    ]);
  }

  async function loadDetail(baseUrl, item, init) {
    const id = voiceId(item);
    if (!id) return null;
    try {
      const response = await withTimeout(
        previousFetch(`${baseUrl}/${encodeURIComponent(id)}`, {
          ...init,
          method: "GET",
          cache: "no-store"
        }),
        DETAIL_TIMEOUT_MS
      );
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  window.fetch = async function scamShieldVoiceFix(input, init) {
    const response = await previousFetch(input, init);
    const url = typeof input === "string" ? input : input?.url || "";
    if (!isVoiceCatalog(url) || !response.ok) return response;

    try {
      const data = await response.clone().json();
      if (!Array.isArray(data?.items) || data.items.length < 2) return response;

      const baseUrl = url.replace(/\?.*$/, "");
      const candidates = data.items.slice(0, 10);
      const details = await Promise.all(candidates.map((item) => loadDetail(baseUrl, item, init)));
      const detailById = new Map(candidates.map((item, index) => [voiceId(item), details[index]]));

      const sorted = data.items.slice().sort((a, b) => {
        const difference = score(b, detailById.get(voiceId(b))) - score(a, detailById.get(voiceId(a)));
        return difference || String(a?.name || "").localeCompare(String(b?.name || ""));
      });

      const headers = new Headers(response.headers);
      headers.set("content-type", "application/json");
      return new Response(JSON.stringify({ ...data, items: sorted }), {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (error) {
      console.warn("ScamShield voice ranking skipped", error);
      return response;
    }
  };
})();
