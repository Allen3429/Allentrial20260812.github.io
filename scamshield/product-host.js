(() => {
  "use strict";

  const host = document.querySelector("#presenterHost");
  const homeTarget = document.querySelector("#presenterHomeSlot");
  const stageTarget = document.querySelector("#avatarStage");
  const landing = document.querySelector("#landingPanel");
  const training = document.querySelector("#trainingPanel");
  if (!host || !homeTarget || !stageTarget || !landing || !training) return;

  let frame = 0;
  let retryFrame = 0;
  let lastRect = null;

  function targetForCurrentView() {
    return !training.hidden ? stageTarget : homeTarget;
  }

  function applyRect(target, rect) {
    lastRect = rect;
    host.style.transform = `translate3d(${Math.round(rect.left)}px,${Math.round(rect.top)}px,0)`;
    host.style.width = `${Math.max(1, Math.round(rect.width))}px`;
    host.style.height = `${Math.max(1, Math.round(rect.height))}px`;
    host.style.borderRadius = getComputedStyle(target).borderRadius || "18px";
    host.classList.add("is-positioned");
  }

  function positionNow() {
    frame = 0;
    const target = targetForCurrentView();
    const rect = target.getBoundingClientRect();

    // Size, not viewport intersection, is what matters to the WebGL presenter.
    // Keeping real dimensions while the target is offscreen prevents the SDK
    // from being initialized into a 1x1 surface and stalling at Initializing.
    if (rect.width > 8 && rect.height > 8) {
      applyRect(target, rect);
      return;
    }

    // During landing -> training swaps there can be a brief zero-size frame.
    // Never collapse the already-running Presenter; keep the previous geometry
    // and try again on the next two paints.
    if (lastRect) host.classList.add("is-positioned");
    if (!retryFrame) {
      retryFrame = requestAnimationFrame(() => {
        retryFrame = 0;
        requestAnimationFrame(schedulePosition);
      });
    }
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
    if (event.target.closest?.("#startBtn,#briefingStartBtn,#dockStartBtn,#replayBtn,#exitBtn,#homeBtn,#checkpointBtn")) {
      schedulePosition();
      setTimeout(schedulePosition, 40);
      setTimeout(schedulePosition, 140);
      setTimeout(schedulePosition, 360);
    }
  }, true);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      schedulePosition();
      setTimeout(schedulePosition, 100);
    }
  });

  // Establish a real-size surface before product.js starts initialization.
  positionNow();
  requestAnimationFrame(schedulePosition);
})();
