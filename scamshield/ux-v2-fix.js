/* Small interaction fixes for the UX v2 casting panel. */
(() => {
  "use strict";
  document.addEventListener("click", (event) => {
    const rateButton = event.target.closest?.("[data-ux2-rate]");
    if (!rateButton) return;
    const panel = rateButton.closest("#ux2ParticipantCasting");
    if (!panel) return;
    const avatarId = panel.dataset.avatarId || panel.querySelector(".ux2-avatar.is-selected")?.dataset.ux2Avatar;
    const voiceId = panel.querySelector("#ux2VoiceSelect")?.value;
    if (avatarId) localStorage.setItem("scamshield.preferredAvatarId", avatarId);
    if (voiceId) localStorage.setItem("scamshield.preferredVoiceId", voiceId);
  }, true);
})();
