(()=>{
'use strict';
const script=document.currentScript;
const project=(script?.dataset.project||document.documentElement.dataset.project||'unknown').toLowerCase().replace(/[^a-z0-9-]/g,'-');
const actionText=script?.dataset.actionText||'完成核心操作';
const realText=script?.dataset.realText||'我真的採取了下一步';
const issue=script?.dataset.issue||'';
const NS='pglab-allen3429-20260908-a93f5b';
const BASE='https://abacus.jasoncameron.dev';
const k=(name)=>`${project}-${name}`;
const onceKey=(name)=>`pglab:${project}:${name}:v1`;
async function hit(name){try{const r=await fetch(`${BASE}/hit/${NS}/${k(name)}`,{cache:'no-store'});if(!r.ok)throw 0;return (await r.json()).value}catch(e){return null}}
async function get(name){try{const r=await fetch(`${BASE}/get/${NS}/${k(name)}`,{cache:'no-store'});if(r.status===404)return 0;if(!r.ok)throw 0;return (await r.json()).value}catch(e){return null}}
async function once(name){if(localStorage.getItem(onceKey(name)))return false;localStorage.setItem(onceKey(name),'1');await hit(name);return true}
async function core(label='default'){await hit('core-actions');await once('engaged-browsers');if(label)await hit(`core-${String(label).toLowerCase().replace(/[^a-z0-9-]/g,'-').slice(0,32)}`);refresh();}
async function real(label='default'){await hit('real-actions');await once('real-browsers');if(label)await hit(`real-${String(label).toLowerCase().replace(/[^a-z0-9-]/g,'-').slice(0,32)}`);refresh();}
async function feedback(helpful,reason){await once('feedback-browsers');await hit(helpful?'helpful-yes':'helpful-no');if(reason)await hit(`feedback-${reason}`);localStorage.setItem(onceKey('feedback-done'),'1');refresh();renderFeedbackThanks();}
async function refresh(){const ids=['unique-browsers','engaged-browsers','core-actions','feedback-browsers','real-browsers'];const vals=await Promise.all(ids.map(get));ids.forEach((id,i)=>{document.querySelectorAll(`[data-impact=${id}]`).forEach(el=>el.textContent=vals[i]===null?'—':String(vals[i]))});}
function renderFeedbackThanks(){const box=document.getElementById('pglab-feedback-body');if(box)box.innerHTML='<b>謝謝，已記入這個專案的驗證資料。</b><br><span class="pglab-muted">不需要姓名或聯絡方式。</span>';}
function mount(){
 const style=document.createElement('style');style.textContent=`.pglab-impact{margin:18px auto;padding:16px;border:1px solid #dbe3ea;border-radius:16px;background:#fff;font-family:system-ui,-apple-system,"Noto Sans TC",sans-serif;color:#17212b}.pglab-impact h2{margin:.1em 0 .5em}.pglab-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px}.pglab-metric{border:1px solid #dbe3ea;border-radius:12px;padding:10px}.pglab-metric b{display:block;font-size:22px;margin-top:3px}.pglab-feedback{margin-top:13px;padding-top:13px;border-top:1px solid #dbe3ea}.pglab-feedback button{margin:5px 5px 5px 0;border:0;border-radius:10px;padding:9px 11px;font:inherit;font-weight:800;cursor:pointer;background:#17212b;color:#fff}.pglab-feedback button.alt{background:#edf1f5;color:#17212b}.pglab-muted{font-size:12px;color:#65717e;line-height:1.55}.pglab-reason{margin-top:8px}.pglab-reason select{max-width:390px;width:100%;padding:8px;border:1px solid #ccd6df;border-radius:10px}.pglab-real{margin-top:10px}`;document.head.appendChild(style);
 const el=document.createElement('section');el.className='pglab-impact';el.innerHTML=`<h2>實際使用驗證</h2><div class="pglab-metrics"><div class="pglab-metric"><span>獨立瀏覽器</span><b data-impact="unique-browsers">—</b></div><div class="pglab-metric"><span>真的完成使用</span><b data-impact="engaged-browsers">—</b></div><div class="pglab-metric"><span>核心操作次數</span><b data-impact="core-actions">—</b></div><div class="pglab-metric"><span>回饋人數</span><b data-impact="feedback-browsers">—</b></div><div class="pglab-metric"><span>確認採取現實行動</span><b data-impact="real-browsers">—</b></div></div><div class="pglab-feedback" id="pglab-feedback-body"><b>這個工具有幫你完成事情嗎？</b><div class="pglab-reason"><select id="pglab-reason"><option value="clearer">更清楚下一步</option><option value="saved-time">省下查資料／整理時間</option><option value="found-option">找到原本不知道的選項</option><option value="not-enough">資訊還不夠</option><option value="hard-to-use">不好操作</option><option value="not-relevant">不符合我的情況</option></select></div><button id="pglab-yes">有幫助</button><button class="alt" id="pglab-no">沒幫上</button>${issue?`<a style="margin-left:6px;font-size:13px" target="_blank" rel="noopener" href="${issue}">留下文字回饋</a>`:''}<div class="pglab-real"><button class="alt" id="pglab-real">✓ ${realText}</button></div></div><p class="pglab-muted">計數為隱私友善的「獨立瀏覽器」近似值：不收姓名、Email、精確位置或健康資料；同一瀏覽器只計一次獨立使用者／回饋者。核心操作可重複計次。數字使用公開無登入 counter API，適合MVP需求驗證，不作財務或稽核用途。</p>`;
 const target=document.querySelector('main')||document.querySelector('.wrap')||document.body;target.appendChild(el);
 document.getElementById('pglab-yes').onclick=()=>feedback(true,document.getElementById('pglab-reason').value);
 document.getElementById('pglab-no').onclick=()=>feedback(false,document.getElementById('pglab-reason').value);
 document.getElementById('pglab-real').onclick=()=>{real('confirmed');document.getElementById('pglab-real').textContent='已記錄，謝謝';document.getElementById('pglab-real').disabled=true};
 if(localStorage.getItem(onceKey('feedback-done')))renderFeedbackThanks();
 refresh();
}
window.PGLabImpact={core,real,feedback,refresh};
once('unique-browsers');hit('pageviews');
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();