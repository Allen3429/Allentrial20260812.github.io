/*
 * ScamShield low-latency lifecycle adapter for the Perxona Presenter SDK.
 * A REAL PRESENTER_STATUS: Ready event unlocks immediately. No synthetic Ready.
 */
(() => {
  "use strict";

  const STATUS_EVENT = "PRESENTER_STATUS";
  const READY = "Ready";
  const INIT_TIMEOUT_MS = 20000;
  const PRESENT_TIMEOUT_MS = 12000;
  const MOTION_TIMEOUT_MS = 6000;

  function readStatus(event) {
    const detail = event?.detail;
    if (typeof detail === "string") return detail;
    return String(detail?.status || detail?.state || detail?.value || "");
  }

  function nudgeRenderer(element) {
    try {
      element.style.display = "block";
      const previousWidth = element.style.width || "100%";
      requestAnimationFrame(() => {
        element.style.width = "calc(100% - 1px)";
        requestAnimationFrame(() => { element.style.width = previousWidth; });
      });
      element.updateCameraFOV?.({ distance: 1, vertical: 0, horizontal: 4.5 });
    } catch (error) {
      console.warn("Perxona renderer nudge unavailable", error);
    }
  }

  function bounded(promise, timeoutMs, message, onTimeout) {
    let timer = 0;
    return Promise.race([
      Promise.resolve(promise),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          try { onTimeout?.(); } catch {}
          reject(new Error(message));
        }, timeoutMs);
      })
    ]).finally(() => clearTimeout(timer));
  }

  customElements.whenDefined("sv-presenter").then(() => {
    const Presenter = customElements.get("sv-presenter");
    const prototype = Presenter?.prototype;
    if (!prototype || prototype.__scamShieldLowLatency) return;
    Object.defineProperty(prototype, "__scamShieldLowLatency", { value: true });

    const originalInitialize = prototype.initializeWithConnectKey;
    const originalPresent = prototype.present;
    const originalPlayMotion = prototype.playMotion;
    const originalInterrupt = prototype.interruptPresentation;

    if (typeof originalInitialize === "function") {
      prototype.initializeWithConnectKey = function lowLatencyInitialize(connectKey, target) {
        const element = this;
        return new Promise((resolve, reject) => {
          let settled = false;
          let timer = 0;

          const cleanup = () => {
            clearTimeout(timer);
            element.removeEventListener(STATUS_EVENT, onStatus);
            element.removeEventListener("CONNECT_KEY_REJECTED", onRejected);
          };
          const finishReady = () => {
            if (settled) return;
            settled = true;
            cleanup();
            nudgeRenderer(element);
            resolve();
          };
          const fail = (error) => {
            if (settled) return;
            settled = true;
            cleanup();
            reject(error instanceof Error ? error : new Error(String(error)));
          };
          function onStatus(event) {
            if (readStatus(event) === READY) finishReady();
          }
          function onRejected() {
            fail(new Error("Perxona Publishable Connect Key 被拒絕，請檢查 allowed domain 或方案狀態。"));
          }

          element.addEventListener(STATUS_EVENT, onStatus);
          element.addEventListener("CONNECT_KEY_REJECTED", onRejected);
          timer = setTimeout(() => {
            try { originalInterrupt?.call(element); } catch {}
            fail(new Error("Perxona Avatar 20 秒內未 Ready，已停止等待並可重新連線。"));
          }, INIT_TIMEOUT_MS);

          try {
            // Resolution alone is not treated as Ready. A rejection before real
            // Ready is still surfaced immediately. If Ready arrives first, this
            // upstream promise may finish later without blocking the product.
            Promise.resolve(originalInitialize.call(element, connectKey, target)).catch((error) => {
              if (!settled) fail(error);
              else console.warn("Perxona initialize rejected after Ready", error);
            });
          } catch (error) {
            fail(error);
          }
        });
      };
    }

    prototype.present = function boundedPresent(...args) {
      if (typeof originalPresent !== "function") {
        return Promise.resolve({ success: false, code: "PRESENT_UNAVAILABLE" });
      }
      try {
        return bounded(
          originalPresent.apply(this, args),
          PRESENT_TIMEOUT_MS,
          "Perxona 語音請求超過 12 秒未回應。",
          () => originalInterrupt?.call(this)
        );
      } catch (error) {
        return Promise.reject(error);
      }
    };

    prototype.playMotion = function boundedMotion(...args) {
      if (typeof originalPlayMotion !== "function") {
        return Promise.resolve({ success: false, code: "MOTION_UNAVAILABLE" });
      }
      try {
        return bounded(
          originalPlayMotion.apply(this, args),
          MOTION_TIMEOUT_MS,
          "Perxona motion timeout"
        ).catch((error) => {
          console.warn("Perxona motion skipped", error);
          return { success: false, code: "MOTION_TIMEOUT" };
        });
      } catch (error) {
        return Promise.resolve({ success: false, code: "MOTION_FAILED", message: String(error) });
      }
    };

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
  }).catch((error) => console.warn("Perxona low-latency adapter could not attach", error));
})();
