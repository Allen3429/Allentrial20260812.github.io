(() => {
  "use strict";

  const CONFIG = window.SCAMSHIELD_CONFIG;
  if (!CONFIG?.publishableConnectKey || !CONFIG?.apiBase) return;

  const nativeFetch = window.fetch.bind(window);
  const CATALOG_TTL_MS = 5 * 60 * 1000;
  const AVATAR_PATH = "/api/v1/connect/assets/avatars?page=1&size=100";
  const SCENE_PATH = "/api/v1/connect/assets/scenes?page=1&size=100";
  const VOICE_PATH = "/api/v1/connect/voices?page=1&size=100";
  const exactCatalogPaths = [AVATAR_PATH, SCENE_PATH, VOICE_PATH];
  const memory = new Map();

  function storageKey(url) {
    return `scamshield.catalog.${btoa(url).replace(/=+$/g, "")}`;
  }

  function readSession(url) {
    try {
      const raw = sessionStorage.getItem(storageKey(url));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.time || Date.now() - parsed.time > CATALOG_TTL_MS) {
        sessionStorage.removeItem(storageKey(url));
        return null;
      }
      return parsed.data;
    } catch {
      return null;
    }
  }

  function writeSession(url, data) {
    try { sessionStorage.setItem(storageKey(url), JSON.stringify({ time: Date.now(), data })); } catch {}
  }

  function responseFrom(data) {
    return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  const catalogUrl = (path) => `${CONFIG.apiBase}${path}`;

  function prime(url) {
    const cached = readSession(url);
    if (cached) {
      memory.set(url, Promise.resolve(cached));
      return;
    }
    const promise = nativeFetch(url, {
      headers: { "X-Connect-Key": CONFIG.publishableConnectKey },
      mode: "cors",
      cache: "default"
    }).then(async (response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      writeSession(url, data);
      return data;
    }).catch((error) => {
      memory.delete(url);
      console.warn("Perxona catalog prewarm skipped", error);
      throw error;
    });
    memory.set(url, promise);
  }

  exactCatalogPaths.map(catalogUrl).forEach(prime);

  function idOf(item) {
    return String(item?.avatar_id || item?.id || "");
  }

  function textOf(item) {
    try { return JSON.stringify(item).toLowerCase(); } catch { return ""; }
  }

  function singleAvatarCatalog(data) {
    const items = Array.isArray(data?.items) ? data.items : [];
    if (!items.length) return data;

    const preferred = String(CONFIG.fixedAvatarId || "cc006_male_finance");
    let chosen = items.find((item) => idOf(item) === preferred);
    if (!chosen) {
      chosen = items
        .map((item) => {
          const text = textOf(item);
          let score = 0;
          for (const term of ["male", "man", "adult", "business", "finance", "professional", "executive", "formal", "suit"]) if (text.includes(term)) score += 2;
          for (const term of ["female", "child", "kid", "cute", "anime", "cartoon", "mascot"]) if (text.includes(term)) score -= 3;
          return { item, score };
        })
        .sort((a, b) => b.score - a.score)[0]?.item || items[0];
    }

    // Persist only a REAL catalog ID. This keeps ScamShield single-character
    // while preventing a guessed/synthetic ID from poisoning Presenter init.
    try { localStorage.setItem("scamshield.product.avatar", idOf(chosen)); } catch {}
    return { ...data, items: [chosen] };
  }

  window.fetch = function lowLatencyFetch(input, init) {
    const url = typeof input === "string" ? input : input?.url;
    const method = String(init?.method || input?.method || "GET").toUpperCase();
    if (method === "GET" && memory.has(url)) {
      return memory.get(url).then((data) => {
        const shaped = url === catalogUrl(AVATAR_PATH) ? singleAvatarCatalog(data) : data;
        return responseFrom(shaped);
      }).catch(() => nativeFetch(input, init));
    }
    return nativeFetch(input, init);
  };

  document.addEventListener("pointerdown", (event) => {
    if (!event.target.closest?.("#startBtn,#briefingStartBtn,#dockStartBtn,#replayBtn")) return;
    const presenter = document.querySelector("#presenter");
    try {
      const result = presenter?.resumeAudioPlayback?.();
      result?.catch?.(() => {});
    } catch {}
  }, true);
})();
