(() => {
  "use strict";

  const host = document.querySelector("#presenterHost");
  const homeTarget = document.querySelector("#presenterHomeSlot");
  const stageTarget = document.querySelector("#avatarStage");
  const landing = document.querySelector("#landingPanel");
  const training = document.querySelector("#trainingPanel");
  if (!host || !homeTarget || !stageTarget || !landing || !training) return;

  let frame = 0;
  let currentTarget = homeTarget;

  function targetForCurrentView() {
    if (!training.hidden) return stageTarget;
    return homeTarget;
  }

  function positionNow() {
    frame = 0;
    currentTarget = targetForCurrentView();
    const rect = currentTarget.getBoundingClientRect();
    const visible = rect.width > 8 && rect.height > 8 && rect.bottom > 0 && rect.top < innerHeight;
    if (!visible) {
      host.classList.remove("is-positioned");
      return;
    }
    host.style.transform = `translate3d(${Math.round(rect.left)}px,${Math.round(rect.top)}px,0)`;
    host.style.width = `${Math.round(rect.width)}px`;
    host.style.height = `${Math.round(rect.height)}px`;
    host.style.borderRadius = getComputedStyle(currentTarget).borderRadius || "18px";
    host.classList.add("is-positioned");
  }

  function schedulePosition() {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(positionNow);
  }

  new MutationObserver(schedulePosition).observe(landing, {
    attributes: true,
    attributeFilter: ["hidden", "class", "style"]
  });
  new MutationObserver(schedulePosition).observe(training, {
    attributes: true,
    attributeFilter: ["hidden", "class", "style"]
  });

  const resizeObserver = new ResizeObserver(schedulePosition);
  resizeObserver.observe(homeTarget);
  resizeObserver.observe(stageTarget);

  addEventListener("resize", schedulePosition, { passive: true });
  addEventListener("scroll", schedulePosition, { passive: true });
  document.addEventListener("click", (event) => {
    if (event.target.closest?.("#startBtn,#replayBtn,#exitBtn,#homeBtn,#checkpointBtn")) {
      requestAnimationFrame(schedulePosition);
      setTimeout(schedulePosition, 60);
      setTimeout(schedulePosition, 220);
    }
  }, true);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) schedulePosition();
  });

  positionNow();
})();
