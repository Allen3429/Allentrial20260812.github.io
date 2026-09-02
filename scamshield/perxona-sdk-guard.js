/*
 * ScamShield lifecycle adapter for the Perxona Presenter SDK.
 *
 * Perxona readiness is event-driven: the product becomes usable when the
 * presenter emits PRESENTER_STATUS: Ready. Some Presenter builds can emit
 * that real Ready event while initializeWithConnectKey() itself remains
 * pending. ScamShield must not keep the customer blocked in that case.
 *
 * This adapter therefore:
 *   - normalizes PRESENTER_STATUS event shapes;
 *   - resolves the wrapped initialization as soon as either the upstream
 *     initialize promise resolves OR a real Ready event arrives;
 *   - never fabricates a Ready event from a resolved promise;
 *   - preserves key rejection and renderer resize handling.
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
        let settled = false;
        let cleanupTimer = 0;
        let resolveReady;
        let rejectKey;

        const realReady = new Promise((resolve) => {
          resolveReady = resolve;
        });
        const keyRejected = new Promise((_, reject) => {
          rejectKey = reject;
        });

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

          // Some Presenter versions expose e.detail as a bare status string.
          // Product code consumes e.detail.status, so normalize that shape once.
          if (typeof event.detail === "string" && !event.detail?.__scamShieldNormalized) {
            emitNormalizedStatus(element, status, "status-shape-normalizer");
          }

          if (status === READY) {
            nudgeRenderer(element);
            resolveReady?.({ source: "PRESENTER_STATUS", status: READY });
          }
        }

        function onRejected() {
          rejectKey?.(new Error(
            "Perxona Publishable Connect Key 被拒絕，請檢查 allowed domain 或方案狀態。"
          ));
        }

        element.addEventListener(STATUS_EVENT, onStatus);
        element.addEventListener("CONNECT_KEY_REJECTED", onRejected);

        let initialization;
        try {
          initialization = Promise.resolve(
            originalInitialize.call(element, connectKey, target)
          );
        } catch (error) {
          cleanup();
          return Promise.reject(error);
        }

        // Critical behavior: if the SDK emits a genuine Ready event before its
        // initialization promise settles, release ScamShield immediately.
        // product.js independently waits for the same Ready event, so this does
        // not weaken the application's readiness gate or invent readiness.
        const completion = Promise.race([
          initialization,
          realReady,
          keyRejected
        ]);

        cleanupTimer = setTimeout(cleanup, 120000);

        return completion.then((value) => {
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
