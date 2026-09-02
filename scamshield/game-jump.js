(() => {
  "use strict";

  const training = document.querySelector("#trainingPanel");
  if (!training) return;

  let wasActive = !training.hidden;

  function jumpToGame() {
    if (training.hidden) return;
    const header = document.querySelector(".site-header");
    const headerHeight = header?.getBoundingClientRect().height || 72;
    const top = Math.max(0, Math.round(training.getBoundingClientRect().top + window.scrollY - headerHeight - 10));

    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, top);
    requestAnimationFrame(() => {
      window.scrollTo(0, Math.max(0, Math.round(training.getBoundingClientRect().top + window.scrollY - headerHeight - 10)));
      root.style.scrollBehavior = previousBehavior;
    });
  }

  const observer = new MutationObserver(() => {
    const active = !training.hidden;
    if (active && !wasActive) {
      requestAnimationFrame(() => requestAnimationFrame(jumpToGame));
    }
    wasActive = active;
  });

  observer.observe(training, { attributes: true, attributeFilter: ["hidden"] });
})();
