/*
 * ScamShield lifecycle adapter for the Perxona Presenter SDK.
 *
 * The official Connect Kit contract has two useful readiness signals:
 *   1. PRESENTER_STATUS reaches Ready.
 *   2. initializeWithConnectKey() resolves after initialization.
 *
 * Different Presenter builds have emitted PRESENTER_STATUS as either
 * event.detail.status or event.detail. This adapter normalizes both shapes,
 * bridges a resolved initialization back to a Ready event when necessary,
 * and never launches a second initialization while the first is still active.
 */
(() => {
  "use strict";

  const STATUS_EVENT = "PRESENTER_STATUS";
  const READY = "Ready";

  function readStatus(event) {
    const detail = event?.detail;
    if (typeof detail === "string") return detail;
    return String(detail?.status || detail?.state || detail?.value || "");
  }

  function nextPaint() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
  }

  function nudgeRenderer(element) {
    requestAnimationFrame(() => {
      const previousWidth = element.style.width || "100%";
      element.style.width = "calc(100% - 1px)";
      requestAnimationFrame(() => {
        element.style.width = previousWidth;
      });
    });

    try {
      element.updateCameraFOV?.({
        distance: 1,
        vertical: 0,
        horizontal: 4.5
      });
    } catch (error) {
      console.warn("Perxona camera adjustment was unavailable", error);
    }
  }

  function emitNormalizedStatus(element, status, source) {
    element.dispatchEvent(new CustomEvent(STATUS_EVENT, {
      detail: {
        status,
        source,
        __scamShieldNormalized: true
      }
    }));
  }

  customElements.whenDefined("sv-presenter").then(() => {
    const Presenter = customElements.get("sv-presenter");
    const prototype = Presenter?.prototype;
    if (!prototype || prototype.__scamShieldGuarded) return;
    Object.defineProperty(prototype, "__scamShieldGuarded", { value: true });

    const originalInitialize = prototype.initializeWithConnectKey;
    if (typeof originalInitialize === "function") {
      prototype.initializeWithConnectKey = function stableInitialize(connectKey, target) {
        const element = this;
        let sawReady = false;
        let settled = false;
        let cleanupTimer = 0;

        const cleanup = () => {
          if (settled) return;
          settled = true;
          clearTimeout(cleanupTimer);
          element.removeEventListener(STATUS_EVENT, onStatus);
          element.removeEventListener("CONNECT_KEY_REJECTED", onRejected);
        };

        function onStatus(event) {
          const status = readStatus(event);
          if (!status) return;

          // Some Presenter versions expose e.detail as the status string,
          // while product.js consumes e.detail.status. Re-emit one normalized
          // event so both SDK shapes follow the same application lifecycle.
          if (
            typeof event.detail === "string" &&
            !event.detail?.__scamShieldNormalized
          ) {
            emitNormalizedStatus(element, status, "status-shape-normalizer");
          }

          if (status === READY) {
            sawReady = true;
            nudgeRenderer(element);
          }
        }

        let rejectKey;
        const keyRejected = new Promise((_, reject) => {
          rejectKey = reject;
        });

        function onRejected() {
          rejectKey(new Error(
            "Perxona Publishable Connect Key 被拒絕，請檢查 allowed domain 或方案狀態。"
          ));
        }

        element.addEventListener(STATUS_EVENT, onStatus);
        element.addEventListener("CONNECT_KEY_REJECTED", onRejected);

        let initialization;
        try {
          // Exactly one upstream initialization call. Concurrent retries can
          // reset the same WebGL session back to Initializing indefinitely.
          initialization = Promise.resolve(
            originalInitialize.call(element, connectKey, target)
          );
        } catch (error) {
          cleanup();
          return Promise.reject(error);
        }

        cleanupTimer = setTimeout(cleanup, 120000);

        return Promise.race([initialization, keyRejected]).then(async (value) => {
          // Perxona documents a resolved initialize promise as ready. Give the
          // renderer two frames to publish its event; if that event is absent,
          // emit the normalized Ready signal expected by the product UI.
          await nextPaint();
          if (!sawReady && element.isConnected) {
            emitNormalizedStatus(element, READY, "initialize-promise-resolved");
            sawReady = true;
            nudgeRenderer(element);
          }
          cleanup();
          return value;
        }, (error) => {
          cleanup();
          throw error;
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
  }).catch((error) => {
    console.warn("Perxona SDK lifecycle adapter could not attach", error);
  });
})();
