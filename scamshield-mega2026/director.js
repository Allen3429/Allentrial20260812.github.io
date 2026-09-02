(() => {
  "use strict";
  const scenes = [
    {
      start: 0, end: 15, visual: "cold-open", title: "冷開場：十五秒的壓力",
      purpose: "在觀眾還沒有心理準備前，直接把他放進詐騙者控制的倒數。",
      caption: "「我是主管。帳戶改了，現在立刻匯款。」",
      voiceover: "他有主管的臉、主管的聲音，甚至知道今天的會議。但他最希望你做的，是不要掛電話。",
      shot: "黑畫面先出現來電震動聲，再切到手機特寫。可接一小段競賽版 Live Avatar。前 3 秒不要放片名。",
      takeaway: "逼你立刻行動，是為了讓你來不及換線查證。",
      html: '<div class="incoming-call"><small>UNKNOWN VIDEO CALL · 00:15</small><b>「現在就匯款」</b><span>臉像、聲音像、語氣也像——但通道是他給你的。</span></div>'
    },
    {
      start: 15, end: 45, visual: "identities", title: "同一張臉，三種可信身分",
      purpose: "用快速變身建立媒體素養：可信外觀不是認證。",
      caption: "臉與聲音可以被複製，身分不能靠感覺認證。",
      voiceover: "今天他是主管，下一秒是親友，再下一秒是投資老師。詐騙者不需要你相信所有事情，只需要你在某一次來不及確認。",
      shot: "三張角色卡快速切換，每張約 7 秒；用相同 Avatar 或相同聲音，故意讓觀眾發現『一致』也能被製造。",
      takeaway: "不要把外貌、聲音、私人資訊或完整郵件串當作單一身分證明。",
      html: '<div class="identity-stack"><div class="identity-card"><i>董</i><b>公司主管</b><span>緊急付款</span></div><div class="identity-card"><i>家</i><b>親友</b><span>出事借錢</span></div><div class="identity-card"><i>投</i><b>投資老師</b><span>保證獲利</span></div></div>'
    },
    {
      start: 45, end: 90, visual: "attack", title: "情境：供應商帳戶突然變更",
      purpose: "把金融素養放進具體決策，不只列舉詐騙關鍵字。",
      caption: "完整郵件串，也可能仍是攻擊者的通道。",
      voiceover: "對方說今天是付款最後期限，附上發票、公司抬頭和一整串往來紀錄。唯一改變的，是收款帳戶。你若只回覆同一封信，仍然沒有離開攻擊者控制的通道。",
      shot: "拍電腦畫面與手準備按下匯款。畫面上清楚標示 NEW ACCOUNT、PAY TODAY，再切 ScamShield 的供應商帳戶變更回合。",
      takeaway: "帳戶異動要用原有電話回撥並雙人覆核；流程不是拖延，而是防線。",
      html: '<article class="warning-mail"><header><span>供應商財務</span><b>URGENT</b></header><main><b>收款帳戶已變更</b><p>請勿聯絡舊窗口。今日付款，請改匯新帳戶。</p></main><footer><button>立即付款</button></footer></article>'
    },
    {
      start: 90, end: 125, visual: "break", title: "轉折：BREAK THE SPELL",
      purpose: "給觀眾一個具體、可記憶、可模仿的停止動作。",
      caption: "第一步不是識破他，是先讓自己停下來。",
      voiceover: "你不需要在十五秒內證明他是假的。你只需要先停止。中斷通話、不點連結、不交出驗證碼，也不讓倒數替你做決定。",
      shot: "手指按下『中斷 Avatar』，聲音瞬間停止。畫面停格半秒，再出現大字 BREAK THE SPELL。",
      takeaway: "先奪回時間，才有可能做出安全決策。",
      html: '<div class="break-card"><span>✕</span><b>BREAK THE SPELL</b><small>停止操作 · 中斷施壓 · 奪回決策節奏</small></div>'
    },
    {
      start: 125, end: 175, visual: "three-actions", title: "核心方法：停、換、查",
      purpose: "把防詐從『小心一點』改成三個可執行行為。",
      caption: "停、換、查：驗證通道要由你選。",
      voiceover: "停，先停止任何付款與憑證交付。換，離開對方給你的電話、連結與郵件串。查，用你自己找到的官方電話、原本保存的聯絡人，或公司正式流程獨立確認。",
      shot: "三個步驟各 15 秒。換線時務必示範『自己找』官方聯絡方式，而不是點對方傳來的查證連結。",
      takeaway: "查證不是問對方更多問題，而是換到對方無法控制的通道。",
      html: '<div class="three-actions"><div class="action-card"><strong>停</strong><b>停止操作</b><span>不匯款、不交 OTP</span></div><div class="action-card"><strong>換</strong><b>換線</b><span>離開對方提供的通道</span></div><div class="action-card"><strong>查</strong><b>獨立查證</b><span>官方電話、原存聯絡人、正式流程</span></div></div>'
    },
    {
      start: 175, end: 220, visual: "red-flags", title: "金融素養：錢要比恐懼走得慢",
      purpose: "補足競賽要求的金融素養，讓觀眾理解高風險決策特徵。",
      caption: "保證獲利、限時匯款、借貸加碼、索取 OTP——都是重大紅旗。",
      voiceover: "真正的投資沒有保證獲利。要求你借錢加碼、轉到安全帳戶、跳過雙簽，或把一次性驗證碼念出來，都不是機會，而是在拆掉你的防線。",
      shot: "每個紅旗用 2–3 秒跳出；搭配訊息聲與紅色警示，但不要顯示真實帳號、QR code 或可操作詐騙資訊。",
      takeaway: "金融決策要能被查證、能被延遲、能被第二個人覆核。",
      html: '<div class="red-flags"><div class="red-flag">⚠ 保證獲利／零風險</div><div class="red-flag">⚠ 今天不匯就失效</div><div class="red-flag">⚠ 借貸、加碼、追繳</div><div class="red-flag">⚠ 安全帳戶／索取 OTP</div></div>'
    },
    {
      start: 220, end: 250, visual: "hotlines", title: "求助：165 與 110",
      purpose: "清楚滿足競賽必要資訊，並讓觀眾知道何時使用哪一支電話。",
      caption: "可疑先問 165；緊急或已受害，立即 110。",
      voiceover: "還沒匯款、但覺得可疑，先撥一六五反詐騙諮詢。若已經受害、正面臨緊急威脅，或需要立即報案，撥一一零。越早求助，越有機會降低損失。",
      shot: "165 與 110 各完整停留至少 5 秒，字體要在手機螢幕也讀得清楚。旁白同步念出號碼。",
      takeaway: "不要因為羞愧而拖延；止損也是一個正確決策。",
      html: '<div class="hotline-visual"><div class="hotline-card"><small>疑似詐騙／匯款前</small><strong>165</strong><b>反詐騙諮詢</b></div><div class="hotline-card"><small>緊急／已受害</small><strong>110</strong><b>立即報案</b></div></div>'
    },
    {
      start: 250, end: 260, visual: "end", title: "片尾：換一條線，真相就現形",
      purpose: "用一句可被記住的主張收束全片。",
      caption: "臉可以假，聲音可以假；驗證通道不要交給對方。",
      voiceover: "換一條線，真相就現形。疑似詐騙撥一六五；緊急或已受害，撥一一零。",
      shot: "黑底品牌片尾，保留 165、110、作品名稱與創作者姓名；音樂乾淨收尾，不要塞入太多資訊。",
      takeaway: "Trust the channel, not the face.",
      html: '<div class="end-card"><div class="brand">ScamShield</div><div class="slogan">換一條線，真相就現形</div><p>165 反詐騙諮詢 · 110 緊急報案</p></div>'
    }
  ];

  const $ = s => document.querySelector(s);
  const els = {counter:$("#sceneCounter"),time:$("#timecode"),fill:$("#timelineFill"),frame:$("#filmFrame"),visual:$("#visualContent"),caption:$("#screenCaption"),title:$("#sceneTitle"),purpose:$("#scenePurpose"),voice:$("#voiceover"),shot:$("#shot"),takeaway:$("#takeaway"),prev:$("#prevBtn"),next:$("#nextBtn"),play:$("#playBtn"),full:$("#fullscreenBtn")};
  const total = scenes.at(-1).end;
  let index = 0, currentTime = 0, running = false, raf = 0, startedAt = 0;
  const fmt = n => `${String(Math.floor(n/60)).padStart(2,"0")}:${String(Math.floor(n%60)).padStart(2,"0")}`;

  function render(){
    const s=scenes[index];
    els.counter.textContent=`SCENE ${index+1} / ${scenes.length}`;
    els.time.textContent=`${fmt(currentTime)} / ${fmt(total)}`;
    els.fill.style.width=`${Math.min(100,currentTime/total*100)}%`;
    els.frame.dataset.visual=s.visual;
    els.visual.innerHTML=s.html;
    els.caption.textContent=s.caption;
    els.title.textContent=s.title;
    els.purpose.textContent=s.purpose;
    els.voice.textContent=s.voiceover;
    els.shot.textContent=s.shot;
    els.takeaway.textContent=s.takeaway;
    els.prev.disabled=index===0;
    els.next.disabled=index===scenes.length-1;
  }
  function go(n){
    index=Math.max(0,Math.min(scenes.length-1,n));
    currentTime=scenes[index].start;
    pause(); render();
  }
  function pause(){running=false;cancelAnimationFrame(raf);els.play.textContent="▶ 播放計時";}
  function play(){
    if(running){pause();return;}
    running=true;startedAt=performance.now()-currentTime*1000;els.play.textContent="Ⅱ 暫停";
    const tick=now=>{
      if(!running)return;
      currentTime=Math.min(total,(now-startedAt)/1000);
      const nextIndex=scenes.findIndex(s=>currentTime>=s.start&&currentTime<s.end);
      if(nextIndex>=0&&nextIndex!==index){index=nextIndex;render();}
      els.time.textContent=`${fmt(currentTime)} / ${fmt(total)}`;els.fill.style.width=`${currentTime/total*100}%`;
      if(currentTime>=total){pause();return;}
      raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick);
  }
  async function fullscreen(){
    try{document.fullscreenElement?await document.exitFullscreen():await document.documentElement.requestFullscreen();}catch{}
  }
  els.prev.addEventListener("click",()=>go(index-1));
  els.next.addEventListener("click",()=>go(index+1));
  els.play.addEventListener("click",play);
  els.full.addEventListener("click",fullscreen);
  addEventListener("keydown",e=>{
    if(e.key==="ArrowLeft")go(index-1);
    else if(e.key==="ArrowRight")go(index+1);
    else if(e.code==="Space"){e.preventDefault();play();}
    else if(e.key.toLowerCase()==="f")fullscreen();
  });
  render();
})();
