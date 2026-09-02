/* ScamShield browser compatibility layer.
 * Perxona Presenter currently relies on AbortSignal.any(), which is missing in
 * the Chrome 114 build used by this hackathon device. Load this file before
 * app.js and before the Presenter SDK is imported.
 */
(() => {
  if (typeof AbortController === "undefined" || typeof AbortSignal === "undefined") {
    return;
  }

  if (typeof AbortSignal.any !== "function") {
    Object.defineProperty(AbortSignal, "any", {
      configurable: true,
      writable: true,
      value(signals) {
        const controller = new AbortController();
        const list = Array.from(signals ?? []);
        const listeners = [];

        const cleanup = () => {
          for (const [signal, listener] of listeners) {
            signal.removeEventListener("abort", listener);
          }
          listeners.length = 0;
        };

        const abortFrom = (signal) => {
          if (controller.signal.aborted) return;
          cleanup();
          try {
            controller.abort(signal?.reason);
          } catch {
            controller.abort();
          }
        };

        for (const signal of list) {
          if (!(signal instanceof AbortSignal)) {
            throw new TypeError("AbortSignal.any expects AbortSignal values");
          }
          if (signal.aborted) {
            abortFrom(signal);
            return controller.signal;
          }
          const listener = () => abortFrom(signal);
          listeners.push([signal, listener]);
          signal.addEventListener("abort", listener, { once: true });
        }

        return controller.signal;
      }
    });
  }

  if (typeof AbortSignal.timeout !== "function") {
    Object.defineProperty(AbortSignal, "timeout", {
      configurable: true,
      writable: true,
      value(milliseconds) {
        const controller = new AbortController();
        const delay = Math.max(0, Number(milliseconds) || 0);
        setTimeout(() => {
          try {
            controller.abort(new DOMException("The operation timed out", "TimeoutError"));
          } catch {
            controller.abort();
          }
        }, delay);
        return controller.signal;
      }
    });
  }
})();
