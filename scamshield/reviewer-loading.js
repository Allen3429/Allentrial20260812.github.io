/* Turn Perxona initialization into a deliberate call-connection transition. */
(() => {
  "use strict";
  const badge = document.querySelector("#connectionBadge");
  const body = document.body;
  if (!badge || document.querySelector("#reviewerBootOverlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "reviewerBootOverlay";
  overlay.innerHTML = `
    <div class="reviewer-boot-card">
      <div class="reviewer-boot-head">
        <span>SCAMSHIELD · PUBLIC INTERACTIVE DEMO</span>
        <span class="reviewer-boot-live"><i></i> PERXONA LIVE</span>
      </div>
      <div class="reviewer-boot-stage">
        <div class="reviewer-avatar-skeleton"><div class="reviewer-scan"></div></div>
        <div class="reviewer-boot-copy">
          <span>INCOMING IDENTITY CLAIM</span>
          <h2>正在接通模擬來電</h2>
          <p>建立 Perxona 3D Avatar、語音與互動控制。載入完成後會直接進入可操作的防詐演練。</p>
          <div class="reviewer-boot-steps">
            <div class="reviewer-boot-step is-active" data-step="runtime"><i></i>載入 Perxona runtime</div>
            <div class="reviewer-boot-step" data-step="avatar"><i></i>建立 3D Avatar</div>
            <div class="reviewer-boot-step" data-step="call"><i></i>接通互動演練</div>
          </div>
          <p class="reviewer-boot-note">第一次載入可能依網路與 WebGL 初始化速度需要數秒；不需登入或貼金鑰。</p>
        </div>
      </div>
    </div>`;
  body.appendChild(overlay);

  const steps = {
    runtime: overlay.querySelector('[data-step="runtime"]'),
    avatar: overlay.querySelector('[data-step="avatar"]'),
    call: overlay.querySelector('[data-step="call"]')
  };
  const done = (name) => steps[name]?.classList.add("is-done");
  const active = (name) => steps[name]?.classList.add("is-active");
  const started = performance.now();

  // The runtime is already being fetched from <head>; move the perceived state
  // forward without pretending the avatar is ready before the badge confirms it.
  setTimeout(() => { done("runtime"); active("avatar"); }, 650);

  function isReady() {
    return badge.classList.contains("badge-online") || /perxona ready/i.test(badge.textContent || "");
  }
  function finish() {
    if (!isReady() || overlay.classList.contains("is-done")) return;
    done("runtime"); done("avatar"); active("call"); done("call");
    const minVisible = 900;
    const wait = Math.max(0, minVisible - (performance.now() - started));
    setTimeout(() => {
      overlay.classList.add("is-done");
      setTimeout(() => overlay.remove(), 500);
    }, wait);
  }

  const observer = new MutationObserver(finish);
  observer.observe(badge, { attributes:true, childList:true, subtree:true });
  const poll = setInterval(() => {
    if (isReady()) { clearInterval(poll); observer.disconnect(); finish(); }
  }, 180);

  // If loading is unusually slow, keep the screen informative rather than
  // looking frozen. Do not falsely mark the Avatar ready.
  setTimeout(() => {
    if (isReady()) return;
    overlay.querySelector(".reviewer-boot-copy h2").textContent = "正在準備 3D Avatar…";
    overlay.querySelector(".reviewer-boot-note").textContent = "Perxona runtime 已啟動；目前正在等待 3D 資產與 WebGL 完成初始化。";
  }, 5000);
})();