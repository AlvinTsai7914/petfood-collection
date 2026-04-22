# Pet Food DB — API 交接文件

**對象**:後端開發團隊
**前端實作狀態**:已有可跑的 Nitro mock server(見 `server/api/` 與 `server/utils/catalog.ts`),端點、query、response 格式均已與 spec §5 對齊,後端可直接照下述契約實作並用 mock 驗證。
**Spec 來源**:`pet-food-db-spec-v1.7.docx` §5(本文件是其補充與實作細節釐清,不取代 spec)。

---

## 1. 基本約定

| 項目 | 值 |
|------|-----|
| Base URL | `/api`(Phase 1 同源;後端另架請設 CORS 允許前端 domain) |
| 驗證 | 無(Phase 1 全開放) |
| 語言 | Request key 用英文;response 多數欄位同時含英文 `value` 與中文 `label`(見下) |
| 字集 | UTF-8 |

### 統一 response 包裝

成功:
```json
{ "success": true, "data": { ... } }
```

錯誤:
```json
{ "success": false, "error": { "code": "INVALID_PARAM", "message": "Invalid page number" } }
```

`success` 欄位和 HTTP 狀態碼**並行使用**:2xx → `success: true`;4xx / 5xx → `success: false`(但在 SSR 失敗情境,前端會把錯誤吞掉改吐空資料,詳見 §7)。

### 快取標頭

| 端點 | Cache-Control | 理由 |
|------|---------------|------|
| `GET /api/filters` | `public, max-age=3600` | 資料變動頻率低(爬蟲更新後才變),前端一天內可重用 |
| `GET /api/products` | `public, max-age=300` | 價格可能每日更新,短 TTL 避免陳舊資料 |

CDN / 反向代理可依此做快取。

---

## 2. 端點總覽

| Method | Path | 說明 |
|--------|------|-----|
| `GET` | `/api/filters` | 取得所有可用的篩選選項(靜態,不隨當前篩選變動) |
| `GET` | `/api/products` | 取得產品列表,支援篩選與分頁 |

---

## 3. `GET /api/filters`

### Query 參數
無。

### Response(HTTP 200)

```json
{
  "success": true,
  "data": {
    "types":      [{ "value": "cat", "label": "貓",      "count": 24 }, ...],
    "forms":      [{ "value": "wet", "label": "濕食",    "count": 30 }, ...],
    "ages":       [{ "value": "adult", "label": "成貓/成犬", "count": 18 }, ...],
    "brands":     [{ "value": "wangmiao", "label": "汪喵星球", "count": 5 }, ...],
    "flavors":    [{ "value": "chicken", "label": "雞肉",  "count": 13 }, ...],
    "functional": [{ "value": "kidney",  "label": "腎臟保健", "count": 4 }, ...],
    "special":    [{ "value": "grain-free", "label": "無穀", "count": 10 }, ...]
  }
}
```

### 欄位語意

| 欄位 | 型別 | 說明 |
|------|------|------|
| `value` | string | 英文 slug,用於 `/api/products` 的 query 參數值 |
| `label` | string | 中文顯示文字,前端直接渲染,不做額外翻譯 |
| `count` | number | 該 value 對應的**全域**產品總數;**不隨當前篩選變動**(Phase 1 無 faceted search) |

### 重要約定

- **`count` 是全域計數,不是動態**。若將來要做 faceted search(計數隨當前篩選動態變),需要另開端點或加 query 參數,這是 Phase 2 事項,Phase 1 不做。
- `flavors`、`functional`、`special` 這幾個「產品可能有多個值」的欄位,count 的定義是「含有該值的產品數量」(也就是 `products.filter(p => p.flavors.includes('chicken')).length`)。
- 排序:`types` / `forms` / `ages` 可固定順序;`brands` / `flavors` 建議按 `count` 降序(受歡迎的先出現),`functional` 按 spec §3.3 表格順序。

---

## 4. `GET /api/products`

### Query 參數

| 參數 | 型別 | 預設 | 範例 | 說明 |
|------|------|------|------|------|
| `page` | number | `1` | `?page=2` | 頁碼,從 1 起算 |
| `limit` | number | `24` | `?limit=48` | 每頁筆數;建議上限 `100`(避免 DoS) |
| `type` | string | — | `?type=cat` 或 `?type=cat,dog` | `cat` / `dog` |
| `form` | string | — | `?form=wet` | `wet` / `dry`(Phase 1 僅 `wet` 有資料) |
| `age` | string | — | `?age=kitten,adult` | `kitten` / `adult` / `senior` / `all` |
| `brand` | string | — | `?brand=wangmiao,ziwi` | slug,見 §5 字典 |
| `flavor` | string | — | `?flavor=chicken,beef` | slug,見 §5 字典 |
| `func` | string | — | `?func=kidney,urinary` | slug,見 §5 字典(注意 query 用 `func` 不是 `functional`,spec §5.3 如此定義) |
| `special` | string | — | `?special=grain-free` | slug,見 §5 字典 |

### 篩選邏輯

| 情境 | 邏輯 |
|------|------|
| 同欄位多值(逗號分隔) | **OR(聯集)** — 例:`brand=wangmiao,ziwi` = 汪喵 或 巔峰 |
| 跨欄位 | **AND(交集)** — 例:`type=cat&brand=wangmiao` = 貓 **且** 汪喵 |
| 陣列欄位(`flavor` / `func` / `special`)匹配單個產品 | 產品的該欄位陣列**至少一個值**在查詢值中 → 匹配 |

實作範例(pseudo):
```js
products.filter(p =>
  (!types.length    || types.includes(p.type))    &&
  (!forms.length    || forms.includes(p.form))    &&
  (!ages.length     || ages.includes(p.age))      &&
  (!brands.length   || brands.includes(p.brand))  &&
  (!flavors.length  || p.flavors.some(f => flavors.includes(f)))  &&
  (!funcs.length    || p.functional.some(f => funcs.includes(f))) &&
  (!specials.length || p.special.some(s => specials.includes(s)))
)
```

### Response(HTTP 200)

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod_001",
        "name": "98% 鮮肉主食罐 雞肉",
        "brand": "汪喵星球",
        "type": "cat",
        "typeLabel": "貓",
        "form": "wet",
        "formLabel": "濕食",
        "flavors": ["雞肉"],
        "age": "all",
        "ageLabel": "全齡",
        "functional": ["腸胃保健"],
        "special": ["無穀"],
        "volume": "165g",
        "price": 89,
        "image": "https://cdn.example/001.jpg",
        "nutrition": {
          "protein":    "12%",
          "fat":        "5%",
          "carbs":      "3%",
          "phosphorus": "125 mg/100kcal",
          "calories":   "95 kcal/100g"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 24,
      "total": 156,
      "totalPages": 7
    }
  }
}
```

### 欄位語意

| 欄位 | 型別 | 說明 |
|------|------|-----|
| `id` | string | 主鍵,格式建議 `prod_XXX`(前端已假設此格式做 `PROD-XXX` 顯示) |
| `name` | string | 產品全名(中文) |
| `brand` | string | 品牌**中文 label**(非 slug);前端直接顯示 |
| `type` / `form` / `age` | string | **英文 value (slug)**,前端做識別用 |
| `typeLabel` / `formLabel` / `ageLabel` | string | 對應的中文 label,前端直接顯示 |
| `flavors` / `functional` / `special` | string[] | **中文 label 陣列**(注意:**不是 slug**);前端直接顯示 |
| `volume` | string | 含單位,如 `165g`、`1.5kg` |
| `price` | number | TWD,整數或小數皆可;前端會用 tabular-nums 等寬顯示 |
| `image` | string | 完整 URL;Phase 1 可引用外站,需確認未被防盜鏈擋 |
| `nutrition.*` | string | **含單位的字串**(前端會以 regex 拆值與單位做樣式處理)。單位規範見下表 |

### 營養成分單位規範(⚠️ 後端請嚴格遵守格式)

| 欄位 | 格式 | 範例 |
|------|------|------|
| `protein` | `{num}%` | `"12%"` |
| `fat` | `{num}%` | `"5%"` |
| `carbs` | `{num}%` | `"3%"` |
| `phosphorus` | `{num} mg/100kcal` | `"125 mg/100kcal"` |
| `calories` | `{num} kcal/100g` | `"95 kcal/100g"` |

**為什麼要統一格式?** 前端的 ProductCard 會把字串拆成「數值」(大、mono 字型)和「單位」(小、灰字),regex 是 `/^([\d.]+)\s*(.*)$/`。若格式飄移(例如某筆 `calories: "95kcal/100g"` 無空格、另一筆 `"95 kcal / 100 g"` 有空格),數值/單位會拆錯,影響視覺。爬蟲抓到資料後請先 normalize 到上述格式。

### Schema 細節

#### `id` 格式
- 必須符合 `/^prod_[a-z0-9_]+$/i`(前端以 `prod_` 前綴切出後轉 `PROD-XXX` 顯示)
- **全域唯一**且**永久不變**(product 被下架後其 id 不應重用;同一款產品資料更新時 id 不變)
- 建議用**遞增序號 padded 到 3–4 位**(`prod_001`、`prod_0042`)或 slug 化品牌+產品名(`prod_wangmiao_98chicken_165g`)。兩種都可,但全專案請擇一保持一致
- 不能含 `/`、空白、query 保留字元(用於 URL 路徑與 SEO 安全)

#### `price` 型別
- **整數**(TWD,無小數),例:`89`、`1250`
- 常見範圍 `20 ~ 3000`;超出範圍可能是爬蟲錯誤,建議後端設警戒值
- 「暫時缺貨 / 價格未知」→ 回 `null`(**不是 `0`**);前端會顯示為 `NT$ —`

#### `volume` 格式
- 字串格式:`{數字}{單位}`,可含乘號表多入
- 可接受:`"165g"`、`"1.5kg"`、`"12x80g"`、`"12 x 80g"`(空格可選)
- 單位請統一小寫(`g` / `kg` / `ml`),不用中文(避免後端排序複雜化)
- 「未知」→ 回 `null`

#### `image` 格式
- 完整 URL,含 protocol;相對路徑請後端補完
- 可能失效或防盜鏈:前端有 `@error` fallback,但後端若能在爬蟲時驗證可用性更好
- 「無圖」→ 回 `null`(**不是空字串**)

#### `nutrition` 可為 null 的欄位
- `protein` / `fat`:濕食、乾糧的保證分析必有 → **不應為 null**
- `carbs`:官方標示常缺,需用 `100 - protein - fat - moisture - ash` 推估 → 推估不到時可為 `null`
- `phosphorus`:很多品牌不標 → 可為 `null`(腎貓使用者會特別想知道有無,前端會顯示 `—`)
- `calories`:大品牌多數有標 → 建議不為 null,但允許

### Null / 空值契約

為讓前端處理一致,請後端嚴格遵守以下三條規則:

| 情境 | 正確 | 錯誤 |
|------|------|------|
| 「沒有此資料」的 scalar 欄位 | `null` | `""`、`"N/A"`、`0`、省略 key |
| 「沒有此值」的陣列欄位(`flavors` / `functional` / `special`) | `[]`(永遠回陣列) | `null`、省略 key |
| 「預設填空」的 slug 欄位 | 正常填(`age: "all"`)| `null`、`""` |

例:一款沒有機能配方、沒有特殊配方、沒標磷的產品會長這樣:
```json
{
  "id": "prod_999",
  "flavors": ["雞肉"],
  "functional": [],
  "special": [],
  "nutrition": {
    "protein": "10%", "fat": "4%", "carbs": null,
    "phosphorus": null, "calories": "82 kcal/100g"
  }
}
```

### 分頁行為

| 情境 | 行為 |
|------|------|
| `page` < 1 或非數字 | 視為 1 |
| `page` 超過 `totalPages` | **建議回 `products: []`,保持 200 + 正確的 `total`/`totalPages`**(不是 404),讓前端顯示 EmptyState |
| `total = 0` | `totalPages: 1`,`products: []`,HTTP 200;不要回 404 |
| `limit` > 上限 | 建議靜默 clamp 到上限(例如 100),不要回 400 |

### 邊界情境

| 情境 | 建議行為 |
|------|---------|
| 所有篩選 query 皆無 | 回完整資料第 1 頁 |
| Query 含未知 value(如 `brand=bogus`) | 視為無匹配項,結果很可能是空;**不要回 400**(前端可能來自使用者改網址) |
| Query 含未知欄位 | 忽略 |

---

## 5. Slug 字典

### 治理原則

| 項目 | 規則 |
|------|------|
| **權威來源** | **後端 DB 的字典表**。前端不 hardcode slug,全部從 `GET /api/filters` 讀取後使用 |
| **新增** | 爬蟲抓到新品牌/口味時 → 後端決定 slug → 寫入字典表 → 前端下次呼叫 `/api/filters` 自動反映 |
| **修改** | ⚠️ **slug 一經上線視為 append-only,不可更名**。使用者的篩選 URL(如 `?brand=wangmiao`)和外部分享連結依賴 slug 穩定性。若真需改名,須先導 301 redirect 或同時保留舊 slug 別名一段時間 |
| **刪除** | 不刪。可標記 `deprecated: true` 或 `count: 0` 讓前端隱藏,但 value 永不重用 |
| **命名慣例** | 小寫英文、底線分隔(snake_case);避免連字號(會跟 `grain-free` 這種既有 slug 不一致,但若 spec 已定用連字號則繼續沿用) |

### 封閉集合(spec 已固定,後端請勿擴充)

#### `type`
| value | label |
|-------|-------|
| `cat` | 貓 |
| `dog` | 狗 |

#### `form`
| value | label |
|-------|-------|
| `wet` | 濕食 |
| `dry` | 乾糧 |

#### `age`
| value | label |
|-------|-------|
| `kitten` | 幼貓/幼犬 |
| `adult` | 成貓/成犬 |
| `senior` | 老貓/老犬 |
| `all` | 全齡 |

⚠️ `age=all` 的語意:**原廠標示明確為「全齡」的才歸此類**,不要把「未標示年齡」的產品自動視為 `all`。後者建議單獨用一個爬蟲 flag 標記,之後再討論。

#### `functional`(spec §3.3)
| value | label |
|-------|-------|
| `kidney` | 腎臟保健 |
| `urinary` | 泌尿道保健 |
| `digest` | 腸胃保健 |
| `skin` | 皮膚毛髮 |
| `joint` | 關節保健 |
| `hairball` | 化毛配方 |
| `weight` | 體重管理 |

#### `special`(spec §3.4)
| value | label |
|-------|-------|
| `grain-free` | 無穀 |
| `hypoallergenic` | 低敏 |

### 開放集合(後端爬蟲會持續擴充,下方為前端 mock 起點)

**⚠️ 下列 slug 僅供後端 seed 字典表參考。正式上線請以後端維護的 DB 字典為權威,前端會對齊。**

#### `brand`(前端 mock 的 12 個,僅供 seed)
| value | label |
|-------|-------|
| `wangmiao` | 汪喵星球 |
| `alleycat` | 巷弄貓 |
| `nutrience` | 紐崔斯 |
| `ziwi` | 巔峰 |
| `ziwipeak` | Ziwi |
| `schesir` | Schesir |
| `almo` | Almo Nature |
| `applaws` | Applaws |
| `weruva` | Weruva |
| `tikicat` | Tiki Cat |
| `cesar` | 西莎 |
| `hills` | Hill's |

#### `flavor`(前端 mock 的 12 個,僅供 seed)
| value | label |
|-------|-------|
| `chicken` | 雞肉 |
| `beef` | 牛肉 |
| `fish` | 魚肉 |
| `tuna` | 鮪魚 |
| `turkey` | 火雞 |
| `lamb` | 羊肉 |
| `duck` | 鴨肉 |
| `salmon` | 鮭魚 |
| `venison` | 鹿肉 |
| `rabbit` | 兔肉 |
| `quail` | 鵪鶉 |
| `mixed` | 綜合 |

---

## 6. 錯誤回應

### 格式
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAM",
    "message": "Invalid page number"
  }
}
```

### 狀態碼對應

| HTTP | `error.code` | 情境 |
|------|--------------|------|
| 400 | `INVALID_PARAM` | Query 參數型別錯(例如 `page=abc`);但對未知 value 請採寬鬆處理(見 §4 邊界情境) |
| 404 | `NOT_FOUND` | 非產品列表相關(Phase 1 實際上用不到) |
| 500 | `SERVER_ERROR` | DB / 內部錯誤;`message` 不應洩漏 stack trace |

### 前端錯誤處理提醒

前端在 **SSR 失敗情境**會把 API 錯誤吞掉改吐空資料(避免頁面整頁 500),在 CSR 失敗時才顯示 ErrorState + 重試按鈕。這不影響後端回錯,照常回即可,只是前端不會把 5xx 呈現成 crash。

---

## 7. Mock 驗證(executable contract)

前端 repo 的 `server/api/` 和 `server/utils/catalog.ts` 實作了一份完整 mock。**後端實作完可直接拿去做 diff 測試**:同樣的 query,你的 response 應該結構上與 mock 一致。

### 啟動 mock

```bash
git clone https://github.com/AlvinTsai7914/petfood-collection
cd petfood-collection
npm install
npm run dev
```

### 驗證範例

```bash
# 篩選選項
curl http://localhost:3000/api/filters

# 全部產品,第 1 頁
curl "http://localhost:3000/api/products"

# 貓 + 汪喵星球
curl "http://localhost:3000/api/products?type=cat&brand=wangmiao"

# 多值 OR + 跨欄位 AND
curl "http://localhost:3000/api/products?type=cat&flavor=chicken,beef&special=grain-free"

# 分頁
curl "http://localhost:3000/api/products?page=2&limit=10"

# 超出分頁(應回空陣列 + 正確 total,不是 404)
curl "http://localhost:3000/api/products?page=999"
```

### 快速 diff 方法

```bash
# 後端跑在 3001
diff <(curl -s "http://localhost:3000/api/products?type=cat" | jq -S .) \
     <(curl -s "http://localhost:3001/api/products?type=cat" | jq -S .)
```

---

## 8. 待確認事項

鏡 `CLAUDE.md` 的 "Pending Backend Decisions" 區段。對齊會議優先處理:

| 項目 | 決策方 | 備註 |
|------|--------|------|
| 資料庫選型(PostgreSQL / MongoDB / 其他) | 後端 | 不影響前端契約,但影響 `total` 計數成本 |
| API stack(Nuxt Server Routes / FastAPI / 其他) | 後端 | 不影響前端契約 |
| 爬蟲更新頻率 | 後端 | 影響 `/api/products` 的 `Cache-Control` 建議值 |
| **Slug 字典權威版本**(brand / flavor 等) | 後端 | ⚠️ 必對齊,否則篩選失效 |
| **🆕 加 `moisture` 欄位到 `nutrition`** | 後端 | 前端建議(2026-04-21)。Phase 2+ 跨乾濕食的公平比較需要做 dry-matter-basis 換算,moisture 是關鍵輸入。爬取成本低(「保證分析」標示欄位本來就有)。若同意,新 schema:`nutrition.moisture: "78%"`,其他欄位不變 |
| 網站名稱 / Meta / OG 圖 | 共同決定 | 與 API 無關 |

---

## 9. 變更紀錄

| 日期 | 版本 | 變更 |
|------|------|------|
| 2026-04-22 | v1.0 | 首版,對齊 spec v1.7 + 前端 mock 當前實作 |
| 2026-04-22 | v1.1 | 補 id / price / volume / image / nutrition 的 schema 細節;新增 Null / 空值契約;§5 加 slug 治理原則(後端 DB 為權威、append-only、`age=all` 語意) |
