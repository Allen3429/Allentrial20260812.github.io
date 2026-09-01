/* ScamShield reviewer fast boot.
 * Removes one same-origin discovery request and makes the public Perxona SDK
 * start downloading as early as possible. Values below are browser-safe public
 * widget credentials already used by the published GitHub Pages profile.
 */
(() => {
  "use strict";

  const PUBLIC_AGENT = {
    apiKey: "9208afe0-ae4b-4ab6-a26b-0f39519225a4",
    agentProfileId: "01KZTY7DR2FC4AT24YS0YKF1H5"
  };

  window.SCAMSHIELD_PUBLIC_AGENT = PUBLIC_AGENT;

  // app.js historically discovers the public profile by fetching ../index.html.
  // Intercept only that exact request and serve the already-public config from
  // memory, saving a network round trip without changing app.js internals.
  const nativeFetch = window.fetch.bind(window);
  window.fetch = function fastReviewerFetch(input, init) {
    const raw = typeof input === "string" ? input : input?.url || "";
    let url = raw;
    try { url = new URL(raw, location.href).href; } catch {}
    const parent = new URL("../index.html", location.href).href;
    if (url === parent) {
      const html = `<sv-agent agentProfileId="${PUBLIC_AGENT.agentProfileId}" apiKey="${PUBLIC_AGENT.apiKey}"></sv-agent>`;
      return Promise.resolve(new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      }));
    }
    return nativeFetch(input, init);
  };

  document.documentElement.classList.add("reviewer-fastboot");
})();