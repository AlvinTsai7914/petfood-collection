# 前後端對齊決策文件

**日期**:2026-04-29
**對應後端文件**:`docs/api-260429.txt`(後端 v2)
**前端契約現況**:`docs/API.md`(v1.2,已落後)
**狀態**:草稿,待後端會議確認

---

## 0. 文件目的

後端文件已歷經 v1(`docs/API.md` §10 對應的 live backend 觀察) → v2(`docs/api-260429.txt`)兩版,雙方契約反覆飄移。本文件以 **「以包裝實際標示為準 + 爬得到的先做,爬不到的 Phase 2」** 原則,把 Phase 1 範圍縮減到可上線的最小子集,並列出後端要修改 / 補的欄位、前端要動的元件,以及 Phase 2 待辦。

---

## 1. 設計原則(Phase 1 縮減根據)

| 原則 | 說明 |
|------|------|
| **包裝有的優先** | 動保法第 22-5 條強制標示的欄位(品名、淨重、主要原料、營養成分、適用寵物種類)是後端可靠抓得到的「硬資料」 |
| **法規限制宣稱的緩做** | 寵食包裝不能涉醫療效能(如「治療腎病」),「機能配方」標籤多數品牌不會直接寫,後端難爬,Phase 1 緩做 |
| **行銷標籤要客觀化** | 「低敏」是業者宣稱,各家定義不同,Phase 1 取消;Phase 2 改用客觀標準(單一蛋白源、水解蛋白) |
| **null 是合法狀態** | 包裝沒標的欄位(磷、熱量在中小品牌)接受 sparse,不為了齊全勉強造資料 |
| **schema 保留 > 砍欄位** | 即使 Phase 1 後端永遠回 `[]`,schema 欄位也保留,Phase 2 加值時前端 / 契約不破壞 |
| **派生欄位由後端計算** | 任何需要從原始資料推算的值(`isGrainFree`、`phosphorusMgPer100kcal`、Phase 2 碳水公式等)都在後端算完寫進 DB 直接給前端;前端只負責**渲染與互動**,不做字串 parse、不做計算、不做派生邏輯。理由:後端算 1 次永久存,前端算等於每個使用者重複做同一件事;且 server-side 排序 / 篩選必須有結構化欄位 |

---

## 2. Phase 1 最終範圍

### 2.1 卡片要顯示的資訊

| 欄位 | 來源 | 備註 |
|------|------|------|
| 產品名稱 | 後端 `title` | 動保法強制 |
| 品牌 | 後端 `brand` | 動保法強制 |
| 產品 ID | 後端 `id`(整數) | 顯示 `#1` 或 `PROD-1` |
| 類型(貓/狗) | 後端 `petType` | 動保法強制 |
| 食物型態(濕/乾) | 後端 `form` | 業界慣例 |
| 適用年齡 | 後端 `age` ✨ 待補 | 業界慣例 |
| 容量 | 後端 `volume` ✨ 待補(純重量) | 動保法強制 |
| 價格 | 後端 `price` ✨ 待補 + 資料來源 | 從指定平台爬 |
| 圖片 | 後端 `images[0]` ✨ 待補 | 從電商爬 |
| 蛋白質 % | 後端 `proteinPct`(數字) | macro bar 第 1 條 |
| 脂肪 % | 後端 `fatPct`(數字) | macro bar 第 2 條 |
| 碳水 % | 後端 `carbsPct`(數字,後端公式算) ✨ Phase 1 確定加入 | macro bar 第 3 條;公式 `100 - protein - fat - fiber - moisture - ash`,任一輸入 null 整欄位 null |
| 熱量 | 後端 `caloriesKcalPerKg` ✨ 改格式 | 純文字,直接顯示「4200 大卡/kg」 |
| 磷 | 後端 `phosphorusPct` ✨ 待補 | 顯示「磷 0.9%」,有值才渲染,接受多數 null;**Phase 1 + Phase 2 都用 %**(2026-05-06 後端會議定案,放棄 mg/100kcal 雙標升級) |
| 處方飼料 tag | 後端 `isPrescription === true` | 有才顯示 |

### 2.2 卡片**不**顯示

- ❌ 粗纖維(量級小、量級不適合上 macro bar,移到詳情頁)
- ❌ 灰分 / 水分(同上,移到詳情頁)
- ❌ 口味 tag(包裝沒此欄位,只能從成分推斷,改成成分篩選邏輯)
- ❌ 機能配方 tag(後端 Phase 1 難爬,schema 保留但 Phase 1 不渲染)
- ❌ 無穀 / 低敏 tag(Phase 1 不做,見 §6)
- ❌ 備貨狀態(讓使用者去平台看)

### 2.3 篩選器(Sidebar / Drawer)從 7 組砍到 5 + 1 組

| # | 篩選組 | 來源 | 說明 |
|---|-------|------|------|
| 1 | 類型(貓/狗) | `/api/filters.petTypes[]` | ✅ 已有 |
| 2 | 食物型態(濕/乾) | `/api/filters.forms[]` | ✅ 已有 |
| 3 | 適用年齡 | `/api/filters.ages[]` ✨ 待後端補 | 幼/成/老/全齡 |
| 4 | 品牌 | `/api/filters.brands[]` | ✅ 已有 |
| 5 | 成分(取代口味) | `/api/filters.ingredients[]` | ✅ 已有,**支援 include / exclude** |
| 6 | 處方飼料 toggle | `/api/filters.isPrescription` | ✅ 已有,boolean toggle |

**砍掉**:口味、機能配方、特殊配方(無穀、低敏)— 共三組

### 2.4 詳情頁(Phase 1 要做)

`/products/[id]` 頁面顯示:
- 完整保證分析(蛋白 / 脂肪 / 粗纖維 / 水分 / 灰分 / 磷 / 鈣 / Omega 等所有 backend 抓得到的)
- 完整成分(`ingredientsText` 純文字段落原樣顯示;不做 chip 互動)
- 多圖 carousel(`images: string[]`)
- 熱量 / 容量 / 價格 / 處方標籤等所有卡片資訊

---

## 3. 後端要修改 / 提供的欄位

### 3.0 兩個「成分」欄位的概念分離(2026-05-06 補)

成分相關的 API 欄位有兩個,**語意完全不同,後端要分開治理**:

| 欄位 | 性質 | 治理規則 |
|------|------|---------|
| `/api/filters.ingredients[]` | **篩選字典** — 後端維護的精選關鍵成分(主原料 + 高頻成分),用於首頁 IngredientFilter dropdown | 後端 governance(類似 `brand` 字典),append-only,N 個關鍵成分;**字典 ⊂ 任一產品的 ingredientsText 子字串** |
| `product.ingredientsText` | **產品實際成分** — 從包裝成分標示原樣存的字串(可能含括號子配方、維生素複合) | 從爬蟲抓到字串原樣存,**後端不拆**;Phase 2 派生欄位(grain-free)用 SQL `LIKE` 規則 |

**首頁篩選邏輯**:`?ingredient=雞肉` → 後端 `WHERE ingredients_text LIKE '%雞肉%'`;多值 `?ingredient=雞肉,鮭魚` → OR(`LIKE '%雞肉%' OR LIKE '%鮭魚%'`);`?excludeIngredient=牛肉` → AND NOT(`NOT LIKE '%牛肉%'`)。

**前端詳情頁顯示**:`ingredientsText` 用 `<p>` 純文字段落原樣顯示,不切 chip、不做點擊互動 — 因為完整成分多數不在篩選字典內,點擊互動會誤導使用者(見 §2.4)。

### 3.1 必補欄位(🔴 Phase 1 ship-blocker)

| # | 欄位 | 規格 | 取得方式 |
|---|------|------|---------|
| B1 | `age` + `/api/filters.ages[]` | `value: "kitten"\|"adult"\|"senior"\|"all"`,`label: "幼貓/幼犬"`... | 包裝慣例,可爬 |
| B2 | `volume` | 純重量字串 `"165g"`、`"2kg"`,**不含**備貨狀態 | 動保法強制(淨重) |
| B3 | `price` + `priceSource` + `priceUpdatedAt` | `price: number\|null`,`priceSource: "official"\|"momo"\|...`,`priceUpdatedAt: ISO date` | 從指定平台爬,建議官網 |
| B4 | `images: string[]` | 完整 URL 陣列;首張當卡片預覽 | 從電商爬 |

### 3.2 改欄位格式(🟡 已有但需調整)

| # | 現況 | 改成 | 原因 |
|---|------|------|------|
| B5 | `caloriesText: "4200大卡/kg"` | `caloriesKcalPerKg: 4200`(整數) | 跟 `proteinPct` 風格一致;前端不用 parse;單位前端統一加「大卡/kg」 |
| B5b | `nutritionText: "蛋白質 32%、脂肪 18%、水分 75%、灰分 2%、磷 0.9%..."`(整串) | 後端 parse 一次,**所有可拆出的營養數值都結構化成獨立欄位**:`proteinPct`(已有)、`fatPct`(已有)、`fiberPct`(已有)、`moisturePct`(新)、`ashPct`(新)、`phosphorusPct`(新)、`calciumPct`(可選) | 前端絕對不 parse 字串;結構化後才能做篩選 / 排序 / 公式計算;`nutritionText` 可保留為 raw 備份供詳情頁顯示廠商原始標示,但前端不依賴 |
| B6 | `ingredientsText: "雞肉、雞肝、糙米、礦物質(氯化鉀、硫酸亞鐵)、維生素(A、D3、E)、牛磺酸"`(整串,**保留原樣**) | **不拆陣列**(2026-05-06 拍板) | 後端零拆字串;包裝括號內子配方語意保留;Phase 2 grain-free 派生用 SQL `NOT LIKE '%小麥%' AND NOT LIKE '%玉米%' AND NOT LIKE '%米%' AND ...`,夠用;首頁篩選用 substring 比對(見 §3.0)。前端詳情頁純文字段落顯示,不做 chip 互動 |
| B7 | `isPrescription` query 傳值 | 確認是 `?isPrescription=true` 還是 `?isPrescription=1` | 文件 value 給 `"true"` 字串,query 又寫 bool,要一致 |

### 3.3 補欄位但接受 sparse(🟢 高 null 比例可接受)

| # | 欄位 | 規格 | 階段 | 備註 |
|---|------|------|------|------|
| B8 | `phosphorusPct` | `number \| null` | **Phase 1 + Phase 2** | 從 `nutritionText` 拆,跟其他營養百分比同等處理;接受多數 null;卡片顯示「磷 0.9%」。**2026-05-06 後端會議定案:Phase 2 不升級為 mg/100kcal 雙標**,磷永遠以 % 呈現,理由是使用者對 mg/100kcal 認知成本高,且後端也省一道公式 |
| ~~B8b~~ | ~~`phosphorusMgPer100kcal`~~ | — | ~~Phase 2~~ | **取消(2026-05-06 後端會議)**。原規劃公式 `phosphorusPct × 10000 / caloriesKcalPerKg × 100` 不再實作;若 Phase 2 真要做腎貓篩選,改用 % 門檻(見 §6) |
| B8c | `carbsPct` | `number \| null` | **Phase 1** ✨ 新增 | **後端公式算**(後端內部處理 moisture/ash 取值與公式),前端只渲染;接受高 null 比例;對應 §1「派生欄位由後端計算」原則 |

### 3.4 Schema 保留但 Phase 1 永遠回空(為 Phase 2 鋪路)

| # | 欄位 | Phase 1 預設值 | Phase 2 做法 |
|---|------|------------|------------|
| B9 | `functional: string[]` | 永遠 `[]` | 從成分推斷 + 人工標註 |
| B10 | `isGrainFree: boolean \| null` | 永遠 `null` | 從 `ingredients[]` 關鍵字判斷 |

### 3.5 治理待決(🔵 不擋 Phase 1)

| # | 項目 | 狀態 |
|---|------|------|
| B11 | `id` 整數 vs 字串 slug | ✅ 跟隨後端用整數 |
| B12 | `brand` 中文當 value vs slug 化 | 待決,影響 URL 品質 |
| B13 | `/api/brands` 與 `/api/ingredients` 角色 | Phase 2 再討論 |

### 3.6 後端 API 整體 shape(目標)

```jsonc
GET /api/filters → {
  "success": true,
  "data": {
    "petTypes":       [{ "value": "cat",   "label": "貓",       "count": 120 }],
    "forms":          [{ "value": "wet",   "label": "濕食",     "count": 60  }],
    "ages":           [{ "value": "adult", "label": "成貓/成犬", "count": 80  }], // ✨ 新增
    "brands":         [{ "value": "皇家",  "label": "皇家",     "count": 42  }],
    "ingredients":    [{ "value": "雞肉",  "label": "雞肉",     "count": 85  }],
    "isPrescription": [{ "value": "true",  "label": "處方飼料", "count": 15  }]
  }
}

GET /api/products → {
  "success": true,
  "data": {
    "products": [{
      "id": 1,
      "title": "【皇家】貓咪乾糧 2kg",
      "brand": "皇家",
      "petType": "cat",
      "form": "dry",
      "age": "adult",                     // ✨ 新增
      "volume": "2kg",                    // ✨ 新增
      "price": 850,                       // ✨ 新增
      "priceSource": "official",          // ✨ 新增
      "priceUpdatedAt": "2026-04-29",     // ✨ 新增
      "images": ["https://..."],          // ✨ 新增(取代沒有的 image)
      "isPrescription": false,
      "ingredientsText": "雞肉、米、玉米、甜菜漿、魚油、礦物質(氯化鉀、硫酸亞鐵)、維生素(A、D3、E)",  // ✨ 維持字串原樣(2026-05-06 拍板)
      "proteinPct": 32.0,
      "fatPct": 18.0,
      "fiberPct": 3.5,
      "carbsPct": 29.5,                      // ✨ Phase 1 新增(後端公式算,前端只渲染)
      "phosphorusPct": 0.9,                  // ✨ Phase 1 新增(從 nutritionText 拆;Phase 2 不升級雙標)
      "caloriesKcalPerKg": 4200,             // ✨ 改格式
      "functional": [],                      // ✨ 保留 schema,Phase 1 永遠空
      "isGrainFree": null                    // ✨ 保留 schema,Phase 2 派生
    }],
    "pagination": { "page": 1, "limit": 24, "total": 218, "totalPages": 10 }
  }
}
```

---

## 4. 前端要進行的調整

### 4.1 元件改動

| # | 檔案 | 改動 |
|---|------|------|
| F1 | `components/product/ProductCard.vue` | macro bar 維持 **3 條**(蛋白 + 脂肪 + 碳水),`carbsPct` 直接讀後端欄位,前端不算公式;`carbsPct === null` 時第三條 bar 不渲染或顯示「—」 |
| F2 | `components/product/ProductCard.vue` | macro bar 上方的「/ XX% max」label 保留,沿用 form-aware `MACRO_MAX_BY_FORM` |
| F3 | `components/product/ProductCard.vue` | **粗纖維不顯示在卡片**(移到詳情頁) |
| F4 | `components/product/ProductCard.vue` | **磷**有值才顯示,null 時整行不渲染 |
| F5 | `components/product/ProductCard.vue` | 熱量改用後端結構化欄位 `caloriesKcalPerKg`,顯示「4200 大卡/kg」,拿掉 regex 拆值邏輯 |
| F6 | `components/product/ProductCard.vue` | `id` 顯示從 `PROD-001`(假設 `prod_` 前綴)改成 `PROD-1` 或 `#1`(整數直拼) |
| F7 | `components/product/ProductCard.vue` | 卡片不再渲染 `flavors`、`functional`、`special` tag(移除 meta row 口味、機能/特殊 tag list) |
| F8 | `components/product/ProductCard.vue` | 新增「處方飼料」tag(若 `isPrescription === true`) |
| F9 | `components/filter/FilterSidebar.vue` | 從 **7 組砍到 5 + 1 組**,加處方飼料 toggle |
| F10 | `components/filter/FilterDrawer.vue` | 同上 |
| F11 | **新元件** `components/filter/IngredientFilter.vue` | 成分輸入框 + include/exclude chip 雙列(取代口味勾選) |
| F12 | **新元件** `components/filter/FilterToggle.vue` | 處方飼料 toggle(後續無穀也用這個) |

### 4.2 State / 共用邏輯

| # | 檔案 | 改動 |
|---|------|------|
| F13 | `utils/filter-state.ts` | 重定義 `FILTER_KEYS`:砍 `flavor`/`func`/`special`,加 `petType`/`ingredient`/`excludeIngredient`/`age`/`isPrescription` |
| F14 | `pages/index.vue` | URL query key 跟著改;debounce 邏輯不變 |
| F15 | **新檔** `composables/useApi.ts` | 統一 fetch wrapper + normalizer 層(把後端 v2 shape 轉前端模型) |

### 4.3 詳情頁(新增)

| # | 檔案 | 改動 |
|---|------|------|
| F16 | **新頁** `pages/products/[id].vue` | 完整保證分析(含粗纖維、水分、灰分、磷、鈣等)+ 完整成分列表 + 多圖 carousel |
| F17 | **新 mock** `server/api/products/[id].get.ts` | 對齊新 schema |

### 4.4 Mock / Server

| # | 檔案 | 改動 |
|---|------|------|
| F18 | `server/utils/catalog.ts` | 重寫對齊新 schema:加 `age`、`volume`、`price` 等;移除 `flavors`、`functional`、`special`(改 `isPrescription`);改 nutrition 為數字 |
| F19 | `server/api/filters.get.ts` | response 改 5 + 1 組:`petTypes`、`forms`、`ages`、`brands`、`ingredients`、`isPrescription` |
| F20 | `server/api/products.get.ts` | query param 改 `petType`/`age`/`brand`/`ingredient`/`excludeIngredient`/`isPrescription` |

### 4.5 文件

| # | 檔案 | 改動 |
|---|------|------|
| F21 | `docs/API.md` | 大改寫 — 砍掉舊版 §10/§11,新版以本文件契約為基礎重寫 |
| F22 | `CLAUDE.md` | 更新 design system(macro bar 2 條)、filter system(5+1 組)、Pending Decisions 表 |

---

## 5. 熱量標示格式研究(支撐 §3.2 B5 決議)

### 5.1 國際標準(AAFCO)

- 強制標示「kcal ME/kg」(代謝能千卡/公斤)+ 一個熟悉單位(kcal/can、kcal/cup、kcal/biscuit)
- "ME" 縮寫 AAFCO 已廢除,避免與人類食物 Calorie 混淆
- 單一單位 kcal,1 kcal = 1 大卡 = 1 食物卡路里
- 計算方式:依蛋白 / 脂肪 / 碳水(NFE)用 modified Atwater 係數推算

### 5.2 台灣市場實況

- 動保法第 22-5 條規定的「營養成分與其量」涵蓋熱量,**大廠多會標,中小品牌不一定**
- 中文常用標示:「**大卡/kg**」、「kcal/kg」(主流)
- 主食罐部分品牌用「**kcal/100g**」或「kcal/罐」
- 乾糧多半提供「**kcal/cup**」(餵食以杯計)

### 5.3 不同形態的量級差異

| 形態 | 典型熱量範圍 | 原因 |
|------|----------|------|
| 乾糧 | 3500–4500 kcal/kg | 水分低(~10%),熱量密度高 |
| 濕食(主食罐) | 800–1200 kcal/kg | 水分高(~75%),熱量被稀釋 |
| 零食 | 差異大 | 配方多樣 |

### 5.4 對前端 / 後端的決議意涵

| 議題 | 決議 |
|------|------|
| 後端應該回什麼單位? | **kcal/kg**(國際 + 台灣主流;且全形態通用,不必依 form 切換) |
| 後端應該回字串還是數字? | **數字** `caloriesKcalPerKg: 4200`(跟 `proteinPct` 風格一致) |
| 前端怎麼顯示? | 直接拼接「**4200 大卡/kg**」(中文 unit 後綴),不再用 regex 拆字串 |
| 不同形態量級差 4 倍怎麼辦? | **不歸一化**,直接顯示原始值;使用者選了 form 篩選後就只看到同形態,不會跨比較 |
| Phase 2 要不要加 kcal/100g 切換? | 不必。kcal/kg 是國際標準,使用者習慣 |
| Phase 2 加乾糧後要不要加 kcal/cup? | **不必**,杯量定義不一致(杯大小不同),kcal/kg 更精確 |

### 5.5 Sources

- [Calorie Content — AAFCO](https://www.aafco.org/resources/startups/calorie-content/)
- [瞭解寵物食品的熱量 — 希爾思寵物](https://www.hills.com.tw/pet-care/nutrition-feeding/counting-pet-food-calories)
- [門市秘笈|熱量標示怎麼看 — 寵食科學誌](https://pfscience.com.tw/posts/pet-calorie-feeding)
- [Updates to Pet Food Labels — Today's Veterinary Practice](https://todaysveterinarypractice.com/nutrition/aafco-pet-food-label-updates/)

---

## 6. Phase 2 待辦清單(備忘,不在本次範圍)

| 項目 | 說明 |
|------|------|
| ~~磷雙標升級~~ | **取消(2026-05-06 後端會議)**。Phase 1 + Phase 2 都用 `phosphorusPct` %;不做 mg/100kcal 雙標 |
| 腎貓篩選 toggle | 改用 % 門檻(例如「只看磷 < 0.5%」);Phase 2 加乾糧後若需跨乾濕公平比較,需配合 dry-matter basis 換算或分形態給不同門檻 |
| 機能配方 schema 啟用 | 後端從成分 + 人工標註派生(腎臟保健、泌尿道、消化、皮膚毛髮、關節、化毛、體重管理) |
| 無穀(grain-free)從成分派生 | 後端對 `ingredientsText` 跑 SQL `NOT LIKE '%小麥%' AND NOT LIKE '%玉米%' AND NOT LIKE '%米%' AND NOT LIKE '%燕麥%' AND NOT LIKE '%大麥%'` 等規則,寫進 `isGrainFree`。**注意:走 grain-free,不走 gluten-free**(寵食市場主流是無穀,不是無麩質;寵物對麩質過敏比例遠低於人類)。精細過敏原排除 Phase 3+ 再升級為結構化欄位 |
| 低敏改為客觀分類 | 取消「低敏」,改成「單一蛋白源」「水解蛋白」這種有定義的分類(或直接用 `excludeIngredient` 涵蓋) |
| 詳情頁擴展欄位 | 餵食指南、原產地、來源 URL、保證分析完整版 |
| 碳水 DMB 換算 | Phase 1 已上 `carbsPct`;Phase 2 加乾糧後若需跨乾濕公平比較,加 dry-matter basis 換算 toggle |
| 多平台比價 | `prices: [{ source, price, url }]`,卡片顯示最低價 + 各平台 chip 連結 |
| `/api/brands` 品牌頁 | `/brands/[slug]` 列出該品牌所有產品 + 簡介 |
| `/api/ingredients` autocomplete | 接成分搜尋框的下拉建議 |
| OpenAPI schema-first | 用 OpenAPI 3.1 作為唯一真實來源,後端 contract test 驗證 |

---

## 7. 動工順序建議

依「不依賴後端 → 依賴後端」排序:

### Sprint 1(本週,前端可獨立完成)
- F15 `composables/useApi.ts` normalizer 層(基礎)
- F18-F20 mock 重寫對齊新 schema
- F1-F8 ProductCard 改動(用 mock 跑)
- F9-F13 Sidebar / Drawer 砍三組
- F11 IngredientFilter 新元件
- F16-F17 詳情頁骨架(用 mock)
- F21-F22 文件更新

### Sprint 2(等後端補欄位)
- B1-B4 後端補 `age` / `volume` / `price` / `images`
- 接 live API(切 base URL)
- 真實資料聯調
- F4 / F5 / F6 確認真實 shape 與前端 normalizer 對齊

### Sprint 3(體驗收尾)
- B5-B7 後端格式調整(熱量、成分、processed query)
- B8 `phosphorus` 補欄位
- 上線驗收

---

## 8. 開放議題(待後端會議確認)

| # | 議題 | 期望結論 |
|---|------|---------|
| Q1 | 後端可否補 `age` / `volume` / `price` / `images`?時程? | 必補,問時程 |
| Q2 | `caloriesText` 是否能改成 `caloriesKcalPerKg: 4200`(數字)? | 改 |
| Q3 | `ingredientsText` 是否能改成 `ingredients: string[]`? | 改 |
| Q4 | `nutritionText` 是否能拆成結構化欄位(B5b)?後端 parse 一次寫進 DB,接受拆不出來時 null | 改;前端絕不 parse 字串 |
| Q5 | `phosphorusPct` Phase 1 加欄位(從 nutritionText 拆,接受高 null)? | 加 |
| Q6 | `phosphorusMgPer100kcal` Phase 2 加欄位(後端公式算)? | Phase 2 再做,先確認共識 |
| Q7 | `functional: []` schema 保留 + Phase 2 補的方向? | 共識 |
| Q8 | `isPrescription` query 傳值是 `?isPrescription=true` 還是 `?isPrescription=1`? | 確認 |
| Q9 | `brand` slug 化方向? | Phase 1 維持中文 OR Phase 2 切換 |
| Q10 | `/api/brands` / `/api/ingredients` 角色? | Phase 2 再討論 |

---

## 變更紀錄

| 日期 | 版本 | 變更 |
|------|------|------|
| 2026-04-29 | v1.0 | 首版,以後端 v2(`api-260429.txt`)+ 包裝法規研究 + 熱量標示研究綜合產出 |
| 2026-04-30 | v1.1 | §1 設計原則新增「派生欄位由後端計算」;§2.1 卡片磷顯示分 Phase 1(`phosphorusPct` 顯示「磷 0.9%」)/ Phase 2(`phosphorusMgPer100kcal` 雙標升級);§3.2 新增 B5b(後端 parse `nutritionText` 為結構化欄位);§3.3 重組為 B8(Phase 1 phosphorusPct)/ B8b(Phase 2 phosphorusMgPer100kcal,後端公式算)/ B8c(Phase 2 moisture/ash 為碳水鋪路);§3.6 範例 JSON 對應更新;§6 Phase 2 新增「磷雙標升級」與「腎貓篩選 toggle」;§8 開放議題從 Q1-Q8 擴充為 Q1-Q10 |
| 2026-05-01 | v1.2 | 與後端確認碳水從 Phase 2 拉回 Phase 1 — §2.1 新增 `carbsPct` 為 macro bar 第 3 條;§2.2 移除「碳水不顯示」項;§3.3 B8c 改為 `carbsPct`(後端公式算,前端只渲染);§3.6 範例 JSON 加 `carbsPct`,`moisturePct`/`ashPct` 視為後端內部欄位不暴露給前端;§4.1 F1 改為 macro bar 維持 3 條,F2 form-aware max label 保留;§6 Phase 2 「碳水 macro bar」項改為「碳水 DMB 換算」 |
| 2026-05-06 | v1.3 | **磷雙標升級取消** — 後端會議定案 Phase 1 + Phase 2 磷都用 `phosphorusPct` %,不做 mg/100kcal 雙標。§2.1 「磷(Phase 1)」與「磷(Phase 2 升級)」兩列合併為單列;§3.3 B8b 標 strikethrough 取消;§3.6 範例 JSON 移除 `phosphorusMgPer100kcal`;§6 Phase 2 「磷雙標升級」標 strikethrough 取消,「腎貓篩選 toggle」改用 % 門檻 |
| 2026-05-06 | v1.4 | **product 成分欄位定為字串** — 詳情頁 step E 設計時釐清「篩選字典 vs 產品實際成分」是兩個不同概念,且後端拆字串會踩括號雷(維生素/礦物質複合配方)。§3 新增 §3.0「兩個成分欄位概念分離」澄清段;§3.2 B6 從「拆陣列」改為「保留字串原樣」;§3.6 範例 JSON 對應改;§6 Phase 2 grain-free 派生改用 SQL LIKE;§2.4 詳情頁成分顯示改為純文字段落,不做 chip 互動 |
