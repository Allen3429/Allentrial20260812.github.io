/* Prevent repeated identical option renders from retriggering the casting observer. */
(() => {
  "use strict";
  const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
  if (!descriptor?.get || !descriptor?.set) return;

  const lastAssigned = new WeakMap();
  Object.defineProperty(HTMLSelectElement.prototype, "innerHTML", {
    configurable: true,
    enumerable: descriptor.enumerable,
    get() {
      return descriptor.get.call(this);
    },
    set(value) {
      const text = String(value ?? "");
      const protectedSelect = this.id === "ux2VoiceSelect" || this.id === "uxVoiceSelect";
      if (protectedSelect && lastAssigned.get(this) === text) return;
      if (protectedSelect) lastAssigned.set(this, text);
      descriptor.set.call(this, text);
    }
  });
})();
