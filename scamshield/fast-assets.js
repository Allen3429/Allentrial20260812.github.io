(() => {
  "use strict";

  const cfg = window.SCAMSHIELD_CONFIG;
  if (!cfg?.apiBase || !cfg?.fixedAvatarId || typeof window.fetch !== "function") return;

  const realFetch = window.fetch.bind(window);
  const PREFIX = cfg.apiBase + "/api/v1/connect/assets/";
  const CACHE_KEY = "scamshield.perxona.assets.v1";
  const TTL = 24 * 60 * 60 * 1000;

  function jsonResponse(data) {
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  function readCache() {
    try {
      const data = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (!data || Date.now() - data.savedAt > TTL) return null;
      return data;
    } catch {
      return null;
    }
  }

  function writePart(kind, payload) {
    try {
      const current = readCache() || { savedAt: Date.now() };
      current.savedAt = Date.now();
      current[kind] = payload;
      localStorage.setItem(CACHE_KEY, JSON.stringify(current));
    } catch {}
  }

  window.fetch = async function(input, init) {
    const url = typeof input === "string" ? input : input?.url || "";

    // Avatar is a verified, fixed Perxona asset. Avoid a catalog round trip entirely.
    if (url.startsWith(PREFIX + "avatars")) {
      return jsonResponse({
        items: [{ avatar_id: cfg.fixedAvatarId, id: cfg.fixedAvatarId }],
        total: 1,
        page: 1,
        size: 1
      });
    }

    const kind = url.startsWith(PREFIX + "scenes") ? "scenes" :
      url.startsWith(PREFIX + "voices") ? "voices" : null;

    if (!kind) return realFetch(input, init);

    const cached = readCache()?.[kind];
    if (cached?.items?.length) return jsonResponse(cached);

    const response = await realFetch(input, init);
    if (response.ok) {
      response.clone().json().then(data => {
        if (data?.items?.length) writePart(kind, data);
      }).catch(() => {});
    }
    return response;
  };
})();
