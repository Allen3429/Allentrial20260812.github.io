/* Turn Perxona initialization into a deliberate call-connection transition.
 * The overlay closes only after reviewer-stability.js receives life-status: ready.
 */
(() => {
  "use strict";
  const body = document.body;
  if (document.querySelector("#reviewerBootOverlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "reviewerBootOverlay";
  overlay.innerHTML = `
    <div class="reviewer-boot-card">
      <div class="reviewer-boot-head">
        <span>SCAMSHIELD · PUBLIC INTERACTIVE DEMO</span>
        <span class="reviewer-boot-live"><i></i> PERXONA SDK</span>
      </div>
      <div class="reviewer-boot-stage">
        <div class="reviewer-avatar-skeleton"><div class="reviewer-scan"></div></div>
        <div class="reviewer-boot-copy">
          <span>INCOMING IDENTITY CLAIM</span>
          <h2>正在建立 Perxona 3D Avatar</h2>
          <p>只有在 Perxona SDK 明確回報 <b>life-status: ready</b> 後，本站才會解鎖並開始演練。</p>
          <div class="reviewer-boot-steps">
            <div class="reviewer-boot-step is-active" data-step="runtime"><i></i>載入 Perxona runtime</div>
            <div class="reviewer-boot-step" data-step="avatar"><i></i>下載 Avatar / Motion / Scene</div>
            <div class="reviewer-boot-step" data-step="call"><i></i>驗證 Avatar 可操作</div>
          </div>
          <p class="reviewer-boot-note">不會再把元件存在、agentReply 方法存在或 connection-done 誤判成 Avatar 已顯示。</p>
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

  setTimeout(() => { done("runtime"); active("avatar"); }, 650);

  function finish() {
    if (window.SCAMSHIELD_AVATAR_READY !== true || overlay.classList.contains("is-done")) return;
    done("runtime"); done("avatar"); active("call"); done("call");
    const wait = Math.max(0, 850 - (performance.now() - started));
    setTimeout(() => {
      overlay.classList.add("is-done");
      setTimeout(() => overlay.remove(), 500);
    }, wait);
  }

  document.addEventListener("scamshield-avatar-ready", finish, { once: true });
  const poll = setInterval(() => {
    if (window.SCAMSHIELD_AVATAR_READY === true) {
      clearInterval(poll);
      finish();
    }
  }, 180);
  setTimeout(() => clearInterval(poll), 45000);

  setTimeout(() => {
    if (window.SCAMSHIELD_AVATAR_READY === true) return;
    overlay.querySelector(".reviewer-boot-copy h2").textContent = "仍在等待 Perxona Avatar ready…";
    overlay.querySelector(".reviewer-boot-note").textContent = window.SCAMSHIELD_AVATAR_STATUS === "disconnected"
      ? "Perxona 正在重新連線；Campaign 維持鎖定，不會出現假 ready 或空白計時。"
      : "Perxona runtime 已啟動；目前正在等待 3D 資產與 WebGL 完成初始化。";
  }, 6000);
})();
