(() => {
  "use strict";

  const CONFIG = window.SCAMSHIELD_CONFIG;
  if (!CONFIG?.publishableConnectKey || !CONFIG?.apiBase) return;

  const nativeFetch = window.fetch.bind(window);
  const CATALOG_TTL_MS = 5 * 60 * 1000;
  const exactCatalogPaths = [
    "/api/v1/connect/assets/avatars?page=1&size=100",
    "/api/v1/connect/assets/scenes?page=1&size=100",
    "/api/v1/connect/voices?page=1&size=100"
  ];
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
    try {
      sessionStorage.setItem(storageKey(url), JSON.stringify({ time: Date.now(), data }));
    } catch {}
  }

  function responseFrom(data) {
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  function catalogUrl(path) {
    return `${CONFIG.apiBase}${path}`;
  }

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

  window.fetch = function lowLatencyFetch(input, init) {
    const url = typeof input === "string" ? input : input?.url;
    const method = String(init?.method || input?.method || "GET").toUpperCase();
    if (method === "GET" && memory.has(url)) {
      return memory.get(url)
        .then((data) => responseFrom(data))
        .catch(() => nativeFetch(input, init));
    }
    return nativeFetch(input, init);
  };

  // AudioContext unlock must happen inside a user gesture. Do it on pointerdown,
  // before page transitions or round rendering consume that gesture.
  document.addEventListener("pointerdown", (event) => {
    if (!event.target.closest?.("#startBtn,#briefingStartBtn,#dockStartBtn,#replayBtn")) return;
    const presenter = document.querySelector("#presenter");
    try {
      const result = presenter?.resumeAudioPlayback?.();
      result?.catch?.(() => {});
    } catch {}
  }, true);
})();
