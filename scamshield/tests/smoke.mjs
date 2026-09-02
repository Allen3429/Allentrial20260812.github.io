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

const requiredIds = [
  "connectionBadge", "presenterHost", "presenterHomeSlot", "presenter", "avatarLoading",
  "landingPanel", "trainingPanel", "startBtn", "avatarStage", "interruptBtn", "choiceArea",
  "checkpointDialog", "resultDialog", "settingsDialog", "fatalError"
];
for (const id of requiredIds) {
  assert.match(html, new RegExp(`id=["']${id}["']`), `Missing required DOM id: ${id}`);
}

assert.match(html, /<sv-presenter\s+id=["']presenter["']/, "The product must expose a live sv-presenter");
assert.doesNotMatch(html, /http-equiv=["']refresh["']/i, "The customer URL must not redirect");
assert.doesNotMatch(html, /connect-review\.html/i, "The customer URL must not depend on a reviewer-only page");
assert.doesNotMatch(html, /<sv-agent/i, "The active product must use Connect Kit presenter, not the legacy widget fallback");

for (const file of [
  "product-config.js", "latency-bootstrap.js", "campaign-data.js", "perxona-sdk-guard.js",
  "product-host.js", "product.js", "onboarding.js", "onboarding.css"
]) {
  assert.match(html, new RegExp(file.replace(".", "\\.")), `Active product asset is not loaded: ${file}`);
}
assert.match(html, /rel="modulepreload"[^>]+presenter\.js/, "Perxona presenter module must be preloaded");

for (const capability of [
  "initializeWithConnectKey", "PRESENTER_STATUS", 'status === "Ready"',
  "present(", "playMotion", "interruptPresentation", "X-Connect-Key"
]) {
  assert.ok(product.includes(capability), `Missing Connect Kit capability: ${capability}`);
}
for (const lifecycleContract of ["ALL_PERFORMANCE_FINISHED", "waitForPerformanceFinished", "cancelPerformanceWait"]) {
  assert.ok(product.includes(lifecycleContract), `Missing Presenter speech lifecycle contract: ${lifecycleContract}`);
}
assert.match(product, /\[MOTION \$\{motionId\}:1\]/, "Motion markup must include an explicit priority");
assert.match(html, /product\.js\?v=2\.0\.4/, "Product cache version must expose the latency release");

const waitIndex = product.indexOf("const finishedPromise = waitForPerformanceFinished()");
const presentIndex = product.indexOf("await presenter.present(payload)");
const finishedIndex = product.indexOf("await finishedPromise");
const choicesIndex = product.indexOf("renderChoices(round)", finishedIndex);
assert.ok(waitIndex >= 0 && waitIndex < presentIndex, "Performance listener must be attached before present()");
assert.ok(presentIndex < finishedIndex && finishedIndex < choicesIndex, "Choices must remain locked until playback finishes");

assert.match(html, /perxona-sdk-guard\.js\?v=2\.1\.0/, "Public page must load the low-latency Presenter adapter");
assert.match(guard, /INIT_TIMEOUT_MS = 20000/, "Presenter initialization must have a hard latency ceiling");
assert.match(guard, /PRESENT_TIMEOUT_MS = 12000/, "Speech request latency must be bounded");
assert.match(guard, /if \(readStatus\(event\) === READY\) finishReady\(\)/, "Real Ready must unlock initialization immediately");
assert.doesNotMatch(guard, /emitNormalizedStatus|initialize-promise-resolved/, "The adapter must not fabricate readiness");
assert.equal((guard.match(/originalInitialize\.call\(/g) || []).length, 1, "One product attempt must call upstream initialize once");

assert.match(latency, /CATALOG_TTL_MS = 5 \* 60 \* 1000/, "Catalog data should be session-cached briefly");
assert.match(latency, /resumeAudioPlayback/, "Audio must be pre-unlocked from the start gesture");
assert.match(latency, /exactCatalogPaths/, "Catalog prewarming must be enabled");
assert.match(host, /Size, not viewport intersection/, "Presenter sizing must not depend on viewport intersection");
assert.doesNotMatch(host, /rect\.bottom > 0 && rect\.top < innerHeight/, "Presenter must not collapse merely because its target is offscreen");

for (const cue of [
  "missionBriefingDialog", "nextActionDock", "firstRoundCoach",
  "開始第 1 關", "BREAK THE SPELL", "選一個安全回應"
]) {
  assert.ok(onboarding.includes(cue), `Missing player guidance cue: ${cue}`);
}
for (const scrollContract of ["scrollTrainingIntoView", "queueTrainingScroll", "window.scrollTo"]) {
  assert.ok(onboarding.includes(scrollContract), `Missing automatic training scroll behavior: ${scrollContract}`);
}
assert.match(html, /onboarding\.js\?v=2\.1\.1/, "Onboarding cache version must expose the auto-scroll release");
assert.match(onboardingCss, /\.next-step-guide/, "Landing next-step guide styling is missing");
assert.match(onboardingCss, /\.next-action-dock/, "Persistent next-action dock styling is missing");
assert.match(onboardingCss, /\.first-round-coach/, "First-round coach styling is missing");

assert.match(config, /publishableConnectKey/, "Browser config must define a publishable key");
assert.match(config, /atob\(/, "Publishable configuration should remain separated from product logic");
for (const file of [config, onboarding, guard, latency]) {
  assert.doesNotMatch(file, /secretConnectKey|PERXONA_CONNECT_SECRET_KEY|sk_live|sk_test/i, "A secret credential appears in browser code");
}

const context = { window: {}, Object };
vm.runInNewContext(campaign, context, { filename: "campaign-data.js" });
const data = context.window.SCAMSHIELD_CAMPAIGN_DATA;
assert.equal(data.stages.length, 3, "Campaign must contain three stages");
assert.equal(data.stages.reduce((sum, stage) => sum + stage.rounds.length, 0), 12, "Campaign must contain twelve main rounds");
assert.ok(Object.keys(data.recovery).length >= 5, "Campaign must include recovery paths");

console.log("ScamShield smoke test passed: preloaded Connect Kit, real Ready lifecycle, bounded latency, stable Presenter sizing, guided flow, 12 rounds, and recovery paths are present.");
