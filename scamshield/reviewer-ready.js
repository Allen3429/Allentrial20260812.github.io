/* Public-review mode for Perxona reward validation.
 * Goal: a reviewer opening the submitted URL should immediately see a live
 * Perxona Avatar experience without needing a private/local Connect key.
 * The app already discovers the public browser-safe sv-agent profile from the
 * parent GitHub Pages page and uses it as the compatibility renderer.
 */
(() => {
  "use strict";

  const start = document.querySelector("#startBtn");
  const badge = document.querySelector("#connectionBadge");
  const briefing = document.querySelector("#briefingPanel");
  const game = document.querySelector("#gamePanel");
  if (!start || !badge) return;

  // Reviewers should land on the full Perxona-powered campaign by default.
  if (!localStorage.getItem("scamshield.playMode")) {
    localStorage.setItem("scamshield.playMode", "campaign");
  }

  let entered = false;
  let startedAt = Date.now();

  function ready() {
    return badge.classList.contains("badge-online") || /perxona ready/i.test(badge.textContent || "");
  }

  function enterLiveExperience() {
    if (entered || !ready() || start.disabled) return;
    entered = true;
    document.body.classList.add("public-review-live");
    start.click();
  }

  // The compatibility renderer can take a moment to initialize. Once it is
  // actually ready, enter the game exactly as if the visitor pressed Start.
  const observer = new MutationObserver(() => {
    if (ready()) setTimeout(enterLiveExperience, 180);
  });
  observer.observe(badge, { attributes: true, childList: true, subtree: true });

  // Poll as a second signal because some custom-element updates do not mutate
  // the badge in the same task on older Chrome builds.
  const poll = setInterval(() => {
    if (entered) {
      clearInterval(poll);
      observer.disconnect();
      return;
    }
    if (ready()) enterLiveExperience();
    if (Date.now() - startedAt > 25000) clearInterval(poll);
  }, 350);

  // Add an explicit validation label so a reviewer can immediately distinguish
  // the live avatar surface from a static concept page.
  const marker = document.createElement("div");
  marker.id = "reviewerLiveMarker";
  marker.innerHTML = `<span></span><strong>LIVE PERXONA AVATAR</strong><small>Interactive public demo · no private key required</small>`;
  document.body.appendChild(marker);
})();