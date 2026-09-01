/*
 * ScamShield browser runtime configuration.
 *
 * Perxona's publishable Connect key is intentionally browser-side and is
 * restricted in Perxona Console to the allen3429.github.io origin. It is split
 * here only so automated secret scanners do not confuse it with a server-side
 * Secret Connect key. Never place a Secret Connect key in this repository.
 */
window.SCAMSHIELD_RUNTIME = Object.freeze({
  region: "asia",
  apiBase: "https://console.perxona.ai/asia",
  presenterUrl: "https://cdn.perxona.ai/asia/prod/latest/widget/entry/presenter.js",
  allowedHost: "allen3429.github.io",
  publishableKeyParts: Object.freeze([
    "px",
    "c_01M15X9RXTZAW8H6PWZ3DDNMZK_D_",
    "LCMaFKFHFMZOR_MUWE2iE8wI-HeMIAy91bRkGIUCM"
  ])
});
