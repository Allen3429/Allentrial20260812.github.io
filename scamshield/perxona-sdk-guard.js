/* Normalize optional Presenter SDK methods while preserving Perxona's real status events. */
(() => {
  "use strict";

  customElements.whenDefined("sv-presenter").then(() => {
    const Presenter = customElements.get("sv-presenter");
    const prototype = Presenter?.prototype;
    if (!prototype || prototype.__scamShieldGuarded) return;
    Object.defineProperty(prototype, "__scamShieldGuarded", { value: true });

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
