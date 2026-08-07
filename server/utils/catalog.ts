// Mock 產品資料 + 篩選 / 分頁邏輯
//
// 對齊 alignment doc §3.6 + §3.0 + §3.2 B6 (v1.4, 2026-05-06):
// - id 整數;brand 中文當 value(對齊後端 v2)
// - 結構化 nutrition 欄位(數字)
// - ingredientsText: 字串原樣(後端不拆陣列;模擬包裝原樣)
// - 篩選字典 INGREDIENT_DICTIONARY 與 product.ingredientsText 是兩個欄位,
//   後端真實實作會用 dictionary table + substring(LIKE)比對,前端 mock 用 .includes() 模擬

interface MockProduct {
  id: number
  title: string
  brand: string
  petType: 'cat' | 'dog'
  form: 'wet' | 'dry'
  age: 'kitten' | 'adult' | 'senior' | 'all'
  isPrescription: boolean
  volume: string
  price: number
  ingredientsText: string
  proteinPct: number
  fatPct: number
  fiberPct: number | null
  carbsPct: number | null
  phosphorusPct: number | null
  caloriesKcalPerKg: number | null
}

const p = (
  id: number,
  title: string,
  brand: string,
  petType: 'cat' | 'dog',
  form: 'wet' | 'dry',
  age: MockProduct['age'],
  isPrescription: boolean,
  volume: string,
  price: number,
  ingredientsText: string,
  proteinPct: number,
  fatPct: number,
  fiberPct: number | null,
  carbsPct: number | null,
  phosphorusPct: number | null,
  caloriesKcalPerKg: number | null,
): MockProduct => ({
  id, title, brand, petType, form, age, isPrescription, volume, price, ingredientsText,
  proteinPct, fatPct, fiberPct, carbsPct, phosphorusPct, caloriesKcalPerKg,
})

// 乾糧常見複合配方尾段,模擬包裝原樣的括號子配方(故意不拆,測試前端純文字段落顯示)
const DRY_TRACE = '礦物質(氯化鉀、硫酸亞鐵、氧化鋅、碘化鉀、亞硒酸鈉)、維生素(A、D3、E、B 群、菸鹼酸、葉酸)、牛磺酸'

// 30 筆 mock:22 濕食 + 8 乾糧;含 4 筆處方飼料;涵蓋全年齡層
const PRODUCTS: MockProduct[] = [
  // 濕食 — 汪喵星球
  p(1, '汪喵 98% 鮮肉主食罐 雞肉', '汪喵星球', 'cat', 'wet', 'all', false, '165g', 89,
    '雞肉、雞肝、海帶、牛磺酸', 12, 5, 0.5, 3, 0.18, 950),
  p(2, '汪喵 98% 鮮肉主食罐 牛肉', '汪喵星球', 'cat', 'wet', 'adult', false, '165g', 95,
    '牛肉、牛肝、海帶', 11, 6, 0.5, 3, 0.20, 980),
  p(3, '汪喵 98% 鮮肉主食罐 鮪魚', '汪喵星球', 'cat', 'wet', 'all', false, '80g', 55,
    '鮪魚、鰹魚、海帶', 13, 5, 0.4, 2, 0.22, 920),
  p(4, '汪喵 老貓照顧主食罐', '汪喵星球', 'cat', 'wet', 'senior', false, '165g', 99,
    '雞肉、魚肉、蔓越莓、牛磺酸', 9, 4, 0.5, 3, 0.14, 880),
  p(5, '汪喵 狗狗鮮魚主食罐', '汪喵星球', 'dog', 'wet', 'senior', false, '200g', 135,
    '鮭魚、鯖魚、紅蘿蔔、亞麻仁油', 9, 4, 0.6, 3, 0.16, 880),
  p(6, '汪喵 狗狗鮮雞主食罐', '汪喵星球', 'dog', 'wet', 'adult', false, '200g', 125,
    '雞肉、雞肝、南瓜', 11, 5, 0.6, 4, 0.18, 920),
  p(7, '汪喵 幼犬啟蒙主食罐', '汪喵星球', 'dog', 'wet', 'kitten', false, '200g', 140,
    '雞肉、雞蛋、魚油', 14, 7, 0.5, 3, 0.20, 1120),

  // 濕食 — 巷弄貓
  p(8, '巷弄貓 超鮮嫩雞胸主食罐', '巷弄貓', 'cat', 'wet', 'adult', false, '80g', 65,
    '雞肉(雞胸)、雞肝', 10, 4, 0.4, 2, 0.16, 850),
  p(9, '巷弄貓 超鮮嫩魚肉主食罐', '巷弄貓', 'cat', 'wet', 'adult', false, '80g', 70,
    '鯛魚、鮪魚', 11, 4, 0.4, 3, 0.18, 880),
  p(10, '巷弄貓 化毛配方主食罐', '巷弄貓', 'cat', 'wet', 'adult', false, '80g', 75,
    '雞肉、鮪魚、木瓜、燕麥纖維', 11, 4, 0.8, 3, 0.16, 850),

  // 濕食 — 紐崔斯
  p(11, '紐崔斯 挑嘴貓 牛肉主食罐', '紐崔斯', 'cat', 'wet', 'adult', false, '170g', 120,
    '牛肉、紅蘿蔔、蔓越莓', 11, 6, 0.5, 2, 0.14, 920),
  p(12, '紐崔斯 挑嘴貓 雞肉主食罐', '紐崔斯', 'cat', 'wet', 'adult', false, '170g', 120,
    '雞肉、南瓜、蔓越莓', 12, 5, 0.5, 3, 0.16, 950),
  p(13, '紐崔斯 幼貓啟蒙雞肉主食罐', '紐崔斯', 'cat', 'wet', 'kitten', false, '170g', 130,
    '雞肉、雞蛋、魚油、蔓越莓', 14, 7, 0.5, 2, 0.20, 1140),

  // 濕食 — Ziwi 巔峰
  p(14, 'Ziwi 無穀全齡雞肉主食罐', 'Ziwi', 'cat', 'wet', 'all', false, '170g', 180,
    '雞肉、雞心、雞肝、海帶', 13, 7, 0.4, 2, 0.22, 1050),
  p(15, 'Ziwi 無穀全齡牛肉主食罐', 'Ziwi', 'cat', 'wet', 'all', false, '170g', 180,
    '牛肉、牛心、牛肝', 12, 8, 0.4, 2, 0.20, 1100),
  p(16, 'Ziwi 鹿肉低敏主食罐', 'Ziwi', 'dog', 'wet', 'adult', false, '170g', 220,
    '鹿肉、鹿心、鹿肝、海帶', 12, 6, 0.4, 2, 0.18, 1050),
  p(17, 'Ziwi 羊肉鮮食主食罐', 'Ziwi', 'cat', 'wet', 'adult', false, '170g', 210,
    '羊肉、羊心、羊肝', 13, 7, 0.4, 2, 0.18, 1020),
  p(18, 'Ziwi 兔肉低敏主食罐', 'Ziwi', 'cat', 'wet', 'kitten', false, '85g', 130,
    '兔肉、兔肝、海帶', 14, 6, 0.4, 2, 0.22, 1150),

  // 濕食 — Schesir / Almo / Applaws / Weruva / Tiki Cat
  p(19, 'Schesir 鮪魚主食罐', 'Schesir', 'cat', 'wet', 'adult', false, '85g', 45,
    '鮪魚、魚高湯', 13, 3, 0.3, 2, null, 800),
  p(20, 'Schesir 雞肉主食罐', 'Schesir', 'cat', 'wet', 'adult', false, '85g', 45,
    '雞肉、白米', 12, 3, 0.3, 2, null, 780),
  p(21, 'Almo HFC 鮭魚主食罐', 'Almo Nature', 'cat', 'wet', 'adult', false, '70g', 55,
    '鮭魚、魚高湯', 14, 4, 0.3, 2, null, 850),
  p(22, 'Applaws 雞胸肉主食罐', 'Applaws', 'cat', 'wet', 'adult', false, '70g', 48,
    '雞肉(雞胸)、魚高湯', 15, 3, 0.3, 2, null, 800),
  p(23, 'Weruva 雞湯主食罐', 'Weruva', 'cat', 'wet', 'all', false, '85g', 68,
    '雞肉、雞高湯、亞麻仁油', 11, 3, 0.3, 3, 0.14, 750),
  p(24, 'Tiki Cat 鮪魚主食罐', 'Tiki Cat', 'cat', 'wet', 'adult', false, '80g', 58,
    '鮪魚、魚高湯', 14, 3, 0.3, 2, null, 780),

  // 濕食 — 西莎(平價狗狗)
  p(25, '西莎 成犬牛肉主食罐', '西莎', 'dog', 'wet', 'adult', false, '100g', 28,
    '牛肉、雞肉、玉米澱粉', 8, 5, 1.0, 5, 0.18, 950),

  // 處方濕食 — Hill's
  p(26, "Hill's 腎臟處方主食罐", "Hill's", 'cat', 'wet', 'senior', true, '156g', 150,
    '豬肉、玉米澱粉、亞麻仁油', 10, 5, 0.6, 8, 0.10, 1050),

  // 乾糧 — Royal Canin(複合配方,加 DRY_TRACE 模擬包裝原樣)
  p(27, '皇家 ID 腸胃處方乾糧', 'Royal Canin', 'dog', 'dry', 'adult', true, '2kg', 1280,
    `雞肉粉、米、玉米、甜菜漿、魚油、${DRY_TRACE}`, 25, 18, 1.5, 42, 0.65, 4100),
  p(28, '皇家 印第安挑嘴貓乾糧', 'Royal Canin', 'cat', 'dry', 'adult', false, '2kg', 920,
    `雞肉粉、玉米、米、雞脂、${DRY_TRACE}`, 32, 17, 4.0, 35, 0.95, 4200),

  // 乾糧 — Hill's
  p(29, "Hill's 處方 K/D 腎臟乾糧", "Hill's", 'cat', 'dry', 'senior', true, '1.8kg', 1450,
    `雞肉、玉米、燕麥、雞脂、亞麻仁籽、${DRY_TRACE}`, 28, 19, 2.0, 38, 0.45, 4300),
  p(30, "Hill's 完美體重乾糧 處方款", "Hill's", 'dog', 'dry', 'adult', true, '4kg', 2100,
    `雞肉、燕麥、糙米、蔓越莓、南瓜、${DRY_TRACE}`, 28, 9, 9.5, 40, 0.65, 3300),
]

// ============================================================
// Filter options(5 + 1 組,對齊 alignment §3.6)
// ============================================================

const TYPE_LABELS: Record<MockProduct['petType'], string> = { cat: '貓', dog: '狗' }
const FORM_LABELS: Record<MockProduct['form'], string> = { wet: '濕食', dry: '乾糧' }
// 注意:value `kitten` 依 alignment doc B1 兼指幼貓「與」幼犬(狗產品也用 kitten),
// 但 live 後端實際回 `puppy`(backend-issues #2)— enum 字典定案後這裡與 useApi 的
// AGE_VALUES、ProductCard 的 AGE_LABELS 要一起改,不要單獨動這份
const AGE_LABELS: Record<MockProduct['age'], string> = {
  kitten: '幼貓/幼犬', adult: '成貓/成犬', senior: '老貓/老犬', all: '全齡',
}

// 篩選字典(alignment §3.0):後端 governance 的「精選關鍵成分」
// 用途:/api/filters.ingredients[] 候選清單 + ingredient query 比對 key
// 注意:這跟 product.ingredientsText 是兩個欄位,字典 ⊂ 任一產品的 ingredientsText 子字串
const INGREDIENT_DICTIONARY = [
  // 蛋白源主原料(高頻)
  '雞肉', '牛肉', '鮪魚', '鮭魚', '火雞', '羊肉', '鴨肉', '鹿肉', '兔肉', '豬肉',
  // 穀類具體詞(Phase 2 grain-free 派生時用 SQL LIKE 比對同樣這幾個 key)
  '玉米', '燕麥', '糙米', '白米', '大麥',
  // 其他常用關鍵成分
  '海帶', '蔓越莓', '南瓜',
] as const

const count = (pred: (p: MockProduct) => boolean) => PRODUCTS.filter(pred).length

const buildEnumOptions = <K extends string>(
  labels: Record<K, string>,
  matches: (p: MockProduct, value: K) => boolean,
) =>
  (Object.keys(labels) as K[]).map(value => ({
    value, label: labels[value], count: count(p => matches(p, value)),
  }))

// 從產品池萃取 unique brands(label 同 value;Phase 1 brand 中文當 value)
const buildBrandOptions = () => {
  const set = new Map<string, number>()
  for (const pr of PRODUCTS) set.set(pr.brand, (set.get(pr.brand) ?? 0) + 1)
  return Array.from(set.entries())
    .map(([value, c]) => ({ value, label: value, count: c }))
    .sort((a, b) => b.count - a.count)
}

// 從字典萃取選項;count 用 substring 比對(等同後端 SQL LIKE)
// 字典裡但所有產品都不命中的 → filter 掉,不出現在篩選清單(等同 count = 0 隱藏)
const buildIngredientOptions = () =>
  INGREDIENT_DICTIONARY
    .map(value => ({
      value,
      label: value,
      count: count(p => p.ingredientsText.includes(value)),
    }))
    .filter(o => o.count > 0)
    .sort((a, b) => b.count - a.count)

const FILTER_OPTIONS = {
  petTypes: buildEnumOptions(TYPE_LABELS, (p, v) => p.petType === v),
  forms: buildEnumOptions(FORM_LABELS, (p, v) => p.form === v),
  ages: buildEnumOptions(AGE_LABELS, (p, v) => p.age === v),
  brands: buildBrandOptions(),
  ingredients: buildIngredientOptions(),
  // alignment §3.6:isPrescription 只列 true 那組
  isPrescription: [{ value: 'true', label: '處方飼料', count: count(p => p.isPrescription) }],
}

export const getFilterOptions = () => FILTER_OPTIONS

// ============================================================
// Query 篩選 / 分頁
// ============================================================

const arr = (v: unknown): string[] => {
  if (!v) return []
  if (Array.isArray(v)) return v.flatMap(x => String(x).split(',')).filter(Boolean)
  return String(v).split(',').filter(Boolean)
}

const truthy = (v: unknown) => v === 'true' || v === true || v === '1'

export const queryProducts = (query: Record<string, unknown>) => {
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 24))

  const petTypes = arr(query.petType)
  const forms = arr(query.form)
  const ages = arr(query.age)
  const brands = arr(query.brand)
  const ingredients = arr(query.ingredient)
  const excludeIngredients = arr(query.excludeIngredient)
  const onlyPrescription = truthy(query.isPrescription)

  const filtered = PRODUCTS.filter((pr) => {
    if (petTypes.length && !petTypes.includes(pr.petType)) return false
    if (forms.length && !forms.includes(pr.form)) return false
    if (ages.length && !ages.includes(pr.age)) return false
    if (brands.length && !brands.includes(pr.brand)) return false
    // 包含成分:OR(任一 key 在 ingredientsText 中 substring match 即可,等同後端 LIKE)
    if (ingredients.length && !ingredients.some(i => pr.ingredientsText.includes(i))) return false
    // 排除成分:AND NOT(任一 key 在 ingredientsText 中 substring match 整筆排除)
    if (excludeIngredients.length && excludeIngredients.some(i => pr.ingredientsText.includes(i))) return false
    if (onlyPrescription && !pr.isPrescription) return false
    return true
  })

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const start = (page - 1) * limit
  const paginated = filtered.slice(start, start + limit)

  // alignment §3.6 對應的 ApiProduct shape;functional / isGrainFree 永遠空(Phase 1 schema 保留)
  const toResponse = (pr: MockProduct) => ({
    id: pr.id,
    title: pr.title,
    brand: pr.brand,
    petType: pr.petType,
    form: pr.form,
    age: pr.age,
    isPrescription: pr.isPrescription,
    volume: pr.volume,
    price: pr.price,
    priceSource: 'official',
    priceUpdatedAt: '2026-05-01',
    images: [`https://picsum.photos/seed/petfood-${pr.id}/600/400`],
    ingredientsText: pr.ingredientsText,
    proteinPct: pr.proteinPct,
    fatPct: pr.fatPct,
    fiberPct: pr.fiberPct,
    carbsPct: pr.carbsPct,
    phosphorusPct: pr.phosphorusPct,
    caloriesKcalPerKg: pr.caloriesKcalPerKg,
    functional: [] as string[],
    isGrainFree: null,
  })

  return {
    products: paginated.map(toResponse),
    pagination: { page, limit, total, totalPages },
  }
}

// 詳情頁 mock(Phase 1 範圍擴大,2026-04-26 決議);列表外的擴展欄位先給 null / 空陣列
export const findProduct = (id: number) => {
  const pr = PRODUCTS.find(p => p.id === id)
  if (!pr) return null
  return {
    id: pr.id,
    title: pr.title,
    brand: pr.brand,
    petType: pr.petType,
    form: pr.form,
    age: pr.age,
    isPrescription: pr.isPrescription,
    volume: pr.volume,
    price: pr.price,
    priceSource: 'official',
    priceUpdatedAt: '2026-05-01',
    images: [
      `https://picsum.photos/seed/petfood-${pr.id}/800/600`,
      `https://picsum.photos/seed/petfood-${pr.id}-back/800/600`,
    ],
    ingredientsText: pr.ingredientsText,
    proteinPct: pr.proteinPct,
    fatPct: pr.fatPct,
    fiberPct: pr.fiberPct,
    carbsPct: pr.carbsPct,
    phosphorusPct: pr.phosphorusPct,
    caloriesKcalPerKg: pr.caloriesKcalPerKg,
    functional: [] as string[],
    isGrainFree: null,
    // 詳情頁擴展欄位(列表頁不回);Phase 1 mock 暫給 null,等後端 alignment §11.2 補資料
    feedingGuide: null,
    origin: null,
    sourceUrl: null,
  }
}
