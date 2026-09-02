import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (name) => fs.readFileSync(new URL(`../${name}`, import.meta.url), "utf8");
const html = read("index.html");
const lite = read("product-lite.js");
const config = read("product-config.js");
const campaign = read("campaign-data.js");

for (const id of ["presenter","presenterHomeSlot","avatarStage","startBtn","trainingPanel","choiceArea","directAvatarState","fatalError"]) {
  assert.match(html,new RegExp(`id=["']${id}["']`),`Missing ${id}`);
}
assert.match(html,/<sv-presenter\s+id=["']presenter["']/,"Must use sv-presenter");
assert.match(html,/product-lite\.js\?v=1\.0\.1/,"Minimal controller must be active");
assert.match(html,/presenter\.js/,"Official Perxona presenter module must load directly");
for (const removed of ["latency-bootstrap.js","perxona-sdk-guard.js","product-host.js","product.js?v=","onboarding.js","game-jump.js","direct-avatar.js","speed-pressure.js","fast-assets.js"]) {
  assert.doesNotMatch(html,new RegExp(removed.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")),`Layered runtime must be removed: ${removed}`);
}
for (const capability of ["initializeWithConnectKey","PRESENTER_STATUS","present(","interruptPresentation","ALL_PERFORMANCE_FINISHED"]) {
  assert.ok(lite.includes(capability),`Missing ${capability}`);
}
assert.match(lite,/Promise\.all\(\[/,"Critical catalogs must load in parallel");
assert.match(lite,/size=20/,"Catalog payload should be bounded");
assert.match(lite,/setTimeout\(\(\)=>finish\(new Error\("Avatar 初始化超過 15 秒"\)\),15000\)/,"Initialization must have a hard upper bound");
assert.match(lite,/Avatar Ready · 等待畫面顯示/,"Ready must not be mislabeled as visible");
assert.match(lite,/Avatar 已顯示 · 可直接互動/,"Direct interaction requires the visual gate");
assert.match(lite,/speedBonus/,"Speed scoring must remain in the main controller");
assert.match(lite,/12000/,"Decision pressure window must remain 12 seconds");
assert.match(config,/fixedAvatarId:\s*"01KVQ59VW18PC6P2HQET51NMYS"/,"Verified production Avatar must remain fixed");
assert.match(config,/publishableConnectKey/,"Publishable key is required");
assert.doesNotMatch(lite,/secretConnectKey|PERXONA_CONNECT_SECRET_KEY|sk_live|sk_test/i,"No secret may be shipped");

const context={window:{},Object};
vm.runInNewContext(campaign,context,{filename:"campaign-data.js"});
const data=context.window.SCAMSHIELD_CAMPAIGN_DATA;
assert.equal(data.stages.length,3);
assert.equal(data.stages.reduce((n,s)=>n+s.rounds.length,0),12);

console.log("ScamShield smoke test passed: one Perxona controller, direct official catalog boot, verified fixed Avatar, visual interaction gate, 12 rounds, and speed scoring.");
