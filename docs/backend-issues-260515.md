# 後端 API Issue 清單(v2,2026-08-12)

**取樣來源**:
- v1(2026-05-15):`GET https://feedradar-production.up.railway.app/api/filters` 與 `GET .../api/products?limit=3`
- v2 複測(2026-08-04、2026-08-12):同上端點 + `?form=wet` 抽樣
**對照基準**:`docs/api-alignment-260429.md` v1.4(2026-05-06)、`docs/api-260429.txt`(後端 v2 spec)
**目的**:列出 live API 與既有對齊文件的所有差異,供後端會議逐項收斂

---

## 現況速覽(2026-08-12 複測)

| # | 議題 | v1 狀態 | v2 複測結果 |
|---|------|---------|-------------|
| 0 | `/api/filters` 500 | —(當時正常) | 🔴 **新增**:8/4、8/12 兩次實測皆 500,已非間歇 |
| 1 | 沒有濕食 | 🔴 wet = 0 | 🟠 **情勢已變**:wet = 136 筆(全庫 6.5%),需重新決議範圍 |
| 2 | age enum 對不上 | 🔴 | 🔴 未解(filters 掛掉無法看全字典;product 抽樣仍見 `adult`) |
| 3 | ingredients 拆陣列 | 🔴 | 🔴 未解:仍回陣列、仍無 `ingredientsText` |
| 4 | variants[] 未規格化 | 🔴 | 🔴 未解:仍在回、alignment doc 仍無此欄位 |
| — | 資料集規模 | 434 筆(dry 404 + treat 30) | 2087 筆(+380%),來源與組成待後端說明 |
| 5-12 | P1 群 | 🟡 | 🟡 未複測到變化,維持原案 |

**前端側現況(2026-08-12)**:前端已完成 v1.4 契約對齊並上版(5+1 篩選模型、`useApi.ts` normalizer、`/api/products/{id}` mock 路由、`NUXT_LIVE_API=1` live 代理開關)。**#0 / #3 / #4 一解,前端即可切 live**;瓶頸在後端側。

---

## 🔴 Ship-blocker(P0,影響 Phase 1 是否能上線)

### #0 — `/api/filters` 持續回 500 【v2 新增】

- **現況**:2026-08-04 與 2026-08-12 兩次實測皆回 HTTP 500;`/api/products` 同時段正常
- **影響**:前端側欄的所有篩選選項來自此端點,掛掉 = 篩選功能全滅。這排在所有 schema 爭議之前
- **要決議的**:
  - (a) 請後端查 log 找出 500 根因(疑似資料集暴增後 aggregation 出錯?)
  - (b) 是否需要為此端點加健康檢查/告警,避免無聲壞掉

### #1 — 濕食範圍:資料已出現,但佔比僅 6.5%,需重新決議 【v2 情勢更新】

- **v1 現況**:`/api/filters.forms` 只回 `dry: 404` 與 `treat: 30`,完全沒有 `wet`
- **v2 複測**:`?form=wet` 回 **136 筆**;全庫同時成長到 **2087 筆**(v1 為 434)
- **對照文件**:CLAUDE.md 開頭明定「Phase 1 focuses on wet food (主食罐)」;alignment doc §2.3 表格 form 列出 `wet | dry`
- **影響**:ProductCard 的 `MACRO_MAX_BY_FORM`、視覺設計、磷顯示策略都是以濕食為主鎖定的
- **要決議的**:
  - (a) 這波資料成長(+380%)是爬蟲範圍/來源改了什麼?濕食 136 筆還會再長嗎?
  - (b) Phase 1 維持「主食罐優先」(136 筆是否足以上線?)還是改為乾濕都收?
  - (c) `treat`(零食,v1 時 30 筆)是否在 Phase 1 範圍?spec v1.7 §15 把零食列在 Phase 2

### #2 — `age` enum 對不上,且缺少 `all` 【v2 未解】

- **現況**:Live 回 `puppy | adult | senior`(v2 複測:filters 掛掉無法看全字典;product 抽樣仍見 `adult`)
- **對照文件**:alignment doc §3.1 B1 規格為 `kitten | adult | senior | all`
- **影響**:
  - `useApi.ts` `normalizeAge` 會把所有 `puppy` 收斂為 `null`(因為不在白名單)
  - 缺 `all`(全齡)分類,跨年齡產品無法歸位 — 但 sample 看起來 `0%零穀全齡犬` 系列都被歸到 `adult`,後端可能把全齡塞進 adult
- **要決議的**:
  - (a) `kitten`(幼貓專用)還是 `puppy`(幼齡通用)?如果貓狗都用同一個 value,文件要改成 `puppy`
  - (b) `all`(全齡)是否要新增?還是後端會繼續把全齡塞進 adult(會丟失語意)

### #3 — `ingredients` 被拆陣列,違反 2026-05-06 拍板 【v2 未解】

- **現況**:後端回 `ingredients: string[]`(陣列);**v2 複測(2026-08-12)仍是陣列、仍無 `ingredientsText`**
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

### #4 — `volume` 不在頂層,新增 `variants[]` 文件完全沒提 【v2 未解】

- **現況**:Live 回(v2 複測仍同):
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
  - 多容量 + 多平台是 spec §15 Phase 3 「多平台比價」的核心,提早到 Phase 1 來了
- **要決議的**:
  - (a) 確認頂層 `price` 的選擇邏輯(最便宜?第一個?指定平台?)
  - (b) `variants[]` 寫進 alignment doc 規格,包含 `volume / price / pricePerGram / site / updatedAt` 欄位定義
  - (c) 卡片顯示策略:單 variant 簡寫(現況) vs 多 variant 展開(像 spec §15 Phase 3)
  - (d) `lb` 單位:後端是否能順便轉成 `g/kg`?台灣使用者對 lb 不熟

---

## 🟡 規格層差異(P1,可吸收但應修文件)

### #5 — `forms` 多出 `treat`(零食)

- **現況**:`forms.value` 多了 `treat`(v1 時 30 筆;v2 因 filters 掛掉無法確認最新數)
- **對照文件**:alignment doc enum 是 `wet | dry`
- **影響**:`ApiProduct.form` type 要擴成 `'wet' | 'dry' | 'treat'`;Phase 1 是否要呈現零食仍待確認(#1 連動)

### #6 — `isGrainFree` 已有真實值,Phase 1 可提前上

- **現況**:Sample 3 筆 `isGrainFree: true` 都是「0%零穀」系列
- **對照文件**:alignment doc §3.4 B10 寫「Phase 1 永遠 null,Phase 2 派生」
- **影響**:
  - 卡片可以開始顯示「無穀」tag,提前實作 Phase 2 規劃功能
  - 篩選器可新增「無穀」toggle(前端 `FilterToggle.vue` 元件已就緒,可直接重用)
- **要決議的**:後端是不是已經有 grain-free 判斷邏輯?還是只從產品名稱「0%零穀」字串推斷?(若是後者,可信度有限)

### #7 — 頂層多 `url` 欄位

- **現況**:每筆產品有頂層 `url`,值為 `lovecat.com.tw/products/...`
- **對照文件**:alignment doc §11 詳情頁提案曾列 `sourceUrl`,但 §3.6 範例 JSON 沒包進來
- **影響**:正好對應詳情頁的「來源連結」需求,可直接使用
- **建議**:文件補 `url` 為頂層欄位,Phase 1 詳情頁要顯示

### #8 — `fiberPct` 沒拆出來

- **現況**:`nutritionText` 含「粗纖維 最高量 8.00%」,但 `fiberPct` 欄位沒在 response 裡
- **對照文件**:alignment doc §3.6 範例 JSON 有 `fiberPct: 3.5`;§3.2 B5b 明定 fiber 要拆
- **影響**:Phase 1 詳情頁規格(§2.4「完整保證分析」)缺粗纖維;碳水公式驗算證明後端內部有 parse fiber(見 #11),只是沒暴露到 response
- **要決議的**:內部有用但不暴露是設計選擇?還是漏掉?(前端 `ProductNutrition.fiberPct` 欄位已預留)

### #9 — `caloriesKcalPerKg` / `phosphorusPct` 高 null 比例

- **現況**:Sample 3 筆熱量全是 `null`;磷只有 id 241 有 `0.37`,另兩筆 `null`
- **對照文件**:alignment doc §3.3 B8 接受 sparse,§5 熱量研究也說中小品牌不一定標
- **影響**:跟文件預期一致 — 但資料集已從 434 → 2087 筆,null 比例可能已變;若 > 70% 卡片大量「—」會難看
- **要決議的**:後端能否提供「有熱量資料的產品比例」、「有磷資料的產品比例」?(全庫統計,順便按 form 分組)

---

## ⚠️ 資料品質問題(P1,非 schema 但嚴重影響 UX)

### #10 — 品牌字典極度髒,大量同品牌切成多 entry

抽樣 live `/api/filters.brands` 觀察到的明顯重複(v1 取樣;很可能還有更多未列出,v2 因 filters 掛掉無法複測):

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

- **影響**:使用者要找一個品牌可能要勾 2-3 個 checkbox;v1 時 110+ 個品牌已有 1/4 冗餘,資料集翻 5 倍後髒度預期更高
- **要決議的**:
  - (a) 後端能否跑一次合併?(類似商品中文/英文混名表)
  - (b) 是否引入 `brandSlug` 欄位?(value 是 slug,label 是首選顯示名)— 對應 alignment doc §3.5 B12
  - (c) Phase 1 暫時不做,Phase 2 再清?

### #11 — 碳水公式可能未扣 fiber

抽 id 241 計算:
- nutritionText:protein 24% + fat 8% + fiber 8% + moisture 10% + ash 8% = 58%
- 公式預期 `carbsPct = 100 - 24 - 8 - 8 - 10 - 8 = 42%`
- Live 回 `carbsPct: 42` ✅ 對

id 235:
- nutritionText:protein 24% + fat 12% + fiber 7% + moisture 10% + ash 9.5% = 62.5%
- 公式預期 = 37.5%
- Live 回 `carbsPct: 37.5` ✅ 對

id 240:
- nutritionText:protein 27% + fat 13% + fiber 5.5% + moisture 10% + ash 9.5% = 65%
- 公式預期 = 35%
- Live 回 `carbsPct: 35` ✅ 對

✅ **更正**:公式正確,但前提是 fiber 有從 nutritionText parse 到。問題退回 #8(fiber 為何沒暴露成欄位?後端內部有用、但沒寫到 response)。**要決議的**:fiber parse 內部用了但不暴露給前端是設計選擇?還是漏掉?

### #12 — `ingredients[]` 子配方括號攤平

承接 #3,即使後端決定維持拆陣列,以下解析方式不可接受:
- 原始字串:`...維生素(維生素E、維生素A、維生素D3...)、礦物質(硫酸銅、碘酸鈣...)`
- Live 拆成:`["維生素 (維生素E", "維生素A", "維生素D3", ..., "礦物質 (硫酸銅", "碘酸鈣", ...]`
- 後端應改為:
  - 維持原始字串(回 #3 拍板),或
  - 拆但保留括號分組,例如 `[..., { group: "維生素", items: ["維生素E", "維生素A", ...] }, ...]`

---

## 📋 決議優先順序建議(v2 更新)

1. **先修 #0**(`/api/filters` 500)— 端點掛掉,其他都免談;順便說明資料集 434 → 2087 的來源變化
2. **重議 #1**(濕食 136 筆 / 6.5% 佔比,Phase 1 範圍是否維持主食罐優先)
3. **同步解 #3 / #4**(成分拆 vs 不拆、`variants[]` 規格化)— 影響核心元件 ProductCard 與詳情頁能否動工
4. **再解 #2**(age enum)— 1 行代碼修正,但要先決定 value 字典
5. **#5-#9 文件補登** — 後端不必大改 code,只需 alignment doc 補欄位(#8 順手暴露 `fiberPct`)
6. **#10**(品牌字典治理)— 可 Phase 1 內處理也可推 Phase 2
7. **#11 / #12** — #11 已自我釐清(回到 #8);#12 跟 #3 連動

> **給後端的整體訊息**:前端已對齊 v1.4 契約並可一鍵切 live(`NUXT_LIVE_API=1`),#0/#3/#4 解掉後,前端切換上線只需數天。

---

## 變更紀錄

| 日期 | 變更 |
|------|------|
| 2026-05-15 | 首版,抓 live API 取樣 + diff `api-alignment-260429.md` v1.4 |
| 2026-08-12 | v2:複測 live API(8/4、8/12)。新增 #0(filters 持續 500);#1 情勢更新(wet 136 筆、全庫 2087 筆);#2/#3/#4 確認未解;新增「現況速覽」表與前端就緒狀態;優先順序改版 |
