const CONFIG = window.SCAMSHIELD_CONFIG;
const CONTENT = window.SCAMSHIELD_CAMPAIGN_DATA;
if (!CONFIG?.publishableConnectKey || !CONTENT?.stages?.length) throw new Error("ScamShield config missing");

const $ = (s) => document.querySelector(s);
const presenter = $("#presenter");
const ui = {
  badge: $("#connectionBadge"), start: $("#startBtn"), startup: $("#startupDetail"), loading: $("#avatarLoading"), loadingTitle: $("#loadingTitle"), loadingDetail: $("#loadingDetail"),
  landing: $("#landingPanel"), training: $("#trainingPanel"), homeSlot: $("#presenterHomeSlot"), stage: $("#avatarStage"), host: $("#presenterHost"),
  roundCount: $("#roundCount"), combo: $("#comboValue"), interrupts: $("#interruptCount"), stagePath: $("#stagePath"), roundEyebrow: $("#roundEyebrow"), roundTitle: $("#roundTitle"),
  shieldBar: $("#shieldBar"), shieldValue: $("#shieldValue"), score: $("#scoreValue"), speaker: $("#speakerLabel"), speech: $("#speechText"), choices: $("#choiceArea"), feedback: $("#feedbackBox"), flags: $("#flagList"), prop: $("#propCard"), interrupt: $("#interruptBtn"), exit: $("#exitBtn"),
  directState: $("#directAvatarState"), directLog: $("#directAvatarLog"), previewCaption: $(".preview-caption"),
  checkpoint: $("#checkpointDialog"), checkpointEyebrow: $("#checkpointEyebrow"), checkpointTitle: $("#checkpointTitle"), checkpointStars: $("#checkpointStars"), checkpointCopy: $("#checkpointCopy"), checkpointStats: $("#checkpointStats"), checkpointBtn: $("#checkpointBtn"),
  result: $("#resultDialog"), finalScore: $("#finalScore"), resultTitle: $("#resultTitle"), resultCopy: $("#resultCopy"), resultStats: $("#resultStats"), replay: $("#replayBtn"), home: $("#homeBtn"), fatal: $("#fatalError"), fatalText: $("#fatalErrorText"), retry: $("#retryBtn")
};

const state = {
  ready: false, visualReady: false, mode: "campaign", assets: null, rounds: [], index: 0,
  score: 0, shield: 100, safe: 0, risky: 0, combo: 0, maxCombo: 0, interruptCount: 0, flags: [],
  speaking: false, choiceShownAt: 0, speedSamples: [], stageStartIndex: 0
};

const DIRECT_LINES = {
  start: "我是公司財務主管。這筆款項非常急。現在立刻照我說的做，不要再確認，不要拖時間。",
  verify: "你還要另外驗證？我已經說過這是主管指示。不要浪費時間，先做，其他流程之後補。",
  otp: "只是一次性驗證碼。立刻念給我，現在就要。你再拖，整個流程就會被你卡住。"
};

function setStatus(kind, text) {
  if (!ui.badge) return;
  ui.badge.className = `connection is-${kind}`;
  const span = ui.badge.querySelector("span");
  if (span) span.textContent = text;
}
function setLoading(title, detail) {
  if (ui.loadingTitle) ui.loadingTitle.textContent = title;
  if (ui.loadingDetail) ui.loadingDetail.textContent = detail;
  if (ui.startup) ui.startup.textContent = detail;
}
function connectApi(path, timeoutMs = 5000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeoutMs);
  return fetch(`${CONFIG.apiBase}${path}`, {headers:{"X-Connect-Key":CONFIG.publishableConnectKey}, mode:"cors", cache:"default", signal:c.signal})
    .then(async r => { const data = await r.json().catch(()=>({})); if (!r.ok) throw new Error(data?.detail || data?.error || `HTTP ${r.status}`); return data; })
    .finally(()=>clearTimeout(t));
}
function text(item){ try{return JSON.stringify(item).toLowerCase()}catch{return ""} }
function id(kind,item){ if(kind==="avatar") return item?.avatar_id||item?.id||""; if(kind==="scene") return item?.scene_id||item?.id||""; return item?.id||item?.voice_id||""; }
function pickAvatar(items){
  return items.find(x=>id("avatar",x)===CONFIG.fixedAvatarId) || [...items].sort((a,b)=>rankAvatar(b)-rankAvatar(a))[0];
}
function rankAvatar(x){ const s=text(x); let n=0; for(const k of ["male","man","adult","business","finance","executive","professional","suit"]) if(s.includes(k)) n+=3; for(const k of ["female","child","kid","cute","anime","cartoon"]) if(s.includes(k)) n-=5; return n; }
function pickScene(items){ return [...items].sort((a,b)=>rankScene(b)-rankScene(a))[0]; }
function rankScene(x){ const s=text(x); let n=0; for(const k of ["office","meeting","business","boardroom","studio","room"]) if(s.includes(k)) n+=2; return n; }
function pickVoice(items){ return [...items].sort((a,b)=>rankVoice(b)-rankVoice(a))[0]; }
function rankVoice(x){ const s=text(x); let n=0; for(const k of ["zh","taiwan","mandarin","chinese","male","man","deep","mature","serious"]) if(s.includes(k)) n+=2; for(const k of ["female","child","cute","bright"]) if(s.includes(k)) n-=3; return n; }

function positionPresenter(){
  const target = ui.training?.hidden ? ui.homeSlot : ui.stage;
  if (!target || !ui.host) return;
  const r = target.getBoundingClientRect();
  if (r.width < 20 || r.height < 20) return;
  ui.host.style.transform = `translate3d(${Math.round(r.left)}px,${Math.round(r.top)}px,0)`;
  ui.host.style.width = `${Math.round(r.width)}px`;
  ui.host.style.height = `${Math.round(r.height)}px`;
  ui.host.style.borderRadius = getComputedStyle(target).borderRadius || "18px";
  ui.host.classList.add("is-positioned");
}
addEventListener("resize", positionPresenter, {passive:true});
addEventListener("scroll", positionPresenter, {passive:true});

function waitReady(){
  return new Promise((resolve,reject)=>{
    let done=false;
    const finish=(err)=>{ if(done)return; done=true; clearTimeout(timer); presenter.removeEventListener("PRESENTER_STATUS",onStatus); presenter.removeEventListener("CONNECT_KEY_REJECTED",onReject); err?reject(err):resolve(); };
    const onStatus=e=>{ const s=String(e.detail?.status||""); if(s) setLoading(`Perxona：${s}`,`Presenter 狀態：${s}`); if(s==="Ready") finish(); };
    const onReject=()=>finish(new Error("Publishable Connect Key 被拒絕"));
    presenter.addEventListener("PRESENTER_STATUS",onStatus);
    presenter.addEventListener("CONNECT_KEY_REJECTED",onReject);
    const timer=setTimeout(()=>finish(new Error("Avatar 初始化超過 15 秒")),15000);
  });
}
function waitVisual(){
  return new Promise(resolve=>{
    const start=performance.now();
    const tick=()=>{
      const sr=presenter.shadowRoot;
      const visual=sr?.querySelector("canvas,video") || presenter.querySelector?.("canvas,video");
      const rect=visual?.getBoundingClientRect?.();
      if ((rect?.width>30 && rect?.height>30) || performance.now()-start>700) return resolve();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

async function boot(){
  const t0=performance.now();
  try{
    positionPresenter();
    setStatus("loading","正在載入 Perxona");
    setLoading("正在建立 Avatar","讀取必要的 Avatar / Scene / Voice 資產。其他資料不會阻塞啟動。");
    await customElements.whenDefined("sv-presenter");
    const [a,s,v]=await Promise.all([
      connectApi("/api/v1/connect/assets/avatars?page=1&size=20"),
      connectApi("/api/v1/connect/assets/scenes?page=1&size=20"),
      connectApi("/api/v1/connect/voices?page=1&size=20")
    ]);
    const avatar=pickAvatar(a.items||[]), scene=pickScene(s.items||[]), voice=pickVoice(v.items||[]);
    if(!avatar||!scene||!voice) throw new Error("Perxona catalog 缺少可用資產");
    state.assets={avatarId:id("avatar",avatar),sceneId:id("scene",scene),voiceId:id("voice",voice)};
    const readyPromise=waitReady();
    presenter.initializeWithConnectKey(CONFIG.publishableConnectKey,state.assets).catch(()=>{});
    await readyPromise;
    state.ready=true;
    setStatus("ready","Perxona Ready");
    if(ui.directState) ui.directState.textContent="Avatar Ready · 等待畫面顯示…";
    await waitVisual();
    state.visualReady=true;
    ui.loading?.classList.add("is-hidden");
    if(ui.start){ ui.start.disabled=false; ui.start.querySelector(".button-label").textContent="開始完整闖關"; const i=ui.start.querySelector("i"); if(i)i.textContent="→"; }
    if(ui.directState){ ui.directState.textContent="Avatar 已顯示 · 可直接互動"; ui.directState.classList.add("is-ready"); }
    if(ui.previewCaption) ui.previewCaption.textContent="LIVE PERXONA CONNECT · 可直接操作";
    document.querySelectorAll("[data-avatar-action]").forEach(b=>b.disabled=false);
    setLoading("Avatar 已就緒",`啟動完成 ${((performance.now()-t0)/1000).toFixed(1)} 秒`);
  }catch(err){
    console.error(err);
    setStatus("error","Perxona 無法連線");
    if(ui.fatalText) ui.fatalText.textContent=err?.message||String(err);
    if(ui.fatal) ui.fatal.hidden=false;
  }
}

function flattened(){ return CONTENT.stages.flatMap((stage,si)=>stage.rounds.map((round,ri)=>({...round,stage,si,ri}))); }
function activeRounds(){ const all=flattened(); return state.mode==="quick"?all.slice(0,4):all; }
function current(){ return state.rounds[state.index]; }
function esc(x){return String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function renderStagePath(){
  if(!ui.stagePath)return;
  const currentStage=current()?.si??0;
  ui.stagePath.innerHTML=CONTENT.stages.map((st,i)=>`<div class="${i<currentStage?"is-complete":i===currentStage?"is-active":""}"><i>${i<currentStage?"✓":st.number}</i><span>${esc(st.name)}</span></div>`).join("");
}
function updateHud(){
  if(ui.roundCount)ui.roundCount.textContent=`${state.index+1}/${state.rounds.length}`;
  if(ui.combo)ui.combo.textContent=`×${state.combo}`;
  if(ui.interrupts)ui.interrupts.textContent=String(state.interruptCount);
  if(ui.score)ui.score.textContent=String(Math.max(0,state.score));
  if(ui.shieldValue)ui.shieldValue.textContent=String(state.shield);
  if(ui.shieldBar)ui.shieldBar.style.width=`${state.shield}%`;
  if(ui.flags)ui.flags.innerHTML=state.flags.length?state.flags.slice(-8).map(f=>`<b>⚑ ${esc(f)}</b>`).join(""):"<small>尚未辨認紅旗。</small>";
  renderStagePath();
}
function renderProp(p){ if(!ui.prop)return; if(!p){ui.prop.hidden=true;return;} ui.prop.hidden=false; ui.prop.innerHTML=`<div class="prop-top"><span>${esc(p.eyebrow||"EVIDENCE")}</span><b>${esc(p.code||"")}</b></div><div class="prop-icon">${esc(p.icon||"!")}</div><strong>${esc(p.title||"")}</strong><small>${esc(p.detail||"")}</small>`; }

function speedBonus(ms){ if(ms<=3500)return 8; if(ms<=6500)return 5; if(ms<=9500)return 2; return 0; }
function showChoices(){
  const r=current(); if(!r||!ui.choices)return;
  state.choiceShownAt=performance.now();
  ui.choices.innerHTML=`<div class="decision-timer"><span>SPEED SCORE</span><b id="decisionSeconds">12.0s</b></div>`+r.choices.map((c,i)=>`<button class="choice-button" type="button" data-choice="${i}"><b>${String.fromCharCode(65+i)}</b><span>${esc(c.text)}</span></button>`).join("");
  const timerEl=$("#decisionSeconds");
  const tick=()=>{ if(!timerEl?.isConnected)return; const left=Math.max(0,12000-(performance.now()-state.choiceShownAt)); timerEl.textContent=`${(left/1000).toFixed(1)}s`; if(left>0)requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  ui.choices.querySelectorAll("[data-choice]").forEach(b=>b.addEventListener("click",()=>choose(Number(b.dataset.choice)),{once:true}));
}
async function speakRound(){
  const r=current(); if(!r)return;
  state.speaking=true; if(ui.interrupt)ui.interrupt.disabled=false;
  try{
    await presenter.resumeAudioPlayback?.();
    presenter.present(r.speech).catch(()=>{});
  }catch{}
  setTimeout(()=>{ if(state.index>=0 && !ui.choices.querySelector?.("[data-choice]")) showChoices(); },450);
}
function renderRound(){
  const r=current(); if(!r)return;
  if(ui.roundEyebrow)ui.roundEyebrow.textContent=`STAGE ${r.stage.number} · ROUND ${r.ri+1}/${r.stage.rounds.length}`;
  if(ui.roundTitle)ui.roundTitle.textContent=r.title;
  if(ui.speaker)ui.speaker.textContent=r.speaker;
  if(ui.speech)ui.speech.textContent=r.speech;
  if(ui.feedback){ui.feedback.hidden=true;ui.feedback.className="feedback-box";}
  if(ui.choices)ui.choices.innerHTML='<div class="startup-detail">Avatar 正在施壓；你可以直接 BREAK THE SPELL。</div>';
  renderProp(r.prop); updateHud(); speakRound();
}
function choose(i){
  const r=current(), c=r?.choices?.[i]; if(!c)return;
  const ms=performance.now()-state.choiceShownAt; const bonus=speedBonus(ms); state.speedSamples.push(Math.min(ms,12000));
  try{presenter.interruptPresentation?.();}catch{} state.speaking=false; if(ui.interrupt)ui.interrupt.disabled=true;
  state.score+=Number(c.points||0)+(c.ok?bonus:0); state.shield=Math.max(0,Math.min(100,state.shield+Number(c.shield||0)));
  if(c.ok){state.safe++;state.combo++;state.maxCombo=Math.max(state.maxCombo,state.combo); if(r.flag&&!state.flags.includes(r.flag))state.flags.push(r.flag); if(c.addFlag&&!state.flags.includes(c.addFlag))state.flags.push(c.addFlag);} else {state.risky++;state.combo=0;}
  updateHud(); if(ui.feedback){ui.feedback.hidden=false;ui.feedback.className=`feedback-box ${c.ok?"":"is-risk"}`;ui.feedback.textContent=`${c.ok?"✓":"⚠"} ${c.lesson} · 反應 ${(ms/1000).toFixed(1)}s${c.ok?` · Speed +${bonus}`:""}`;}
  if(ui.choices){ui.choices.innerHTML='<button id="nextAction" class="primary-button" type="button"><span class="button-label">下一關</span><i>→</i></button>';$("#nextAction")?.addEventListener("click",advance,{once:true});}
}
function interrupt(){
  if(!state.speaking)return; try{presenter.interruptPresentation?.();}catch{} state.speaking=false; state.interruptCount++; state.score+=5; if(ui.interrupt)ui.interrupt.disabled=true; updateHud(); if(!ui.choices.querySelector?.("[data-choice]"))showChoices();
  if(ui.feedback){ui.feedback.hidden=false;ui.feedback.className="feedback-box";ui.feedback.textContent="✓ 你主動中斷了對方控制的節奏。";}
}
function advance(){
  const prevStage=current()?.si; state.index++;
  if(state.index>=state.rounds.length)return finish();
  if(current()?.si!==prevStage && state.mode!=="quick") return checkpoint(prevStage);
  renderRound();
}
function checkpoint(stageIndex){
  const st=CONTENT.stages[stageIndex]; if(!ui.checkpoint)return renderRound();
  ui.checkpointEyebrow.textContent=`STAGE ${st.number} CHECKPOINT`; ui.checkpointTitle.textContent=`${st.name}完成`; ui.checkpointStars.textContent=state.safe>=state.index-1?"★★★":"★★☆"; ui.checkpointCopy.textContent=`安全決策 ${state.safe} 次，風險決策 ${state.risky} 次，主動中斷 ${state.interruptCount} 次。`; ui.checkpointStats.innerHTML=`<div><span>SAFE</span><b>${state.safe}</b></div><div><span>RISKY</span><b>${state.risky}</b></div><div><span>INTERRUPTS</span><b>${state.interruptCount}</b></div>`; ui.checkpoint.showModal();
}
function finish(){
  const total=state.rounds.length; const avg=state.speedSamples.length?state.speedSamples.reduce((a,b)=>a+b,0)/state.speedSamples.length:12000; const speed=Math.max(0,Math.round((1-avg/12000)*100)); const final=Math.max(0,Math.min(100,Math.round((state.safe/total)*70+(state.shield/100)*20+speed*.1)));
  ui.finalScore.textContent=String(final); ui.resultTitle.textContent=final>=85?"你守住了信任鏈。":final>=65?"你會防守，但仍可更快。":"下一輪要更早停下來驗證。"; ui.resultCopy.textContent=`安全 ${state.safe}/${total}，平均反應 ${(avg/1000).toFixed(1)} 秒，Speed Score ${speed}。`; ui.resultStats.innerHTML=`<div><span>SAFE RATE</span><b>${Math.round(state.safe/total*100)}%</b></div><div><span>SPEED</span><b>${speed}</b></div><div><span>SHIELD</span><b>${state.shield}</b></div>`; ui.result.showModal();
}
function startTraining(){
  if(!state.visualReady)return; state.rounds=activeRounds(); state.index=0; state.score=0;state.shield=100;state.safe=0;state.risky=0;state.combo=0;state.maxCombo=0;state.interruptCount=0;state.flags=[];state.speedSamples=[]; ui.landing.hidden=true;ui.training.hidden=false; requestAnimationFrame(()=>{positionPresenter();ui.training.scrollIntoView({behavior:"auto",block:"start"});}); renderRound();
}
function goHome(){ try{presenter.interruptPresentation?.();}catch{} ui.training.hidden=true;ui.landing.hidden=false; ui.result?.close();ui.checkpoint?.close();requestAnimationFrame(positionPresenter); }

async function direct(action){
  if(!state.visualReady)return;
  if(action==="stop"){try{presenter.interruptPresentation?.();}catch{} if(ui.directLog)ui.directLog.innerHTML="<strong>你：</strong>已中斷 Avatar。";return;}
  const line=DIRECT_LINES[action]; if(!line)return; document.querySelectorAll("[data-avatar-action]").forEach(b=>b.disabled=true); try{await presenter.resumeAudioPlayback?.();await presenter.present(line);if(ui.directLog)ui.directLog.innerHTML=`<strong>Avatar：</strong>${esc(line)}`;}catch(e){if(ui.directLog)ui.directLog.innerHTML=`<strong>系統：</strong>${esc(e.message||e)}`;}finally{setTimeout(()=>document.querySelectorAll("[data-avatar-action]").forEach(b=>b.disabled=false),500);}
}

document.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>{state.mode=b.dataset.mode;document.querySelectorAll("[data-mode]").forEach(x=>x.classList.toggle("is-selected",x===b));if(state.ready)ui.start.querySelector(".button-label").textContent=state.mode==="quick"?"開始快速演練":"開始完整闖關";}));
ui.start?.addEventListener("click",startTraining);ui.interrupt?.addEventListener("click",interrupt);ui.exit?.addEventListener("click",goHome);ui.home?.addEventListener("click",goHome);ui.replay?.addEventListener("click",()=>{ui.result.close();startTraining();});ui.checkpointBtn?.addEventListener("click",()=>{ui.checkpoint.close();renderRound();});ui.retry?.addEventListener("click",()=>location.reload());
document.querySelectorAll("[data-avatar-action]").forEach(b=>b.addEventListener("click",()=>direct(b.dataset.avatarAction)));
presenter.addEventListener("ALL_PERFORMANCE_FINISHED",()=>{state.speaking=false;if(ui.interrupt)ui.interrupt.disabled=true;});

positionPresenter();requestAnimationFrame(positionPresenter);boot();
