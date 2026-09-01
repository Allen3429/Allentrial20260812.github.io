(() => {
  "use strict";

  const STORAGE = {
    briefingSeen: "scamshield.ux.briefing.v2.1",
    firstRoundSeen: "scamshield.ux.first-round.v2.1"
  };

  const SELECTOR = {
    landing: "#landingPanel",
    landingCopy: ".landing-copy",
    modeSwitch: ".mode-switch",
    selectedMode: "[data-mode].is-selected",
    start: "#startBtn",
    badge: "#connectionBadge",
    training: "#trainingPanel",
    avatarStage: "#avatarStage",
    interrupt: "#interruptBtn",
    choices: "#choiceArea",
    roundCount: "#roundCount"
  };

  const state = {
    mounted: false,
    ready: false,
    briefingOpened: false,
    trainingActive: false,
    coachDismissed: sessionStorage.getItem(STORAGE.firstRoundSeen) === "1"
  };

  const $ = (selector, root = document) => root.querySelector(selector);

  function modeDetails() {
    const selected = $(SELECTOR.selectedMode);
    const quick = selected?.dataset.mode === "quick";
    return quick
      ? { name: "快速演練", action: "開始 3 分鐘快速演練", rounds: "4 回合" }
      : { name: "完整闖關", action: "開始第 1 關", rounds: "3 階段 · 12 回合" };
  }

  function buildGuide() {
    const landingCopy = $(SELECTOR.landingCopy);
    const modeSwitch = $(SELECTOR.modeSwitch);
    const start = $(SELECTOR.start);
    const training = $(SELECTOR.training);
    if (!landingCopy || !modeSwitch || !start || !training) return false;

    const guide = document.createElement("section");
    guide.id = "nextStepGuide";
    guide.className = "next-step-guide is-loading";
    guide.setAttribute("aria-live", "polite");
    guide.innerHTML = `
      <div class="next-step-heading">
        <span class="next-step-number">NEXT</span>
        <div>
          <small id="nextStepKicker">正在準備你的模擬通話</small>
          <strong id="nextStepTitle">Avatar 就緒後，這裡會告訴你下一步</strong>
        </div>
      </div>
      <div class="next-step-flow" aria-label="遊戲操作流程">
        <span><b>1</b><em>選擇模式</em></span>
        <i>→</i>
        <span><b>2</b><em>開始通話</em></span>
        <i>→</i>
        <span><b>3</b><em>中斷或回應</em></span>
      </div>`;
    landingCopy.insertBefore(guide, modeSwitch);

    const helperRow = document.createElement("div");
    helperRow.className = "start-helper-row";
    helperRow.innerHTML = `
      <span id="startHelperText">準備完成後，綠色按鈕會亮起。</span>
      <button id="howToPlayBtn" type="button">怎麼玩？</button>`;
    start.insertAdjacentElement("afterend", helperRow);

    const dock = document.createElement("div");
    dock.id = "nextActionDock";
    dock.className = "next-action-dock";
    dock.hidden = true;
    dock.innerHTML = `
      <div>
        <small>AVATAR READY · 下一步</small>
        <strong id="dockTitle">開始第 1 關</strong>
        <span id="dockMeta">完整闖關 · 3 階段 · 12 回合</span>
      </div>
      <button id="dockStartBtn" type="button"><span>開始</span><b>→</b></button>`;
    document.body.appendChild(dock);

    const dialog = document.createElement("dialog");
    dialog.id = "missionBriefingDialog";
    dialog.className = "mission-briefing-dialog";
    dialog.innerHTML = `
      <div class="mission-briefing-card">
        <button id="closeBriefingBtn" class="briefing-close" type="button" aria-label="關閉說明">×</button>
        <p class="mission-kicker">PERXONA AVATAR READY · 下一步</p>
        <h2>接聽第一通可疑視訊，遊戲才正式開始。</h2>
        <p class="mission-copy">每一關只要記得兩個動作，不需要先讀完規則。</p>
        <div class="mission-actions">
          <article>
            <b>1</b>
            <div><strong>聽，或直接中斷</strong><span>Avatar 施壓時，紅色 <em>BREAK THE SPELL</em> 可以立刻停止對話。</span></div>
          </article>
          <article>
            <b>2</b>
            <div><strong>選一個安全回應</strong><span>語音結束後，右側會出現選項；選完即可前往下一關。</span></div>
          </article>
        </div>
        <div class="briefing-mode">
          <span>目前模式</span>
          <strong id="briefingModeName">完整闖關</strong>
          <small id="briefingModeMeta">3 階段 · 12 回合</small>
        </div>
        <button id="briefingStartBtn" class="briefing-start" type="button">
          <span id="briefingStartLabel">開始第 1 關</span><b>→</b>
        </button>
        <button id="briefingQuickBtn" class="briefing-secondary" type="button">改成 3 分鐘快速演練</button>
      </div>`;
    document.body.appendChild(dialog);

    const coach = document.createElement("aside");
    coach.id = "firstRoundCoach";
    coach.className = "first-round-coach";
    coach.hidden = true;
    coach.innerHTML = `
      <span id="coachIcon">1</span>
      <div><small>第一關操作提示</small><strong id="coachTitle">先聽 Avatar 說話</strong><p id="coachText">不想繼續聽時，可以直接按紅色 BREAK THE SPELL。</p></div>
      <button id="coachDismissBtn" type="button" aria-label="關閉操作提示">懂了</button>`;
    training.prepend(coach);

    enhanceStartButton(start);
    bindGuideEvents();
    state.mounted = true;
    return true;
  }

  function enhanceStartButton(start) {
    if (start.querySelector(".start-label-stack")) return;
    const label = start.querySelector(".button-label");
    if (!label) return;
    const stack = document.createElement("span");
    stack.className = "start-label-stack";
    label.before(stack);
    stack.appendChild(label);
    const hint = document.createElement("small");
    hint.id = "startButtonHint";
    hint.textContent = "Avatar 就緒後解鎖";
    stack.appendChild(hint);
  }

  function scrollTrainingIntoView(correctAfterLayout = false) {
    const training = $(SELECTOR.training);
    if (!training || training.hidden) return;

    const headerHeight = $(".site-header")?.getBoundingClientRect().height || 72;
    const targetTop = () => Math.max(
      0,
      Math.round(training.getBoundingClientRect().top + window.scrollY - headerHeight - 12)
    );
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    try {
      window.scrollTo({ top: targetTop(), behavior: reduceMotion ? "auto" : "smooth" });
    } catch {
      window.scrollTo(0, targetTop());
    }

    if (correctAfterLayout) {
      window.setTimeout(() => {
        if (training.hidden) return;
        const correctedTop = targetTop();
        if (Math.abs(window.scrollY - correctedTop) > 24) {
          window.scrollTo(0, correctedTop);
        }
      }, 520);
    }
  }

  function queueTrainingScroll() {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => scrollTrainingIntoView(true));
    });
  }

  function bindGuideEvents() {
    const start = $(SELECTOR.start);
    const dialog = $("#missionBriefingDialog");

    $("#howToPlayBtn")?.addEventListener("click", openBriefing);
    $("#closeBriefingBtn")?.addEventListener("click", () => dialog?.close());
    dialog?.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });

    $("#briefingQuickBtn")?.addEventListener("click", () => {
      document.querySelector('[data-mode="quick"]')?.click();
      updateReadyCopy();
    });

    $("#briefingStartBtn")?.addEventListener("click", () => {
      localStorage.setItem(STORAGE.briefingSeen, "1");
      dialog?.close();
      start?.focus({ preventScroll: true });
      start?.click();
    });

    $("#dockStartBtn")?.addEventListener("click", () => {
      if (localStorage.getItem(STORAGE.briefingSeen) !== "1") openBriefing();
      else start?.click();
    });

    $("#coachDismissBtn")?.addEventListener("click", dismissCoach);

    document.querySelectorAll("[data-mode]").forEach((button) => {
      button.addEventListener("click", () => requestAnimationFrame(updateReadyCopy));
    });

    start?.addEventListener("click", () => {
      try {
        const result = document.querySelector("#presenter")?.interruptPresentation?.();
        result?.catch?.(() => {});
      } catch {}
      window.setTimeout(queueTrainingScroll, 80);
    }, true);

    document.addEventListener("click", (event) => {
      if (event.target.closest(".choice-button")) {
        sessionStorage.setItem(STORAGE.firstRoundSeen, "1");
        setTimeout(dismissCoach, 550);
      }
    }, true);
  }

  function openBriefing() {
    const dialog = $("#missionBriefingDialog");
    if (!dialog || !state.ready || dialog.open) return;
    updateReadyCopy();
    state.briefingOpened = true;
    dialog.showModal();
    requestAnimationFrame(() => $("#briefingStartBtn")?.focus());
  }

  function updateReadyCopy() {
    if (!state.mounted) return;
    const details = modeDetails();
    const guide = $("#nextStepGuide");
    const start = $(SELECTOR.start);
    const ready = Boolean(start && !start.disabled && $(SELECTOR.badge)?.classList.contains("is-ready"));
    state.ready = ready;

    guide?.classList.toggle("is-loading", !ready);
    guide?.classList.toggle("is-ready", ready);

    if (ready) {
      $("#nextStepKicker").textContent = "Avatar 已就緒 · 現在請做這件事";
      $("#nextStepTitle").textContent = `選好模式，按下「${details.action}」`;
      $("#startHelperText").textContent = "進入後：Avatar 說話時可中斷；語音結束後選一個回應。";
      $("#startButtonHint").textContent = "接聽第一通可疑視訊";
      start?.classList.add("is-guided-ready");
      start?.setAttribute("aria-describedby", "startHelperText");
    } else {
      $("#nextStepKicker").textContent = "正在準備你的模擬通話";
      $("#nextStepTitle").textContent = "Avatar 就緒後，這裡會告訴你下一步";
      $("#startHelperText").textContent = "準備完成後，綠色按鈕會亮起。";
      $("#startButtonHint").textContent = "Avatar 就緒後解鎖";
      start?.classList.remove("is-guided-ready");
    }

    $("#dockTitle").textContent = details.action;
    $("#dockMeta").textContent = `${details.name} · ${details.rounds}`;
    $("#briefingModeName").textContent = details.name;
    $("#briefingModeMeta").textContent = details.rounds;
    $("#briefingStartLabel").textContent = details.action;
    $("#briefingQuickBtn").hidden = details.name === "快速演練";

    syncDock();

    const landingVisible = !$(SELECTOR.landing)?.hidden;
    if (ready && landingVisible && !state.briefingOpened && localStorage.getItem(STORAGE.briefingSeen) !== "1") {
      setTimeout(() => {
        if (state.ready && !$(SELECTOR.landing)?.hidden) openBriefing();
      }, 500);
    }
  }

  function syncDock() {
    const dock = $("#nextActionDock");
    const landing = $(SELECTOR.landing);
    if (!dock || !landing) return;
    dock.hidden = !(state.ready && !landing.hidden);
    document.body.classList.toggle("has-next-action-dock", !dock.hidden);
  }

  function clearFocusTargets() {
    document.querySelectorAll(".ux-focus-target").forEach((node) => node.classList.remove("ux-focus-target"));
  }

  function showCoach(kind) {
    if (state.coachDismissed || sessionStorage.getItem(STORAGE.firstRoundSeen) === "1") return;
    const coach = $("#firstRoundCoach");
    if (!coach) return;
    clearFocusTargets();

    if (kind === "speaking") {
      $("#coachIcon").textContent = "1";
      $("#coachTitle").textContent = "先聽 Avatar 說話，或直接中斷";
      $("#coachText").textContent = "對方正在施壓。紅色 BREAK THE SPELL 可以立即停止語音。";
      $(SELECTOR.interrupt)?.classList.add("ux-focus-target");
    } else if (kind === "choosing") {
      $("#coachIcon").textContent = "2";
      $("#coachTitle").textContent = "現在，選一個你會採取的回應";
      $("#coachText").textContent = "右側選項已出現。選完會立即顯示回饋與下一步。";
      $(SELECTOR.choices)?.classList.add("ux-focus-target");
    } else if (kind === "next") {
      $("#coachIcon").textContent = "3";
      $("#coachTitle").textContent = "這一關完成，繼續下一關";
      $("#coachText").textContent = "閱讀回饋後，按下綠色按鈕繼續。";
      $("#nextAction")?.classList.add("ux-focus-target");
    }

    coach.hidden = false;
  }

  function dismissCoach() {
    state.coachDismissed = true;
    sessionStorage.setItem(STORAGE.firstRoundSeen, "1");
    const coach = $("#firstRoundCoach");
    if (coach) coach.hidden = true;
    clearFocusTargets();
  }

  function syncTrainingState() {
    if (!state.mounted) return;
    const landing = $(SELECTOR.landing);
    const training = $(SELECTOR.training);
    if (!landing || !training) return;

    const active = !training.hidden;
    if (active && !state.trainingActive) {
      state.trainingActive = true;
      const dialog = $("#missionBriefingDialog");
      if (dialog?.open) dialog.close();
      document.body.classList.remove("has-next-action-dock");
      const dock = $("#nextActionDock");
      if (dock) dock.hidden = true;
      queueTrainingScroll();
      setTimeout(syncCoachState, 180);
    } else if (!active && state.trainingActive) {
      state.trainingActive = false;
      const coach = $("#firstRoundCoach");
      if (coach) coach.hidden = true;
      clearFocusTargets();
      updateReadyCopy();
    }

    syncDock();
  }

  function syncCoachState() {
    const training = $(SELECTOR.training);
    if (!training || training.hidden || state.coachDismissed) return;
    const round = $(SELECTOR.roundCount)?.textContent?.trim() || "";
    if (round && !round.startsWith("1/")) {
      dismissCoach();
      return;
    }
    if ($(`${SELECTOR.choices} #nextAction`)) showCoach("next");
    else if ($(`${SELECTOR.choices} .choice-button`)) showCoach("choosing");
    else if ($(SELECTOR.avatarStage)?.classList.contains("is-speaking")) showCoach("speaking");
  }

  function observeProduct() {
    const badge = $(SELECTOR.badge);
    const start = $(SELECTOR.start);
    const landing = $(SELECTOR.landing);
    const training = $(SELECTOR.training);
    const avatarStage = $(SELECTOR.avatarStage);
    const choices = $(SELECTOR.choices);

    const readyObserver = new MutationObserver(updateReadyCopy);
    if (badge) readyObserver.observe(badge, { attributes: true, attributeFilter: ["class"], childList: true, subtree: true });
    if (start) readyObserver.observe(start, { attributes: true, attributeFilter: ["disabled"], childList: true, subtree: true });

    const viewObserver = new MutationObserver(() => {
      syncTrainingState();
      syncCoachState();
    });
    if (landing) viewObserver.observe(landing, { attributes: true, attributeFilter: ["hidden"] });
    if (training) viewObserver.observe(training, { attributes: true, attributeFilter: ["hidden"] });
    if (avatarStage) viewObserver.observe(avatarStage, { attributes: true, attributeFilter: ["class"] });
    if (choices) viewObserver.observe(choices, { childList: true, subtree: true });

    window.addEventListener("resize", syncDock, { passive: true });
    updateReadyCopy();
    syncTrainingState();
  }

  function mount() {
    if (state.mounted) return;
    if (!buildGuide()) {
      setTimeout(mount, 80);
      return;
    }
    observeProduct();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
})();
