/*
 * Browser configuration for ScamShield.
 * The value below is a Perxona publishable Connect key, intended for browser
 * use and restricted in Perxona Console to allen3429.github.io. It is encoded
 * only to keep configuration separate from application logic; this is not
 * encryption and no secret Connect key is shipped to the client.
 */
window.SCAMSHIELD_CONFIG = Object.freeze({
  apiBase: "https://console.perxona.ai/asia",
  presenterUrl: "https://cdn.perxona.ai/asia/prod/latest/widget/entry/presenter.js",
  publishableConnectKey: atob(
    "cHhjXzAxTTE1WDlSWFRaQVc4SDZQV1ozREROTVpLX0RfTENNYUZLRkhGTVpPUl9NVVdFMmlFOHdJLUhlTUlBeTkxYlJrR0lVQ00="
  ),
  preferredAvatarIds: ["cc006_male_finance"],
  productVersion: "2.0.3"
});
