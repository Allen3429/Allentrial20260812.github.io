# 行動20 / Action20

**把好意，變成下一步。** 20 個免費、免登入、瀏覽器本機運算的社會行動工具。

- 公開入口：https://allen3429.github.io/Allentrial20260812.github.io/public-good/action20/
- 公開試用與回饋：https://github.com/Allen3429/Allentrial20260812.github.io/issues/150
- 版本：1.0（2026-09-14）；公開測試版，尚不宣稱已驗證社會影響。

## 特定使用者與第一個成功動作

| 對象 | 工具入口 | 具體成功動作 |
|---|---|---|
| 5–20 人大學服務隊排班幹部 | `?tool=roster` | 產生下次活動的排班，人工確認後交給志工 |
| 小型公益組織專案助理、倉管 | `?tool=supplies` | 用真實盤點列出需求缺口，向單位確認 |
| 社團總務 | `?tool=budget` | 匯出一次活動的預算／缺口 |
| 社區活動小編 | `?tool=readable` / `?tool=contrast` | 檢查下一則公告，並請目標讀者確認 |
| 課輔志工 | `?tool=quiz` | 完成一次自製問答並保留錯題 |

## 全部工具

1. `priority` 需求優先排序：自訂分數，非客觀影響評估。
2. `brief` 一頁行動提案：分開假設、證據及測試。
3. `interview` 需求訪談小抄：依真實經驗詢問，不代填答案。
4. `roster` 志工排班與缺口：貪婪法初稿，非最佳化保證。
5. `agenda` 活動流程時間表：支援跨日標記。
6. `budget` 活動預算與缺口：逐項成本、每人成本與缺口。
7. `access` 友善活動待辦檢查：自述檢查，非認證。
8. `readable` 公告斷句與閱讀檢查：規則式，不是 AI 語意改寫。
9. `contrast` 文字色彩對比：不透明 sRGB 色碼；不代表整站符合 WCAG。
10. `handoff` 會議待辦與交接：到期日、逾期與完成分離。
11. `meals` 活動餐點份數：備用份數的餐別須再確認。
12. `supplies` 物資需求缺口表：不是即時捐贈媒合。
13. `pantry` 期限盤點與先後順序：不是食品安全判斷。
14. `reuse` 二手物品轉贈文：文案需由使用者確認和發布。
15. `energy` 用電情境估算：固定功率假設，無不明排碳係數。
16. `reusables` 重複用品成本比較：不是環境生命週期回本。
17. `study` 陪讀時間分配：依權重分配整數時段。
18. `quiz` 自製問答練習：文字正規化比對，包含錯題匯出。
19. `outreach` 受眾邀請與來源連結：文案及 UTM，非自動社群發布。
20. `impact` 小規模驗證判讀：嚴格分開瀏覽、完成、回饋與自述行動。

## 使用

選工具 → 可先填範例 → 改成自己的非敏感資料 → 產出 → 複製／匯出 Markdown／列印 → 人工確認後使用。
分享只包含工具 ID，不包含表單內容。切換／重整不保留表單；請先匯出。工具不需要付費 AI API，沒有建置套件依賴。下載 `index.html`、`engine.js`、`app.js` 放在同一資料夾即可運行核心功能；第三方回饋需要網路。

## 測試與部署

`node public-good/action20/test.cjs`

初版核心邏輯 125 項測試通過。另已在離線 Chromium DOM 上以 1440px 與 390px 寬度，各跑過 20 個工具；包含問答、匯出、HTML 字面顯示和模擬計數去重。離線測試模擬了網路及 localStorage，不能當成正式站端到端驗證。

GitHub Pages 由既有儲存庫部署。部署狀態及獨立 HTTP 驗證以 Actions 實際結果為準，不以 push 成功冒充上線成功。

## 隱私與數字限制

表單內容不離開頁面。localStorage 只保存同意偏好與近似去重標記。GitHub Pages 與使用者選用的計數供應商仍可能接收 IP／連線日誌，不能宣稱完全匿名。

計數預設關閉；同意後使用第三方 Abacus 公開 counter API，namespace 為 `pglab-action20-20260914-v1`。工具運作不依賴此服務。只傳工具代號、事件代號、有限來源分類及選项回饋。`?test=1`、本機與範例不送正式採用計數。

- `visitors`：同意計數的近似獨立瀏覽器。
- `completers`：使用者標示非範例且成功完成核心操作的近似瀏覽器。
- `completed-<tool>`：每工具的近似完成瀏覽器；不是所有按鈕點擊。
- `feedback`：自願選項回饋者的近似瀏覽器。
- `real`：自述已將結果用於現實行動的近似瀏覽器；未經查證。
- `source-<allowed-source>-visitors/completed`：有限來源分類。

數字可能受跨裝置、清除標記、第三方故障或公開 API 濫用影響。失敗顯示不可用，不顯示虛構零或成功。自述不是真實世界效益的證明。具體文字回饋在 issue #150 公開，須有 GitHub 帳號；不能貼受服務者個資。

首輪驗證目標（不是已有成果）：10 個完成者、3 份具體回饋、1 次自述實際採用。不達標就先修正，不宣稱成功。

## 推廣

已建立 owned-channel 公開招募 issue #150。外部投稿／邀請的送出與回覆分開紀錄；未送出、未獲審核、未獲回覆均不得標成已觸及或合作。候選對口：NPOst 公益交流站編輯部、g0v 公民科技社群，以及大學服務性社團。尊重各頻道規範，不批量私訊、不冒用機構名義。

## 來源（2026-09-14 查核）

- W3C 對比定義：https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- W3C 友善活動參考：https://www.w3.org/WAI/teach-advocate/accessible-presentations/
- NPOst 合作聯絡：https://npost.tw/what-is-npost
- g0v 社群聯絡：https://g0v.tw/intl/zh-TW/contact/

MIT License，限本目錄新建立的程式；不改變儲存庫其他內容的授權。
