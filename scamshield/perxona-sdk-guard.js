/*
 * ScamShield lifecycle + warm-start adapter for the Perxona Presenter SDK.
 * A REAL PRESENTER_STATUS: Ready event unlocks immediately. No synthetic Ready.
 * After one successful load, the last-known-good avatar/scene/voice target is
 * reused on the next visit so the Presenter can boot before catalog reads.
 */
(() => {
  "use strict";

  const CONFIG = window.SCAMSHIELD_CONFIG;
  const STATUS_EVENT = "PRESENTER_STATUS";
  const READY = "Ready";
  const INIT_TIMEOUT_MS = 44000;
  const PRESENT_TIMEOUT_MS = 12000;
  const MOTION_TIMEOUT_MS = 6000;
  const FAST_TARGET_KEY = "scamshield.perxona.fastTarget.v1";

  function readStatus(event) {
    const detail = event?.detail;
    if (typeof detail === "string") return detail;
    return String(detail?.status || detail?.state || detail?.value || "");
  }

  function normalizeTarget(target) {
    return {
      avatarId: String(target?.avatarId || ""),
      sceneId: String(target?.sceneId || ""),
      voiceId: String(target?.voiceId || "")
    };
  }

  function targetKey(target) {
    const t = normalizeTarget(target);
    return `${t.avatarId}|${t.sceneId}|${t.voiceId}`;
  }

  function validTarget(target) {
    const t = normalizeTarget(target);
    return Boolean(t.avatarId && t.sceneId && t.voiceId);
  }

  function saveFastTarget(target) {
    if (!validTarget(target)) return;
    try { localStorage.setItem(FAST_TARGET_KEY, JSON.stringify(normalizeTarget(target))); } catch {}
  }

  function clearFastTarget() {
    try { localStorage.removeItem(FAST_TARGET_KEY); } catch {}
  }

  function loadFastTarget() {
    try {
      const parsed = JSON.parse(localStorage.getItem(FAST_TARGET_KEY) || "null");
      return validTarget(parsed) ? normalizeTarget(parsed) : null;
    } catch {
      clearFastTarget();
      return null;
    }
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

  if (!customElements.get("sv-presenter") && CONFIG?.presenterUrl) {
    const existing = document.querySelector('script[data-perxona-presenter="1"]');
    if (!existing) {
      const script = document.createElement("script");
      script.type = "module";
      script.src = CONFIG.presenterUrl;
      script.dataset.perxonaPresenter = "1";
      document.head.appendChild(script);
    }
  }

  customElements.whenDefined("sv-presenter").then(() => {
    const Presenter = customElements.get("sv-presenter");
    const prototype = Presenter?.prototype;
    if (!prototype || prototype.__scamShieldLifecycleV24) return;
    Object.defineProperty(prototype, "__scamShieldLifecycleV24", { value: true });

    const originalInitialize = prototype.initializeWithConnectKey;
    const originalPresent = prototype.present;
    const originalPlayMotion = prototype.playMotion;
    const originalInterrupt = prototype.interruptPresentation;

    if (typeof originalInitialize === "function") {
      prototype.initializeWithConnectKey = function resilientInitialize(connectKey, target) {
        const element = this;
        const key = targetKey(target);

        if (key && element.__scamShieldReadyTargetKey === key) return Promise.resolve();
        if (key && element.__scamShieldInitializingTargetKey === key && element.__scamShieldInitPromise) {
          return element.__scamShieldInitPromise;
        }

        const promise = new Promise((resolve, reject) => {
          let settled = false;
          let timer = 0;
          let lastStatus = "";

          const cleanup = () => {
            clearTimeout(timer);
            element.removeEventListener(STATUS_EVENT, onStatus);
            element.removeEventListener("CONNECT_KEY_REJECTED", onRejected);
          };
          const finishReady = () => {
            if (settled) return;
            settled = true;
            cleanup();
            element.__scamShieldReadyTargetKey = key;
            element.__scamShieldInitializingTargetKey = "";
            element.__scamShieldInitPromise = null;
            saveFastTarget(target);
            nudgeRenderer(element);
            resolve();
          };
          const fail = (error) => {
            if (settled) return;
            settled = true;
            cleanup();
            element.__scamShieldInitializingTargetKey = "";
            element.__scamShieldInitPromise = null;
            // If a formerly successful target is rejected later (asset removed,
            // voice disabled, plan change, etc.), never keep replaying it.
            if (key && targetKey(loadFastTarget()) === key) clearFastTarget();
            reject(error instanceof Error ? error : new Error(String(error)));
          };
          function onStatus(event) {
            const status = readStatus(event);
            if (status) lastStatus = status;
            if (status === READY) finishReady();
          }
          function onRejected() {
            fail(new Error("Perxona Publishable Connect Key 被拒絕，請檢查 allowed domain 或方案狀態。"));
          }

          element.addEventListener(STATUS_EVENT, onStatus);
          element.addEventListener("CONNECT_KEY_REJECTED", onRejected);
          timer = setTimeout(() => {
            fail(new Error(`Perxona Avatar 冷啟動逾時${lastStatus ? `（最後狀態：${lastStatus}）` : ""}。`));
          }, INIT_TIMEOUT_MS);

          try {
            Promise.resolve(originalInitialize.call(element, connectKey, target)).catch((error) => {
              if (!settled) fail(error);
              else console.warn("Perxona initialize rejected after Ready", error);
            });
          } catch (error) {
            fail(error);
          }
        });

        element.__scamShieldInitializingTargetKey = key;
        element.__scamShieldInitPromise = promise;
        return promise;
      };
    }

    prototype.present = function boundedPresent(...args) {
      if (typeof originalPresent !== "function") return Promise.resolve({ success: false, code: "PRESENT_UNAVAILABLE" });
      try {
        return bounded(originalPresent.apply(this, args), PRESENT_TIMEOUT_MS, "Perxona 語音請求超過 12 秒未回應。", () => originalInterrupt?.call(this));
      } catch (error) {
        return Promise.reject(error);
      }
    };

    prototype.playMotion = function boundedMotion(...args) {
      if (typeof originalPlayMotion !== "function") return Promise.resolve({ success: false, code: "MOTION_UNAVAILABLE" });
      try {
        return bounded(originalPlayMotion.apply(this, args), MOTION_TIMEOUT_MS, "Perxona motion timeout").catch((error) => {
          console.warn("Perxona motion skipped", error);
          return { success: false, code: "MOTION_TIMEOUT" };
        });
      } catch (error) {
        return Promise.resolve({ success: false, code: "MOTION_FAILED", message: String(error) });
      }
    };

    prototype.interruptPresentation = function safeInterrupt(...args) {
      try {
        return typeof originalInterrupt === "function" ? originalInterrupt.apply(this, args) : undefined;
      } catch (error) {
        console.warn("Perxona interrupt failed", error);
        return undefined;
      }
    };

    const fastTarget = loadFastTarget();
    if (fastTarget && CONFIG?.publishableConnectKey) {
      setTimeout(() => {
        const element = document.querySelector("#presenter");
        if (!element?.initializeWithConnectKey || element.__scamShieldReadyTargetKey) return;
        element.initializeWithConnectKey(CONFIG.publishableConnectKey, fastTarget).catch((error) => {
          clearFastTarget();
          console.warn("Perxona warm-start discarded; falling back to verified catalog target", error);
        });
      }, 0);
    }
  }).catch((error) => console.warn("Perxona lifecycle adapter could not attach", error));
})();
