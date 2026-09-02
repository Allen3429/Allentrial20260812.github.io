import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (name) => fs.readFileSync(new URL(`../${name}`, import.meta.url), "utf8");
const html = read("index.html");
const product = read("product.js");
const guard = read("perxona-sdk-guard.js");
const host = read("product-host.js");
const latency = read("latency-bootstrap.js");
const config = read("product-config.js");
const campaign = read("campaign-data.js");
const onboarding = read("onboarding.js");
const onboardingCss = read("onboarding.css");
const direct = read("direct-avatar.js");
const speed = read("speed-pressure.js");
const persona = read("persona-preboot.js");

const requiredIds = [
  "connectionBadge", "presenterHost", "presenterHomeSlot", "presenter", "avatarLoading",
  "landingPanel", "trainingPanel", "startBtn", "avatarStage", "interruptBtn", "choiceArea",
  "checkpointDialog", "resultDialog", "settingsDialog", "fatalError", "directAvatarState", "directAvatarLog"
];
for (const id of requiredIds) assert.match(html, new RegExp(`id=["']${id}["']`), `Missing required DOM id: ${id}`);

assert.match(html, /<sv-presenter\s+id=["']presenter["']/, "The product must expose a live sv-presenter");
assert.doesNotMatch(html, /http-equiv=["']refresh["']/i, "The customer URL must not redirect");
assert.doesNotMatch(html, /connect-review\.html/i, "The customer URL must not depend on a reviewer-only page");
assert.doesNotMatch(html, /<sv-agent/i, "The active product must use Connect Kit presenter");

for (const file of [
  "product-config.js", "latency-bootstrap.js", "campaign-data.js", "perxona-sdk-guard.js",
  "product-host.js", "product.js", "onboarding.js", "onboarding.css", "direct-avatar.js",
  "direct-avatar.css", "speed-pressure.js", "speed-pressure.css", "persona-preboot.js"
]) assert.match(html, new RegExp(file.replace(".", "\\.")), `Active product asset is not loaded: ${file}`);
assert.match(html, /rel="modulepreload"[^>]+presenter\.js/, "Perxona presenter module must be preloaded");
assert.match(html, /<script type="module" src="https:\/\/cdn\.perxona\.ai\/asia\/prod\/latest\/widget\/entry\/presenter\.js" data-perxona-presenter="1"><\/script>/, "Official Presenter SDK must execute directly from head");

for (const capability of ["initializeWithConnectKey", "PRESENTER_STATUS", 'status === "Ready"', "present(", "playMotion", "interruptPresentation", "X-Connect-Key"]) assert.ok(product.includes(capability), `Missing Connect Kit capability: ${capability}`);
for (const lifecycleContract of ["ALL_PERFORMANCE_FINISHED", "waitForPerformanceFinished", "cancelPerformanceWait"]) assert.ok(product.includes(lifecycleContract), `Missing Presenter speech lifecycle contract: ${lifecycleContract}`);
assert.match(product, /\[MOTION \$\{motionId\}:1\]/, "Motion markup must include an explicit priority");

assert.match(guard, /FAST_TARGET_KEY = "scamshield\.perxona\.fastTarget\.v1"/, "Successful Presenter target must be cached for warm start");
assert.match(guard, /saveFastTarget\(target\)/, "Real Ready must persist the last-known-good target");
assert.match(guard, /loadFastTarget\(\)/, "Warm start must restore the last-known-good target");
assert.match(guard, /clearFastTarget/, "Failed warm-start target must be removable");
assert.match(guard, /__scamShieldReadyTargetKey/, "A warm-started target must not be initialized twice");
assert.match(guard, /PRESENT_TIMEOUT_MS = 12000/, "Speech request latency must remain bounded");
assert.doesNotMatch(guard, /20 秒內未 Ready|emitNormalizedStatus|initialize-promise-resolved/, "Old false-failure or synthetic Ready logic must be gone");

assert.match(config, /fixedAvatarId:\s*"cc006_male_finance"/, "ScamShield must lock to one mature male Avatar");
assert.match(latency, /AVATAR_PATH = "\/api\/v1\/connect\/assets\/avatars\?page=1&size=100"/, "Avatar catalog path must be recognized");
assert.match(latency, /singleAvatarCatalog/, "Real Avatar catalog must be filtered to the single product Avatar");
assert.match(latency, /nativeFetch/, "Single-avatar verification must use a real Perxona response rather than a fabricated ID");
assert.doesNotMatch(latency, /fixedAvatarCatalog/, "Fabricated Avatar catalogs must not be used");
assert.match(latency, /CATALOG_TTL_MS = 5 \* 60 \* 1000/, "Catalog data should be session-cached briefly");
assert.match(latency, /resumeAudioPlayback/, "Audio must be pre-unlocked from the start gesture");
assert.match(host, /Size, not viewport intersection/, "Presenter sizing must not depend on viewport intersection");
assert.doesNotMatch(host, /rect\.bottom > 0 && rect\.top < innerHeight/, "Presenter must not collapse merely because its target is offscreen");

assert.match(direct, /\.present\(text\)/, "Landing-page controls must call Perxona present() directly");
assert.match(direct, /interruptPresentation/, "Landing-page controls must be able to interrupt the Avatar directly");
assert.match(direct, /PRESENTER_STATUS/, "Direct controls must listen to the real Presenter Ready event");
assert.match(direct, /canvasLooksRendered/, "Direct interaction must check rendered Avatar evidence");
assert.match(direct, /hostLooksRenderable/, "Closed-shadow Presenter builds need a rendered-host fallback gate");
assert.match(direct, /Avatar Ready · 等待畫面顯示/, "Ready alone must not be labeled operable");
assert.match(direct, /Avatar 已顯示 · 可直接互動/, "Operable copy must only be shown after visual confirmation");
assert.match(html, /PERXONA CONNECT · 正在載入 AVATAR/, "Initial page copy must not claim the Avatar is operable before rendering");
assert.match(html, /direct-avatar\.js\?v=1\.2\.0/, "Rendered Avatar gate must be cache-busted");
assert.match(html, /data-avatar-action="start"/, "Public page must expose a direct Avatar start interaction");

assert.match(persona, /cc006_male_finance/, "Default attacker must use the mature male finance avatar");
assert.match(speed, /ROUND_LIMIT_MS = 12000/, "Player decision speed must have a visible 12-second pressure window");
assert.match(speed, /FAST_MS = 3500/, "Fast safe decisions must receive a speed bonus");
assert.match(speed, /normalizedSpeed/, "Final score must incorporate reaction speed");
assert.match(html, /SPEED SCORE/, "Landing page must explain that response speed affects scoring");

for (const cue of ["missionBriefingDialog", "nextActionDock", "firstRoundCoach", "開始第 1 關", "BREAK THE SPELL", "選一個安全回應"]) assert.ok(onboarding.includes(cue), `Missing player guidance cue: ${cue}`);
assert.match(onboardingCss, /\.next-step-guide/, "Landing next-step guide styling is missing");
assert.match(onboardingCss, /\.next-action-dock/, "Persistent next-action dock styling is missing");
assert.match(onboardingCss, /\.first-round-coach/, "First-round coach styling is missing");

assert.match(config, /publishableConnectKey/, "Browser config must define a publishable key");
assert.match(config, /atob\(/, "Publishable configuration should remain separated from product logic");
for (const file of [config, onboarding, guard, latency, direct, speed, persona]) assert.doesNotMatch(file, /secretConnectKey|PERXONA_CONNECT_SECRET_KEY|sk_live|sk_test/i, "A secret credential appears in browser code");

const context = { window: {}, Object };
vm.runInNewContext(campaign, context, { filename: "campaign-data.js" });
const data = context.window.SCAMSHIELD_CAMPAIGN_DATA;
assert.equal(data.stages.length, 3, "Campaign must contain three stages");
assert.equal(data.stages.reduce((sum, stage) => sum + stage.rounds.length, 0), 12, "Campaign must contain twelve main rounds");
assert.ok(Object.keys(data.recovery).length >= 5, "Campaign must include recovery paths");

console.log("ScamShield smoke test passed: early Perxona SDK execution, rendered-Avatar interaction gate, verified single Avatar, warm start, speed scoring, 12 rounds, and recovery paths are present.");
