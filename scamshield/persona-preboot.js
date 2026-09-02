(() => {
  "use strict";
  const PERSONA_VERSION = "impatient-male-v1";
  const versionKey = "scamshield.persona.version";
  if (localStorage.getItem(versionKey) === PERSONA_VERSION) return;
  // ScamShield's default attacker persona is intentionally consistent:
  // a credible adult male business figure, not a cute/obviously-villain avatar.
  localStorage.setItem("scamshield.product.avatar", "cc006_male_finance");
  // Re-run voice ranking so a Mandarin male / lower-pitch / faster profile wins.
  localStorage.removeItem("scamshield.product.voice");
  localStorage.setItem(versionKey, PERSONA_VERSION);
})();
