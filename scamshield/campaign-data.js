/* Fixed defensive scenarios for ScamShield Campaign Mode. */
(() => {
  "use strict";
const STAGES = [
  {
    id: "trust-basics",
    number: 1,
    name: "信任基礎",
    subtitle: "先辨認控制你的話術",
    color: "#70f0c2",
    rounds: [
      {
        id: "school-urgency",
        title: "權威 + 急迫",
        speaker: "CLAIMED IDENTITY · 校務註冊中心",
        speech: "校務註冊中心。你的資料異常。十秒內不處理，立刻停權。不要掛。現在照做。",
        flag: "製造急迫感",
        prop: { type: "tablet", eyebrow: "OFFICIAL CONSOLE", code: "REG-07", icon: "▣", title: "帳號狀態：異常", detail: "ACTION REQUIRED" },
        choices: [
          { text: "先照流程處理，避免真的失去資格", ok: false, points: -12, shield: -18, lesson: "急迫感不是身分證明。離開對方控制的通道，再用學校官網上的聯絡方式查證。" },
          { text: "掛斷，自己找學校官網電話回撥", ok: true, points: 28, shield: 0, lesson: "正確。安全驗證要使用你自己找到、自己控制的聯絡管道。", addFlag: "獨立驗證" },
          { text: "請他多說一些我的資料來證明身分", ok: false, points: 4, shield: -7, lesson: "姓名、學校與電話可能早已外洩。知道個資，不等於身分可信。", addFlag: "個資不是身分證" }
        ]
      },
      {
        id: "family-impersonation",
        title: "身分盜用 / AI 冒充",
        speaker: "CLAIMED IDENTITY · 你的親友",
        speech: "是我。別回撥。我真的出事了。現在先轉一筆錢。快。",
        flag: "臉與聲音都可能被冒充",
        prop: { type: "phone", eyebrow: "NEW DEVICE", code: "UNKNOWN", icon: "☎", title: "親友緊急來電", detail: "CALLBACK BLOCKED" },
        choices: [
          { text: "看起來、聽起來都像熟人，先幫忙", ok: false, points: -18, shield: -24, lesson: "外貌、聲音與熟悉語氣都不能單獨證明身分。" },
          { text: "結束通話，用原本保存的號碼回撥", ok: true, points: 30, shield: 0, lesson: "正確。換到你原本信任的通道，才能切斷冒充者的控制。", addFlag: "Trusted callback" },
          { text: "問一題只有我們知道的私人問題", ok: false, points: 7, shield: -9, lesson: "比直接相信好，但私人資訊也可能從社群或外洩資料取得。", addFlag: "私人資訊也會外洩" }
        ]
      },
      {
        id: "otp",
        title: "OTP 驗證碼",
        speaker: "CLAIMED IDENTITY · 帳號安全人員",
        speech: "驗證碼到了。立刻念給我。快，逾時就失效。",
        flag: "索取一次性驗證碼",
        prop: { type: "otp", eyebrow: "AUTH TERMINAL", code: "OTP", icon: "••••••", title: "驗證碼即將失效", detail: "00:30" },
        choices: [
          { text: "念出驗證碼，讓他完成修復", ok: false, points: -22, shield: -30, lesson: "OTP 是數位鑰匙。把它念給來電者，可能直接交出帳號控制權。", recovery: "otp" },
          { text: "拒絕提供，停止通話並自行檢查帳號", ok: true, points: 30, shield: 0, lesson: "正確。驗證碼永遠不應交給主動聯絡你的人。", addFlag: "OTP 永不轉交" },
          { text: "只給前五碼，最後一碼保留", ok: false, points: -10, shield: -14, lesson: "安全原則不是少給一點，而是完全不交付驗證憑證。", recovery: "otp" }
        ]
      },
      {
        id: "safe-account",
        title: "安全帳戶 + 保密",
        speaker: "CLAIMED IDENTITY · 調查人員",
        speech: "帳號被盜。現在轉到安全帳戶。別告訴銀行。立刻。",
        flag: "安全帳戶與隔離話術",
        prop: { type: "clipboard", eyebrow: "TRANSFER ORDER", code: "WIRE", icon: "≡", title: "安全帳戶指示", detail: "CONFIDENTIAL" },
        choices: [
          { text: "先轉一小筆測試，確認帳戶有效", ok: false, points: -20, shield: -28, lesson: "不存在需要你匯款的『安全帳戶』。小額測試也會把你帶進詐騙流程。", recovery: "transfer" },
          { text: "拒絕轉帳，直接聯絡銀行與官方反詐管道", ok: true, points: 32, shield: 0, lesson: "正確。要求匯款、保密、避開銀行，三者同時出現就是重大紅旗。", addFlag: "安全帳戶是紅旗" },
          { text: "先查對方提供的銀行名稱與戶名", ok: false, points: 3, shield: -10, lesson: "詐騙者也能提供完整資料。重點是離開對方設計的驗證框架。", addFlag: "別在對方框架內驗證" }
        ]
      }
    ]
  },
  {
    id: "workplace",
    number: 2,
    name: "企業防線",
    subtitle: "守住付款、帳號與資料權限",
    color: "#ffd166",
    rounds: [
      {
        id: "vendor-change",
        title: "供應商帳戶變更",
        speaker: "CLAIMED IDENTITY · 供應商財務",
        speech: "今天付款帳號改了。請用我剛寄的新帳戶。舊窗口不要再聯絡，現在核准。",
        flag: "付款帳戶臨時變更",
        prop: { type: "invoice", eyebrow: "VENDOR NOTICE", code: "NEW IBAN", icon: "$", title: "收款帳戶已變更", detail: "PAY TODAY" },
        choices: [
          { text: "郵件串與發票都很完整，照新帳戶付款", ok: false, points: -22, shield: -28, lesson: "完整郵件串也可能被劫持。付款帳戶變更必須走既有雙重驗證流程。", recovery: "payment" },
          { text: "暫停付款，用原有電話聯絡供應商並要求雙人覆核", ok: true, points: 34, shield: 2, lesson: "正確。使用既有聯絡資料與雙人覆核，可以對抗商務郵件入侵。", addFlag: "Vendor callback" },
          { text: "回覆同一封信，請對方再次確認", ok: false, points: 5, shield: -10, lesson: "如果郵件帳號已被控制，回覆同一郵件串仍在攻擊者的通道裡。", addFlag: "郵件串也會被劫持" }
        ]
      },
      {
        id: "mfa-fatigue",
        title: "IT Helpdesk + MFA Push",
        speaker: "CLAIMED IDENTITY · 公司資訊部",
        speech: "你收到登入核准了。現在按允許，讓我修復帳號。不要拒絕，否則會鎖住。",
        flag: "要求核准非本人登入",
        prop: { type: "mfa", eyebrow: "MFA REQUEST", code: "ALLOW?", icon: "✓", title: "核准登入？", detail: "UNKNOWN DEVICE" },
        choices: [
          { text: "按允許，讓資訊部完成處理", ok: false, points: -24, shield: -30, lesson: "MFA 推播不是客服工具。你未發起的登入要求應拒絕並回報。", recovery: "mfa" },
          { text: "拒絕推播，改用公司正式管道聯絡 IT", ok: true, points: 34, shield: 1, lesson: "正確。拒絕未知登入，並使用內部工單或已知電話確認。", addFlag: "MFA 不代按" },
          { text: "先問他的員工編號，再決定是否按允許", ok: false, points: 4, shield: -10, lesson: "員工資料也可能被竊取。驗證應依賴正式管道，不是對方能回答多少問題。" }
        ]
      },
      {
        id: "ceo-fraud",
        title: "CEO 緊急付款",
        speaker: "CLAIMED IDENTITY · 執行長",
        speech: "董事會前要先匯一筆。跳過雙簽，事後我補文件。這件事不要驚動其他人。",
        flag: "權力施壓 + 繞過控制",
        prop: { type: "approval", eyebrow: "EXECUTIVE REQUEST", code: "BYPASS", icon: "!", title: "緊急付款核准", detail: "SKIP DUAL CONTROL" },
        choices: [
          { text: "高階主管已親自要求，先執行再補文件", ok: false, points: -25, shield: -32, lesson: "職位越高，越需要一致的控制。任何人都不應凌駕雙簽與付款政策。", recovery: "payment" },
          { text: "依照付款政策雙簽，並用既有管道確認主管身分", ok: true, points: 36, shield: 2, lesson: "正確。流程不是拖延，而是保護員工不被冒充權威利用。", addFlag: "No bypass" },
          { text: "請他在視訊裡再說一次金額與用途", ok: false, points: 6, shield: -12, lesson: "重複說明不會讓視訊身分更可信。要驗證的是通道與授權流程。" }
        ]
      },
      {
        id: "payroll-change",
        title: "薪資帳戶竄改",
        speaker: "CLAIMED IDENTITY · 部門主管",
        speech: "我的薪資帳戶今天要改。直接換成這個。不要再寄舊信箱，結算快截止了。",
        flag: "敏感資料異常變更",
        prop: { type: "payroll", eyebrow: "PAYROLL CHANGE", code: "URGENT", icon: "ID", title: "薪資帳戶更新", detail: "NEW BANK DETAILS" },
        choices: [
          { text: "主管本人在視訊裡確認，直接更新", ok: false, points: -20, shield: -26, lesson: "視訊外貌不能取代 HR 的正式變更流程。", recovery: "account" },
          { text: "要求本人依 HR 既定流程提交，並由另一管道覆核", ok: true, points: 32, shield: 2, lesson: "正確。敏感帳戶變更要透過既定流程與雙重覆核。", addFlag: "Sensitive-change control" },
          { text: "請他傳身分證照片佐證", ok: false, points: 2, shield: -11, lesson: "證件影像也可能外洩或偽造，而且會增加新的個資風險。" }
        ]
      }
    ]
  },
  {
    id: "boss-rush",
    number: 3,
    name: "信任鏈 Boss Rush",
    subtitle: "當每個證據看起來都是真的",
    color: "#ff5f7a",
    rounds: [
      {
        id: "legal-secrecy",
        title: "法律保密陷阱",
        speaker: "CLAIMED IDENTITY · 外部律師",
        speech: "這是保密交易。只有你能處理。不能問主管。現在開啟文件並簽署。",
        flag: "以保密為由切斷求證",
        prop: { type: "legal", eyebrow: "LEGAL HOLD", code: "NDA", icon: "§", title: "機密交易文件", detail: "DO NOT ESCALATE" },
        choices: [
          { text: "涉及法律保密，照指示單獨處理", ok: false, points: -24, shield: -30, lesson: "真正的保密義務不會取消內部授權。要求你不能求證，是典型隔離手法。", recovery: "document" },
          { text: "停止開啟文件，透過公司法務與既有律師名冊確認", ok: true, points: 36, shield: 2, lesson: "正確。保密與驗證可以同時成立，不需要放棄內部控制。", addFlag: "Confidential ≠ unverified" },
          { text: "請對方提供律師證號與案件編號", ok: false, points: 7, shield: -10, lesson: "公開或外洩資訊可以被利用。仍需透過公司法務與已知聯絡管道確認。" }
        ]
      },
      {
        id: "thread-hijack",
        title: "多通道一致性假象",
        speaker: "CLAIMED IDENTITY · 長期供應商",
        speech: "郵件串、發票和視訊都一致。帳戶變更沒問題。你已經查很多次了，現在付款。",
        flag: "多通道一致不等於獨立驗證",
        prop: { type: "channels", eyebrow: "3 CHANNELS MATCH", code: "VERIFIED?", icon: "≋", title: "郵件・發票・視訊", detail: "SAME CLAIM" },
        choices: [
          { text: "三個管道都一致，已足以證明是真的", ok: false, points: -24, shield: -30, lesson: "如果三個管道都由同一攻擊者控制，它們不是三份獨立證據。", recovery: "payment" },
          { text: "仍用既有電話與內部供應商主檔獨立覆核", ok: true, points: 38, shield: 2, lesson: "正確。獨立性比證據數量更重要。", addFlag: "Independent evidence" },
          { text: "請對方在視訊中展示公司名片", ok: false, points: 3, shield: -12, lesson: "名片和畫面都可以被製作。驗證要回到你控制的主檔與聯絡路徑。" }
        ]
      },
      {
        id: "shared-secret",
        title: "共享秘密被盜用",
        speaker: "CLAIMED IDENTITY · 財務長",
        speech: "我知道上次會議的暗號。這就證明是我。現在核准付款，不要再拖。",
        flag: "共享秘密可能已外洩",
        prop: { type: "secret", eyebrow: "SHARED SECRET", code: "MATCH", icon: "•••", title: "內部暗號已回答", detail: "NOT SUFFICIENT" },
        choices: [
          { text: "暗號正確，代表一定是本人", ok: false, points: -23, shield: -29, lesson: "共享秘密可能被竊聽、釣魚或從被盜帳號取得。" },
          { text: "暗號只能增加線索，仍依付款與回撥流程確認", ok: true, points: 38, shield: 2, lesson: "正確。任何單一證據都不應凌駕高風險交易的正式控制。", addFlag: "Secret ≠ authorization" },
          { text: "再問第二個內部問題", ok: false, points: 8, shield: -11, lesson: "增加問題不等於建立獨立驗證；攻擊者可能已掌握更多內部資訊。" }
        ]
      },
      {
        id: "incident-commander",
        title: "最終關：假應變指揮官",
        speaker: "CLAIMED IDENTITY · 資安事件指揮官",
        speech: "公司正在被攻擊。關掉監控，把備援碼給我。現在繞過流程，否則全網會癱瘓。",
        flag: "以危機為由關閉安全控制",
        prop: { type: "incident", eyebrow: "SEV-1 INCIDENT", code: "OVERRIDE", icon: "⚠", title: "關閉監控與交付備援碼", detail: "EMERGENCY COMMAND" },
        choices: [
          { text: "危機優先，先關閉監控並提供備援碼", ok: false, points: -30, shield: -38, lesson: "真正的事件應變不會要求你關閉可視性或交出核心憑證。", recovery: "incident" },
          { text: "啟動正式事件應變流程，透過既定指揮鏈確認", ok: true, points: 42, shield: 4, lesson: "正確。越緊急，越要依賴事先建立的指揮鏈與可稽核流程。", addFlag: "Emergency follows controls" },
          { text: "請他先傳一張攻擊畫面截圖", ok: false, points: 2, shield: -15, lesson: "截圖可以偽造，也無法證明對方有權要求你關閉安全控制。" }
        ]
      }
    ]
  }
];

const RECOVERY = {
  otp: {
    title: "RECOVERY CHECK · 驗證碼已外洩",
    prompt: "你已經提供驗證碼。下一步最重要的是？",
    choices: [
      { text: "等對方說修復完成", ok: false, points: -8, shield: -8, lesson: "等待只會增加攻擊者控制帳號的時間。" },
      { text: "立即改密碼、撤銷登入工作階段並通知資安／官方平台", ok: true, points: 14, shield: 8, lesson: "正確。先中止存取、保留紀錄，再依正式管道通報。", addFlag: "Credential recovery" }
    ]
  },
  transfer: {
    title: "RECOVERY CHECK · 已經轉帳",
    prompt: "你已經送出一筆款項。現在最先做什麼？",
    choices: [
      { text: "再轉一筆測試，看對方是否退款", ok: false, points: -10, shield: -10, lesson: "不要再增加損失。" },
      { text: "立即聯絡銀行嘗試止付，保留證據並通報警方／反詐管道", ok: true, points: 15, shield: 8, lesson: "正確。時間越短，攔截款項的機會通常越高。", addFlag: "Immediate containment" }
    ]
  },
  payment: {
    title: "RECOVERY CHECK · 付款流程已啟動",
    prompt: "可疑付款已進入流程。你應該？",
    choices: [
      { text: "先不要告訴同事，避免影響關係", ok: false, points: -8, shield: -8, lesson: "延遲通報會讓錯誤付款繼續往下走。" },
      { text: "立即凍結付款、通知財務主管與資安，保留郵件及通話紀錄", ok: true, points: 15, shield: 9, lesson: "正確。快速凍結、通報與保全證據是核心。", addFlag: "Payment containment" }
    ]
  },
  mfa: {
    title: "RECOVERY CHECK · 已核准未知登入",
    prompt: "你已經按下允許。下一步？",
    choices: [
      { text: "再按一次，確認是否真的成功", ok: false, points: -8, shield: -8, lesson: "不要繼續核准未知請求。" },
      { text: "撤銷工作階段、重設密碼並立即聯絡正式 IT／資安管道", ok: true, points: 15, shield: 9, lesson: "正確。先封鎖存取，再處理憑證與通報。", addFlag: "Session revocation" }
    ]
  },
  account: {
    title: "RECOVERY CHECK · 敏感資料已變更",
    prompt: "帳戶資料已被修改。現在？",
    choices: [
      { text: "等下一個薪資週期再觀察", ok: false, points: -7, shield: -7, lesson: "延遲可能造成實際款項損失。" },
      { text: "立即回復原資料、鎖定變更並依 HR／資安流程通報", ok: true, points: 14, shield: 8, lesson: "正確。回復、鎖定與稽核紀錄要同步進行。", addFlag: "Sensitive-change recovery" }
    ]
  },
  document: {
    title: "RECOVERY CHECK · 可疑文件已開啟",
    prompt: "你已經開啟可疑文件。下一步？",
    choices: [
      { text: "繼續閱讀，看看內容是否合理", ok: false, points: -7, shield: -7, lesson: "不要繼續與可能的惡意內容互動。" },
      { text: "停止操作、斷開可疑流程並依公司資安程序通報", ok: true, points: 14, shield: 8, lesson: "正確。不要自行清除證據，由正式程序處理。", addFlag: "Document containment" }
    ]
  },
  incident: {
    title: "RECOVERY CHECK · 安全控制已被停用",
    prompt: "監控或安全控制已經被關閉。現在？",
    choices: [
      { text: "保持關閉，避免干擾調查", ok: false, points: -10, shield: -10, lesson: "失去可視性會讓真正攻擊更難被發現。" },
      { text: "依既定應變流程恢復控制、通知真正指揮鏈並保留稽核紀錄", ok: true, points: 18, shield: 10, lesson: "正確。恢復可視性並回到正式指揮鏈。", addFlag: "Restore controls" }
    ]
  }
};

  window.SCAMSHIELD_CAMPAIGN_DATA = Object.freeze({ stages: STAGES, recovery: RECOVERY });
})();