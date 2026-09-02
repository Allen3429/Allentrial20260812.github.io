(() => {
  "use strict";

  const ROUND_LIMIT_MS = 12000;
  const FAST_MS = 3500;
  const GOOD_MS = 6500;
  const STORAGE_KEY = "scamshield.speed.latest";

  let roundStartedAt = 0;
  let ticking = 0;
  let observedRound = "";
  let stats = { totalMs: 0, count: 0, fast: 0, timeouts: 0, score: 0 };

  const $ = (s) => document.querySelector(s);

  function ensureHud() {
    if ($("#speedHud")) return;
    const decision = $(".decision-card");
    const speaker = $(".speaker-box");
    if (!decision || !speaker) return;
    const hud = document.createElement("div");
    hud.id = "speedHud";
    hud.className = "speed-hud";
    hud.innerHTML = '<strong>DECISION SPEED</strong><div class="speed-track"><i id="speedBar"></i></div><b id="speedClock">12.0s</b><small id="speedHint">語音結束後開始計分：越快做出安全判斷，Speed Score 越高。</small>';
    speaker.insertAdjacentElement("afterend", hud);
  }

  function currentRoundId() {
    return `${$("#roundEyebrow")?.textContent || ""}|${$("#roundTitle")?.textContent || ""}`;
  }

  function stopTimer() {
    if (ticking) cancelAnimationFrame(ticking);
    ticking = 0;
  }

  function updateClock() {
    if (!roundStartedAt) return;
    const elapsed = performance.now() - roundStartedAt;
    const left = Math.max(0, ROUND_LIMIT_MS - elapsed);
    const ratio = left / ROUND_LIMIT_MS;
    const bar = $("#speedBar");
    const clock = $("#speedClock");
    const hud = $("#speedHud");
    if (bar) bar.style.transform = `scaleX(${ratio})`;
    if (clock) clock.textContent = `${(left / 1000).toFixed(1)}s`;
    hud?.classList.toggle("is-hot", left <= 4000);
    if (left <= 0) {
      stopTimer();
      stats.timeouts += 1;
      return;
    }
    ticking = requestAnimationFrame(updateClock);
  }

  function startDecisionClock() {
    ensureHud();
    stopTimer();
    roundStartedAt = performance.now();
    const bar = $("#speedBar");
    if (bar) bar.style.transform = "scaleX(1)";
    $("#speedHud")?.classList.remove("is-hot");
    ticking = requestAnimationFrame(updateClock);
  }

  function scoreReaction(ms, choiceButton) {
    const safeText = choiceButton?.querySelector("span")?.textContent || "";
    const looksSafe = /拒絕|掛斷|回撥|正式|獨立|雙人|雙簽|自行|官方|停止|聯絡|驗證|覆核/.test(safeText);
    let points = 0;
    if (ms <= FAST_MS) points = looksSafe ? 12 : -8;
    else if (ms <= GOOD_MS) points = looksSafe ? 8 : -10;
    else if (ms <= ROUND_LIMIT_MS) points = looksSafe ? 3 : -12;
    else points = looksSafe ? -2 : -15;

    stats.totalMs += ms;
    stats.count += 1;
    if (ms <= FAST_MS) stats.fast += 1;
    stats.score += points;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stats));

    const hint = $("#speedHint");
    if (hint) {
      const sec = (ms / 1000).toFixed(1);
      hint.innerHTML = `反應 ${sec}s · Speed ${points >= 0 ? "+" : ""}${points} · <b>${looksSafe ? "安全判斷" : "高風險判斷"}</b>`;
    }
    return points;
  }

  function augmentDisplayedScore(points) {
    const score = $("#scoreValue");
    if (!score) return;
    const base = Number(score.textContent) || 0;
    score.textContent = String(Math.max(0, base + points));
  }

  function adjustFinalScore() {
    const final = $("#finalScore");
    const copy = $("#resultCopy");
    if (!final || !copy || !stats.count) return;
    if (final.dataset.speedAdjusted === "1") return;
    final.dataset.speedAdjusted = "1";
    const avg = stats.totalMs / stats.count;
    const normalizedSpeed = Math.max(0, Math.min(100, Math.round(100 - (avg / ROUND_LIMIT_MS) * 100)));
    const base = Number(final.textContent) || 0;
    const composite = Math.max(0, Math.min(100, Math.round(base * 0.8 + normalizedSpeed * 0.2)));
    final.textContent = String(composite);
    copy.textContent += ` 平均決策時間 ${(avg / 1000).toFixed(1)} 秒；Speed Score ${normalizedSpeed}/100。`;
  }

  function bindChoice(button) {
    if (button.dataset.speedBound === "1") return;
    button.dataset.speedBound = "1";
    button.addEventListener("click", () => {
      if (!roundStartedAt) return;
      const ms = performance.now() - roundStartedAt;
      roundStartedAt = 0;
      stopTimer();
      const points = scoreReaction(ms, button);
      setTimeout(() => augmentDisplayedScore(points), 0);
    }, true);
  }

  function scan() {
    ensureHud();
    const round = currentRoundId();
    const choices = [...document.querySelectorAll("#choiceArea .choice-button")];
    if (choices.length && round !== observedRound) {
      observedRound = round;
      startDecisionClock();
    }
    choices.forEach(bindChoice);
    if ($("#resultDialog")?.open) adjustFinalScore();
  }

  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["open", "hidden"] });
  document.addEventListener("click", (event) => {
    if (event.target.closest("#startBtn,#replayBtn")) {
      stats = { totalMs: 0, count: 0, fast: 0, timeouts: 0, score: 0 };
      sessionStorage.removeItem(STORAGE_KEY);
      observedRound = "";
    }
  }, true);
  scan();
})();
