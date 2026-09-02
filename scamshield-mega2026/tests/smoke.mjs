import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = name => fs.readFileSync(new URL(`../${name}`, import.meta.url), "utf8");
const html = read("index.html");
const directorHtml = read("director.html");
const directorJs = read("director.js");
const lite = read("product-lite.js");
const config = read("product-config.js");
const campaign = read("campaign-data.js");
const megaCss = read("mega2026.css");

for (const id of [
  "presenter", "presenterHomeSlot", "avatarStage", "startBtn", "trainingPanel",
  "choiceArea", "directAvatarState", "fatalError", "connectionBadge"
]) {
  assert.match(html, new RegExp(`id=["']${id}["']`), `Missing production ID: ${id}`);
}

assert.match(html, /<sv-presenter\s+id=["']presenter["']/, "Must use the Perxona presenter");
assert.match(html, /product-lite\.js\?v=1\.1\.1/, "Copied stable controller must be active");
assert.match(html, /presenter\.js/, "Official Perxona presenter module must load");
assert.match(html, /mega2026\.css/, "Competition-specific styles must be loaded");
assert.match(html, /director\.html/, "Director mode must be discoverable");

for (const phrase of [
  "臉可以假，聲音可以假", "停", "換", "查", "165", "110",
  "反詐騙諮詢", "立即報案", "MEGA 做夥來"
]) {
  assert.ok(html.includes(phrase), `Missing required competition message: ${phrase}`);
}

assert.match(html, /href=["']\.\.\/scamshield\/["']/, "Original product link must remain explicit");
assert.doesNotMatch(html, /(?:src|href)=["']\.\.\/scamshield\/[^"']+/, "MEGA runtime must not import original ScamShield assets");

for (const capability of [
  "initializeWithConnectKey", "PRESENTER_STATUS", "present(",
  "interruptPresentation", "ALL_PERFORMANCE_FINISHED"
]) {
  assert.ok(lite.includes(capability), `Missing copied Perxona capability: ${capability}`);
}

assert.doesNotMatch(lite, /finish\(new Error\(["']Avatar 初始化超過 15 秒/, "15 seconds must not become a fatal error");
assert.match(lite, /Perxona 仍在載入/, "Slow startup must stay non-fatal");
assert.match(lite, /Avatar 已顯示 · 可直接互動/, "Visual gate must remain");
assert.doesNotMatch(lite, /secretConnectKey|PERXONA_CONNECT_SECRET_KEY|sk_live|sk_test/i, "No secret key may be shipped");

for (const key of ["fixedAvatarId", "fixedSceneId", "fixedVoiceId", "publishableConnectKey"]) {
  assert.ok(config.includes(key), `Missing fixed production config: ${key}`);
}

for (const id of ["sceneCounter", "timecode", "filmFrame", "voiceover", "shot", "takeaway", "playBtn"]) {
  assert.match(directorHtml, new RegExp(`id=["']${id}["']`), `Missing director ID: ${id}`);
}
assert.match(directorHtml, /16:9/, "Director page must state horizontal format");
assert.match(directorHtml, /3–5 分鐘/, "Director page must state duration requirement");
assert.match(directorHtml, /165.*110|110.*165/s, "Director page must include both hotlines");
assert.match(megaCss, /aspect-ratio|hotline-dock/, "Competition visual system must include broadcast-safe UI");

const starts = [...directorJs.matchAll(/start:\s*(\d+),\s*end:\s*(\d+)/g)].map(m => [Number(m[1]), Number(m[2])]);
assert.equal(starts.length, 8, "Director plan must contain eight scenes");
assert.equal(starts[0][0], 0, "Timeline must begin at zero");
assert.equal(starts.at(-1)[1], 260, "Timeline must end at 4:20");
for (let i = 1; i < starts.length; i++) assert.equal(starts[i][0], starts[i - 1][1], "Scenes must be contiguous");
assert.ok(directorJs.includes("165") && directorJs.includes("110"), "Hotlines must be in the timed storyboard");

const context = { window: {} };
vm.runInNewContext(campaign, context, { filename: "campaign-data.js" });
const data = context.window.SCAMSHIELD_CAMPAIGN_DATA;
assert.equal(data.stages.length, 3);
assert.equal(data.stages.reduce((n, s) => n + s.rounds.length, 0), 12);

console.log("MEGA 2026 smoke test passed: isolated runtime, live Perxona interaction, 4:20 director timeline, 停換查, 165/110, and original-site separation.");
