# 後端 API Issue 清單(v3,2026-08-13)

**取樣來源**:
- v1(2026-05-15):`GET https://feedradar-production.up.railway.app/api/filters` 與 `GET .../api/products?limit=3`
- v2 複測(2026-08-04、2026-08-12):同上端點 + `?form=wet` 抽樣
- v3 複測(2026-08-12~13):`?form=wet` / `?form=dry` 各 100 筆抽樣 + nutritionText 交叉比對 + `GET /api/products/{id}` 探測
**對照基準**:`docs/api-alignment-260429.md` v1.4(2026-05-06)、`docs/api-260429.txt`(後端 v2 spec)
**目的**:列出 live API 與既有對齊文件的所有差異,供後端會議逐項收斂

---

## 現況速覽(2026-08-13 複測)

| # | 議題 | v1 狀態 | 最新複測結果 |
|---|------|---------|-------------|
| 0 | API 間歇性 500 | —(當時正常) | 🔴 **範圍擴大**:filters、products(帶或不帶篩選)都曾 500,隨機漂移、無固定模式 |
| 13 | `GET /api/products/{id}` 不存在 | —(未探測) | 🔴 **v3 新增**:404,單筆端點未實作;詳情頁後端側阻塞 |
| 1 | 沒有濕食 | 🔴 wet = 0 | 🟠 wet = 136 筆(6.5%);**資料源已從 lovecat 1 站擴為 lovecat + petpark 2 站**(解釋全庫 434 → 2087) |
| 2 | age enum 對不上 | 🔴 | 🔴 未解:200 筆抽樣皆 `puppy/adult/senior`,無 `kitten`/`all`;93% 濕食擠在 `adult` |
| 3 | ingredients 拆陣列 | 🔴 | 🔴 未解:仍回陣列、仍無 `ingredientsText` |
| 4 | variants[] 未規格化 | 🔴 | 🔴 未解:乾糧 38% 多規格,欄位仍無文件 |
| 5-12 | P1 群 | 🟡 | 🟡 #8 範圍擴大(見下);#9 已量化歸因(見「歸因分析」) |

**前端側現況(2026-08-13)**:前端已完成 v1.4 契約對齊並上版(5+1 篩選模型、`useApi.ts` normalizer、`/api/products/{id}` mock 路由、`NUXT_LIVE_API=1` live 代理開關)。詳情頁 UI(F16)以 mock 動工中,顯示策略依 v3 歸因分析修正(nutritionText 原樣為主)。**#0 / #13 / #3 一解,前端即可切 live**。

---

## 🧭 歸因分析(v3 新增)— 哪些是爬蟲/資料天生限制,哪些是後端要修的

方法:以 `nutritionText`(原樣字串)與結構化欄位交叉比對 — 「字串有寫但欄位 null」= parse 問題;「字串根本沒寫」= 資料源天生缺。乾糧 100 筆抽樣:

| 營養項 | 來源頁面有寫 | 結構化欄位有值 | 結論 |
|--------|------------|--------------|------|
| 蛋白質 | 76% | 72% | parse 僅漏 4pp,**null 主因是來源頁沒放保證分析** |
| 磷 | 58% | 55% | parse 幾乎沒漏,**42% 是頁面天生沒標** |
| 熱量 | **26%** | 14% | 台灣電商頁不標熱量是常態(alignment §5.2 預期);**天花板就是 26%**,parse 補完也救不了 |
| 纖維 | **74%** | **0%** | 🔴 **純後端問題**:資料在手上,response 沒暴露(#8) |

### 分類總表

**✅ 資料天生缺(來源頁沒寫;後端不必修,前端顯示策略處理)**
- 熱量 74~86% null、磷 45~68% null、蛋白 20~28% null — 上表證明主因是來源頁面沒標
- age 93% 擠在 `adult` — 商品頁常不明標年齡,只能從品名推斷(全齡被保守歸入 adult)
- 品牌字典髒(#10)— 兩個來源站各自的中英混寫習慣;治理合併仍是後端加值責任
- variants 用 `lb` — 來源頁原樣;公制換算是後端加值項

**🟡 爬蟲能力/範圍限制(可爬但沒爬;排 backlog)**
- 全部產品只有 1 張圖(200 筆抽樣 0 筆多圖)— 電商頁多圖,爬蟲只抓首圖;§2.4 的多圖 carousel 暫無用武之地
- 濕食僅 6.5% — 來源站組成使然;已從 1 站擴到 2 站,再加濕食為主的來源可解
- 餵食指南/產地(§11)— 頁面通常有,未納爬取範圍

**🔴 純後端問題(資料在手上,跟爬蟲無關)**
- `ingredientsText` 不存在(#3)— 爬蟲有抓到字串(才拆得出 56 條陣列),是後端拆掉的
- `fiberPct` 0% 暴露(#8)— 74% 文字有纖維數字;同理**水分/灰分/鈣/Omega3/6 全都在 nutritionText 裡但沒結構化**
- 單筆端點 404(#13)、間歇 500(#0)— 伺服器實作問題

> **開會用的一句話**:真正要後端改 code 的只有 4 項(#0/#13/#3/#8),其餘是前端顯示策略與爬蟲 backlog — 實際工作量比清單表面小很多。

---

## 🔴 Ship-blocker(P0,影響 Phase 1 是否能上線)

### #0 — API 間歇性 500,隨機漂移 【v3 更新描述】

- **現況**:故障在端點間漂移、無固定模式 —
  - 8/4:`/api/filters` 500、`/api/products` 正常
  - 8/12:`/api/products`(不帶篩選)連續 3 次 500、`/api/filters` 200、`?form=wet`/`?form=dry` 正常
  - 8/13:`?form=wet` 也曾 500,隔次重試又正常
- **影響**:任何端點都可能無預警掛掉;前端 SSR 有 graceful fallback 不會白頁,但使用者會看到空列表/空篩選
- **要決議的**:
  - (a) 請後端查 log 找根因(疑似 DB 連線池/資源不穩,而非特定查詢)
  - (b) 加健康檢查/告警,避免無聲壞掉

### #13 — `GET /api/products/{id}` 單筆端點不存在 【v3 新增】

- **現況**:`/api/products/245`、`/api/products/241` 皆回 404;live 只有列表端點
- **對照文件**:`docs/API.md` §11(2026-04-26)已請求此端點;alignment doc §2.4 詳情頁依賴它
- **影響**:詳情頁的直接進入、重新整理、分享連結都需要;前端 `useProduct()` composable 與 mock 路由已就緒,就缺 live 對應
- **要決議的**:後端實作 `GET /api/products/{id}`,回傳 shape 同列表單筆(信封 `{success, data}`;404 時回業務錯誤 `{success:false, error:{code:'NOT_FOUND'}}`)

### #1 — 濕食範圍:資料已出現,但佔比僅 6.5%,需重新決議 【v3 補充來源組成】

- **v1 現況**:`/api/filters.forms` 只回 `dry: 404` 與 `treat: 30`,完全沒有 `wet`
- **v2 複測**:`?form=wet` 回 **136 筆**;全庫同時成長到 **2087 筆**(v1 為 434)
- **v3 釐清**:資料源已從 lovecat 單站擴為 **lovecat(53%)+ petpark(47%)** 雙站 — 資料暴增來自加站;濕食佔比低是這兩站品項組成使然,屬爬蟲範圍問題非技術限制
- **對照文件**:CLAUDE.md 開頭明定「Phase 1 focuses on wet food (主食罐)」;alignment doc §2.3 表格 form 列出 `wet | dry`
- **要決議的**:
  - (a) 是否再加濕食為主的來源站,把 wet 佔比拉起來?
  - (b) Phase 1 維持「主食罐優先」(136 筆是否足以上線?)還是改為乾濕都收?
  - (c) `treat`(零食)是否在 Phase 1 範圍?spec v1.7 §15 把零食列在 Phase 2

### #2 — `age` enum 對不上,且缺少 `all` 【v3 補抽樣證據】

- **現況**:Live 回 `puppy | adult | senior`;v3 抽樣 200 筆分佈:濕食 `adult=93, puppy=4, senior=3`、乾糧 `adult=85, puppy=8, senior=7` — 無 `kitten`、無 `all`,全齡明顯被塞進 `adult`
- **對照文件**:alignment doc §3.1 B1 規格為 `kitten | adult | senior | all`
- **影響**:
  - `useApi.ts` `normalizeAge` 會把所有 `puppy` 收斂為 `null`(因為不在白名單)
  - 缺 `all`(全齡)分類,跨年齡產品無法歸位
- **要決議的**:
  - (a) `kitten`(幼貓專用)還是 `puppy`(幼齡通用)?如果貓狗都用同一個 value,文件要改成 `puppy`
  - (b) `all`(全齡)是否要新增?還是後端會繼續把全齡塞進 adult(會丟失語意)
  - (c) 歸因註記:age 高度集中 `adult` 部分是來源頁不標年齡的天生限制,enum 字典本身仍需拍板

### #3 — `ingredients` 被拆陣列,違反 2026-05-06 拍板 【v3 確認純後端問題】

- **現況**:後端回 `ingredients: string[]`(陣列);v3 複測仍是陣列、仍無 `ingredientsText`
- **歸因**:爬蟲**有抓到**完整成分字串(不然拆不出 56 條陣列)— 這是後端 schema 決策問題,與爬蟲無關
- **對照文件**:alignment doc v1.4 §3.2 B6 與 §3.0,2026-05-06 拍板「`ingredientsText` 字串原樣保留,後端不拆陣列」;v1.4 變更紀錄明確寫「後端拆字串會踩括號雷(維生素/礦物質複合配方)」
- **拆得非常糟糕的證據**(id 241 sample):
  ```
  "維生素 (維生素E", "維生素A", "維生素D3", "維生素B12", "維生素C", ...
  "礦物質 (硫酸銅", "碘酸", "硫酸亞鐵", ...
  ```
  括號內子配方全部攤平成獨立 entry,語意完全消失。詳情頁如果照樣顯示會炸成一片
- **影響**:
  - `useApi.ts` 讀 `raw.ingredientsText` 永遠是 `null` — Phase 1 詳情頁規格(§2.4)無法實作
  - 篩選用 `WHERE ingredients_text LIKE '%雞肉%'` 的 SQL 邏輯(§3.0)無法運作 — 前端成分「包含/排除」篩選 UI 已做好,就等這個欄位
- **要決議的**:
  - (a) 後端是要回退決策(改回字串)?還是 2026-05-06 拍板要 strikethrough(改回拆陣列)?
  - (b) 若維持拆陣列,後端要解決括號攤平問題,並提供前端「子配方分組」規則
  - (c) `nutritionText` 已正確保留原始字串,`ingredientsText` 為何不一致?

### #4 — `volume` 不在頂層,新增 `variants[]` 文件完全沒提 【v3 補量化】

- **現況**:Live 回(v3 抽樣:乾糧 38% 多規格、100% 至少 1 個 variant):
  ```jsonc
  {
    "price": 790.0,             // 頂層只有一個價,看起來是最便宜的 variant
    "priceSource": "lovecat",
    "priceUpdatedAt": "2026-05-15T...",
    "variants": [
      { "volume": "14lb", "price": 1690.0, "pricePerGram": 0.266130, "site": "lovecat", "updatedAt": "..." },
      { "volume": "5lb",  "price": 790.0,  "pricePerGram": 0.348331, "site": "lovecat", "updatedAt": "..." }
    ]
  }
  ```
- **對照文件**:alignment doc §3.1 B2 規格為頂層 `volume: string`(單一字串)、B3 為頂層 `price/priceSource/priceUpdatedAt`(單一價格);`variants[]` 在 v1.4 全篇沒出現
- **影響**:
  - 卡片顯示需要決策:選哪個 variant 當主顯示?頂層 `price` 是哪個邏輯選的?
  - `pricePerGram` 是非常關鍵的比價欄位,文件完全沒規格化
  - 雙站(lovecat + petpark)已成事實,多平台比價(spec §15 Phase 3)提早到 Phase 1 來了
- **要決議的**:
  - (a) 確認頂層 `price` 的選擇邏輯(最便宜?第一個?指定平台?)
  - (b) `variants[]` 寫進 alignment doc 規格,包含 `volume / price / pricePerGram / site / updatedAt` 欄位定義
  - (c) 卡片顯示策略:單 variant 簡寫(現況) vs 多 variant 展開
  - (d) `lb` 單位:後端是否能順便轉成 `g/kg`?台灣使用者對 lb 不熟(歸因:來源頁原樣,換算屬後端加值)

---

## 🟡 規格層差異(P1,可吸收但應修文件)

### #5 — `forms` 多出 `treat`(零食)

- **現況**:`forms.value` 多了 `treat`(v1 時 30 筆)
- **對照文件**:alignment doc enum 是 `wet | dry`
- **影響**:`ApiProduct.form` type 要擴成 `'wet' | 'dry' | 'treat'`;Phase 1 是否要呈現零食仍待確認(#1 連動)

### #6 — `isGrainFree` 已有真實值,但比例可疑 【v3 補量化】

- **現況**:v3 乾糧抽樣 **63% 為 `true`** — 比例高到可疑;若只從品名「0%零穀」推斷,來源站以零穀系列為主打會放大偏差
- **對照文件**:alignment doc §3.4 B10 寫「Phase 1 永遠 null,Phase 2 派生」
- **要決議的**:後端的 grain-free 判斷邏輯是什麼?(品名推斷 vs 成分分析)可信度確認前,前端暫不上「無穀」tag/toggle(元件已就緒,隨時可開)

### #7 — 頂層多 `url` 欄位

- **現況**:每筆產品有頂層 `url`(v3 抽樣 100% 有值,雙站網域)
- **對照文件**:alignment doc §11 詳情頁提案曾列 `sourceUrl`,但 §3.6 範例 JSON 沒包進來
- **影響**:正好對應詳情頁的「來源連結」需求;前端 F16 已按 `sourceUrl` 接線(normalizer 對 `url` 取值)
- **建議**:文件補 `url` 為頂層欄位,Phase 1 詳情頁要顯示

### #8 — 結構化營養缺項:fiber 之外,水分/灰分/鈣/Omega 也都沒拆 【v3 範圍擴大】

- **現況**:`nutritionText` 含完整保證分析(id 245 樣本:蛋白/脂肪/纖維/水分/灰分/Omega3/Omega6/鈣/磷),但 response 只結構化了 protein/fat/carbs/phosphorus 四項;**纖維 74% 文字有、欄位 0% 暴露**;水分/灰分/鈣/Omega 完全沒有對應欄位
- **對照文件**:alignment doc §3.6 範例 JSON 有 `fiberPct`;§3.2 B5b 明定 fiber 要拆;§2.4 詳情頁要「完整保證分析」
- **影響**:詳情頁的結構化保證分析表做不全 — **前端 F16 已改以 `nutritionText` 原樣段落為主要顯示**(覆蓋率 88~93%,最高),結構化欄位當輔助,此問題從 ship-blocker 降為體驗優化
- **要決議的**:後端 parse 內部已有 fiber(碳水公式驗算正確,見 #11),暴露成本極低;水分/灰分/鈣/Omega 是否 Phase 1 補拆?

### #9 — `caloriesKcalPerKg` / `phosphorusPct` 高 null 比例 【v3 已歸因,轉前端顯示策略】

- **量化結果**(見「歸因分析」):熱量來源頁僅 26% 有標(欄位 14%)、磷 58% 有標(欄位 55%)— **null 主因是來源頁天生沒寫,parse 幾乎沒漏**
- **結論**:此項**不要求後端修**(修不了),轉為前端顯示策略:null 整行不渲染(卡片已如此)、詳情頁同樣處理;熱量 parse gap(26%→14%)後端可小幅補強但天花板就在那
- 保留一個請求:後端跑一次全庫統計(熱量/磷 覆蓋率 by form),供上線前 UX 評估

---

## ⚠️ 資料品質問題(P1,非 schema 但嚴重影響 UX)

### #10 — 品牌字典極度髒,大量同品牌切成多 entry

抽樣 live `/api/filters.brands` 觀察到的明顯重複(v1 取樣;雙站後預期更髒):

| 應合併群 | Live 上的多個 entry(count) |
|----------|--------------------------|
| 法米納 | `法米納`(8) + `Famina法米納`(10) |
| 希爾思 | `希爾思`(6) + `Hills希爾思`(10) |
| 皇家(?) | `皇家`(35) + `法國皇家`(12) ← 待確認是否同一家 |
| 紐頓 | `紐頓`(6) + `nutram紐頓`(4) + `nutram 紐頓`(3,半形空格差異) |
| 優格 | `優格`(7) + `TomaPro優格`(9) |
| 愛肯拿 | `愛肯拿`(3) + `ACANA愛肯拿`(4) |
| 歐睿健 | `歐睿健`(4) + `ORIJEN歐睿健`(2) |
| 耐吉斯 | `耐吉斯`(3) + `SOLUTION耐吉斯`(6) |
| 莫比 | `莫比Mobby`(3) + `莫比 MOBBY`(2,半形空格 + 大小寫) |
| 倍力 | `倍力`(2) + `BLUE BAY倍力`(2) |
| HALO | `HALO`(2) + `HALO 嘿囉`(6) |
| Wellness | `WELLNESS`(3) + `Wellness寵物健康`(2) |
| 瑞威 | `瑞威`(4) + `瑞威Real Nature`(6) |
| 開放農場 | `開放農場Open Farm`(3) + `OpenFarm`(1) |
| 野性魅力 | `野性魅力`(1) + `野性魅力CHARM`(3) |
| 阿提拉 | `阿提拉`(1) + `ATTILA阿提拉`(3) |
| 歐娜特 | `歐娜特`(4) + `Ownat歐娜特`(3) |
| ADD | `ADD經典`(1) + `ADD珍島`(1) ← 待確認是否同一家 |

- **歸因**:兩個來源站各自的命名習慣,天生髒;但字典治理(合併表 / `brandSlug`)是後端責任
- **要決議的**:
  - (a) 後端能否跑一次合併?(類似商品中文/英文混名表)
  - (b) 是否引入 `brandSlug` 欄位?(value 是 slug,label 是首選顯示名)— 對應 alignment doc §3.5 B12
  - (c) Phase 1 暫時不做,Phase 2 再清?

### #11 — 碳水公式可能未扣 fiber

抽 id 241 計算:
- nutritionText:protein 24% + fat 8% + fiber 8% + moisture 10% + ash 8% = 58%
- 公式預期 `carbsPct = 100 - 24 - 8 - 8 - 10 - 8 = 42%`
- Live 回 `carbsPct: 42` ✅ 對

id 235:公式預期 37.5%,live 回 37.5% ✅;id 240:公式預期 35%,live 回 35% ✅

✅ **更正**:公式正確,前提是 fiber 有從 nutritionText parse 到。問題退回 #8(fiber 內部有用、response 沒暴露)。

### #12 — `ingredients[]` 子配方括號攤平

承接 #3,即使後端決定維持拆陣列,以下解析方式不可接受:
- 原始字串:`...維生素(維生素E、維生素A、維生素D3...)、礦物質(硫酸銅、碘酸鈣...)`
- Live 拆成:`["維生素 (維生素E", "維生素A", "維生素D3", ..., "礦物質 (硫酸銅", "碘酸鈣", ...]`
- 後端應改為:
  - 維持原始字串(回 #3 拍板),或
  - 拆但保留括號分組,例如 `[..., { group: "維生素", items: ["維生素E", "維生素A", ...] }, ...]`

---

## 📋 決議優先順序建議(v3 更新)

1. **先修 #0**(間歇 500,隨機漂移)— 穩定性優先於一切;順便說明雙站爬蟲架構現況
2. **實作 #13**(`GET /api/products/{id}`)— 詳情頁後端側唯一缺口,工作量小
3. **同步解 #3**(ingredientsText 回歸字串)— 前端成分篩選與詳情頁成分區塊都在等
4. **重議 #1**(濕食 6.5%:加來源站 vs 改 Phase 1 範圍)
5. **#4 variants[] 規格化** + **#2 age enum 拍板**
6. **#8 補拆纖維(低成本)**,水分/灰分/鈣/Omega 可後補 — 前端已用 nutritionText 原樣顯示頂住
7. **#5-#7、#9 文件補登/統計請求** — 不阻塞
8. **#10 品牌治理** — 可 Phase 1 內處理也可推 Phase 2

> **給後端的整體訊息**:真正要改 code 的只有 #0/#13/#3/#8 四項,其餘是文件補登、爬蟲 backlog 與前端顯示策略。前端已對齊 v1.4 契約、詳情頁以 mock 動工中,可一鍵切 live(`NUXT_LIVE_API=1`)— 四項解掉後數天內可上線。

---

## 變更紀錄

| 日期 | 變更 |
|------|------|
| 2026-05-15 | 首版,抓 live API 取樣 + diff `api-alignment-260429.md` v1.4 |
| 2026-08-12 | v2:複測 live API(8/4、8/12)。新增 #0(filters 500);#1 情勢更新(wet 136 筆、全庫 2087 筆);#2/#3/#4 確認未解;新增「現況速覽」表與前端就緒狀態 |
| 2026-08-13 | v3:新增「歸因分析」章(nutritionText 交叉比對,區分 天生缺/爬蟲範圍/純後端);新增 #13(單筆端點 404);#0 更新為隨機漂移;#1 補雙站來源(lovecat+petpark);#2/#4/#6 補抽樣量化;#8 範圍擴大(水分/灰分/鈣/Omega);#9 歸因後轉前端顯示策略;優先順序改版 |
