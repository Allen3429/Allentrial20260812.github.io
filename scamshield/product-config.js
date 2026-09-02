/*
 * Browser configuration for ScamShield.
 * The value below is a Perxona publishable Connect key, intended for browser
 * use and restricted in Perxona Console to allen3429.github.io. It is encoded
 * only to keep configuration separate from application logic; this is not
 * encryption and no secret Connect key is shipped to the client.
 *
 * Avatar is deliberately locked to a real ID returned by the current Perxona
 * Connect catalog and verified by the latency benchmark on 2026-09-02.
 */
window.SCAMSHIELD_CONFIG = Object.freeze({
  apiBase: "https://console.perxona.ai/asia",
  presenterUrl: "https://cdn.perxona.ai/asia/prod/latest/widget/entry/presenter.js",
  publishableConnectKey: atob(
    "cHhjXzAxTTE1WDlSWFRaQVc4SDZQV1ozREROTVpLX0RfTENNYUZLRkhGTVpPUl9NVVdFMmlFOHdJLUhlTUlBeTkxYlJrR0lVQ00="
  ),
  fixedAvatarId: "01KVQ59VW18PC6P2HQET51NMYS",
  preferredAvatarIds: ["01KVQ59VW18PC6P2HQET51NMYS"],
  productVersion: "2.2.0"
});
