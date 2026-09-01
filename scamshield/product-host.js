(() => {
  "use strict";
  const host = document.querySelector("#presenterHost");
  const home = document.querySelector("#presenterHomeSlot");
  const stage = document.querySelector("#avatarStage");
  const landing = document.querySelector("#landingPanel");
  const training = document.querySelector("#trainingPanel");
  if (!host || !home || !stage || !landing || !training) return;

  const sync = () => {
    if (!training.hidden && host.parentElement !== stage) stage.prepend(host);
    else if (!landing.hidden && host.parentElement !== home) home.append(host);
  };

  new MutationObserver(sync).observe(landing, { attributes: true, attributeFilter: ["hidden"] });
  new MutationObserver(sync).observe(training, { attributes: true, attributeFilter: ["hidden"] });
  document.addEventListener("click", (event) => {
    if (event.target.closest?.("#startBtn,#replayBtn")) stage.prepend(host);
    if (event.target.closest?.("#exitBtn,#homeBtn")) home.append(host);
  }, true);
  sync();
})();
