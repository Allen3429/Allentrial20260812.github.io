/* Public-review mode for Perxona reward validation.
 * Enter the campaign only after the widget emits the documented
 * `life-status: ready` event. A badge or method existing is not sufficient.
 */
(() => {
  "use strict";

  const start = document.querySelector("#startBtn");
  const briefing = document.querySelector("#briefingPanel");
  const game = document.querySelector("#gamePanel");
  if (!start) return;

  if (!localStorage.getItem("scamshield.playMode")) {
    localStorage.setItem("scamshield.playMode", "campaign");
  }

  let entered = false;

  function ready() {
    return window.SCAMSHIELD_AVATAR_READY === true;
  }

  function enterLiveExperience() {
    if (entered || !ready() || start.disabled) return;
    entered = true;
    document.body.classList.add("public-review-live");
    start.click();
  }

  document.addEventListener("scamshield-avatar-ready", () => {
    setTimeout(enterLiveExperience, 250);
  }, { once: true });

  const poll = setInterval(() => {
    if (entered) return clearInterval(poll);
    if (ready()) enterLiveExperience();
  }, 350);
  setTimeout(() => clearInterval(poll), 45000);

  const marker = document.createElement("div");
  marker.id = "reviewerLiveMarker";
  marker.innerHTML = `<span></span><strong>PERXONA AVATAR CHECK</strong><small id="reviewerMarkerText">Waiting for actual life-status: ready</small>`;
  document.body.appendChild(marker);

  const markerText = marker.querySelector("#reviewerMarkerText");
  document.addEventListener("scamshield-avatar-ready", () => {
    marker.classList.add("verified");
    markerText.textContent = "Verified ready · interactive public demo";
  });

  setTimeout(() => {
    if (!ready()) {
      marker.classList.add("not-ready");
      markerText.textContent = "Avatar not ready yet · campaign remains locked";
    }
  }, 20000);
})();
