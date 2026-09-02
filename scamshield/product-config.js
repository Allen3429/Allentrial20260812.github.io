/*
 * Browser configuration for ScamShield.
 * Publishable Perxona Connect key for browser use, restricted in Perxona Console
 * to allen3429.github.io. No secret Connect key is shipped to the client.
 *
 * The Avatar / Scene / Voice IDs below are the exact target that repeatedly
 * reached PRESENTER_STATUS=Ready in the 2026-09-02 isolated latency benchmark.
 */
window.SCAMSHIELD_CONFIG = Object.freeze({
  apiBase: "https://console.perxona.ai/asia",
  presenterUrl: "https://cdn.perxona.ai/asia/prod/latest/widget/entry/presenter.js",
  publishableConnectKey: atob(
    "cHhjXzAxTTE1WDlSWFRaQVc4SDZQV1ozREROTVpLX0RfTENNYUZLRkhGTVpPUl9NVVdFMmlFOHdJLUhlTUlBeTkxYlJrR0lVQ00="
  ),
  fixedAvatarId: "01KVQ59VW18PC6P2HQET51NMYS",
  fixedSceneId: "01KWVBXE9Q9CZ9FENATQHZYXJV",
  fixedVoiceId: "01KZTVQXDXFSMG1PS0A6NTKVN3",
  preferredAvatarIds: ["01KVQ59VW18PC6P2HQET51NMYS"],
  productVersion: "2.3.0"
});
