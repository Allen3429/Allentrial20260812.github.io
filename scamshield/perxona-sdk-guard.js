/*
 * ScamShield resilience layer for the Perxona Presenter SDK.
 *
 * Perxona's own samples make PRESENTER_STATUS: Ready the source of truth.
 * This guard keeps that rule, but prevents an Initializing state from hanging
 * indefinitely on a transient renderer/network stall. It retries the same
 * target once, then rejects early so product.js can move to its alternate
 * avatar/scene/voice fallback instead of making the visitor wait for minutes.
 */
(() => {
  "use strict";

  const WATCHDOG_RETRY_MS = 12000;
  const WATCHDOG_FAIL_MS = 24000;

  customElements.whenDefined("sv-presenter").then(() => {
    const Presenter = customElements.get("sv-presenter");
    const prototype = Presenter?.prototype;
    if (!prototype || prototype.__scamShieldGuarded) return;
    Object.defineProperty(prototype, "__scamShieldGuarded", { value: true });

    const originalInitialize = prototype.initializeWithConnectKey;
    if (typeof originalInitialize === "function") {
      prototype.initializeWithConnectKey = function resilientInitialize(connectKey, target) {
        const element = this;
        let settled = false;
        let retried = false;
        let retryTimer = 0;
        let failTimer = 0;

        const cleanup = () => {
          clearTimeout(retryTimer);
          clearTimeout(failTimer);
          element.removeEventListener("PRESENTER_STATUS", onStatus);
          element.removeEventListener("CONNECT_KEY_REJECTED", onRejected);
        };

        const finish = (resolve, reject, error) => {
          if (settled) return;
          settled = true;
          cleanup();
          error ? reject(error) : resolve();
        };

        const invoke = () => Promise.resolve(originalInitialize.call(element, connectKey, target));

        return new Promise((resolve, reject) => {
          const onReady = () => finish(resolve, reject);

          // Named declarations are assigned before any async callback can run.
          function onStatus(event) {
            const status = String(event.detail?.status || "");
            if (status !== "Ready") return;

            // Mirror the official Connect Kit tool's resize nudge. A Ready
            // presenter can otherwise retain a stale canvas scale after a
            // re-initialization when the host dimensions did not change.
            requestAnimationFrame(() => {
              const previousWidth = element.style.width || "100%";
              element.style.width = "calc(100% - 1px)";
              requestAnimationFrame(() => { element.style.width = previousWidth; });
            });
            onReady();
          }

          function onRejected() {
            finish(resolve, reject, new Error("Perxona Publishable Connect Key 被拒絕，請檢查 allowed domain 或方案狀態。"));
          }

          element.addEventListener("PRESENTER_STATUS", onStatus);
          element.addEventListener("CONNECT_KEY_REJECTED", onRejected);

          invoke().catch((error) => finish(resolve, reject, error));

          retryTimer = setTimeout(() => {
            if (settled || retried) return;
            retried = true;
            console.warn("Perxona Presenter still initializing; retrying the same target once.");
            invoke().catch((error) => {
              // Do not fail on the retry's immediate rejection if the first
              // initialization is still capable of producing Ready; the hard
              // watchdog below remains authoritative.
              console.warn("Perxona Presenter retry rejected", error);
            });
          }, WATCHDOG_RETRY_MS);

          failTimer = setTimeout(() => {
            finish(
              resolve,
              reject,
              new Error("Perxona Avatar 初始化超過 24 秒仍未 Ready；已自動切換備援角色組合。")
            );
          }, WATCHDOG_FAIL_MS);
        });
      };
    }

    const originalPlayMotion = prototype.playMotion;
    prototype.playMotion = function safePlayMotion(...args) {
      try {
        return Promise.resolve(
          typeof originalPlayMotion === "function"
            ? originalPlayMotion.apply(this, args)
            : { success: false, code: "MOTION_UNAVAILABLE" }
        );
      } catch (error) {
        return Promise.reject(error);
      }
    };

    const originalInterrupt = prototype.interruptPresentation;
    prototype.interruptPresentation = function safeInterrupt(...args) {
      try {
        return typeof originalInterrupt === "function"
          ? originalInterrupt.apply(this, args)
          : undefined;
      } catch (error) {
        console.warn("Perxona interrupt failed", error);
        return undefined;
      }
    };
  }).catch((error) => console.warn("Perxona SDK guard could not attach", error));
})();
