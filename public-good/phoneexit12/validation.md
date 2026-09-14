# PhoneExit 12｜第一輪真實需求驗證

## 最新需求訊號（2026/9/14）
- 環境部資源循環署資料指出：臺灣每年約銷售500萬支手機，廢手機目前回收率僅約12%。
- 超過5成民眾把舊手機閒置在家；常見原因包括不知道回收點、缺乏回收誘因，以及擔心個資外洩。
- 2026/1/1起手機回收與循環服務新制進一步落地，製造／輸入業者年度循環率目標為15%，相關品牌／販售通路需提供回收設施與個資防護／銷毀措施。
- Apple、Google、Samsung的現行官方說明都把「先備份，再做完整清除／恢復原廠」列為交付舊機前的核心動作。
- Apple特別區分「Reset All Settings」與「Erase All Content and Settings」：前者不會刪照片、訊息、App與文件。
- Samsung台灣於2026/9/3更新原廠重設說明，並提醒Google FRP／帳號驗證問題。
- Google Android說明指出，原廠重設會清除手機資料；透過按鍵Recovery或遠端重設時仍可能觸發裝置保護驗證。

## 具體痛點
1. 有舊手機，但怕資料外洩所以一直囤著。
2. 以為「重設設定」等於「刪除個資」。
3. 忘記拔SIM／microSD。
4. 忘記eSIM、Activation Lock、Google FRP，導致下一位使用者無法啟用。
5. 螢幕壞掉／無法開機時，不知道如何安全處理。
6. 有人想靠鑽孔、敲碎等危險方式自行「物理清除」，忽略鋰電池風險。
7. 不知道正式回收／維修通路本來就可以成為無法自行清除時的資料防護出口。

## MVP
- 能開機／螢幕壞／無法解鎖／無法開機分流。
- iPhone／Samsung／其他Android清除路徑。
- 備份、SIM／microSD、eSIM、完整重設、初始設定畫面、Activation Lock／FRP、電池安全7項防漏。
- 「可再利用交付」與「只能先走正式資料防護／回收」總閘門。
- 直連環境部站點、回收專線與原廠清除說明。
- 不收任何帳號、IMEI、序號、電話、照片或備份內容。
- Public Good Lab匿名量測＋Issue #143。

## 第一輪硬門檻
- 100位獨立使用者
- 60人完成一支舊手機退役前篩
- 40人完成至少5項清除／防漏
- 25人真的把一支閒置手機送進舊機買回、正式回收或安全再利用
- 10人原本因個資疑慮不敢處理，最後完成交付
- 5人修正「重設所有設定＝已刪資料」誤解
- 至少5個可重複摩擦點

## 不蒐集
IMEI、序號、電話號碼、Email、Apple／Google／Samsung帳號、照片、簡訊、備份、交易單據、精確設備清單。

## 來源
- 環境部回收率／閒置原因：https://recycle.moenv.gov.tw/News/NewInfo/2446
- 2026手機循環新制：https://recycle.moenv.gov.tw/News/NewInfo/2559
- 全國循環／維修站點：https://recycle.moenv.gov.tw/utmap/stations
- Apple出售／贈送前：https://support.apple.com/en-is/109511
- Apple完整清除：https://support.apple.com/en-us/108931
- Samsung原廠重設：https://www.samsung.com/tw/support/mobile-devices/perform-a-factory-reset-on-samsung-galaxy-device/
- Android原廠重設：https://support.google.com/android/answer/6088915?hl=zh-Hant
