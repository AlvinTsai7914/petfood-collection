// 統一 fetch + normalizer 層
// 對應 alignment doc §4.2 F15:把後端 v2 shape 轉成前端模型,
// UI 層只看前端模型,不接觸 backend 原始欄位、不做字串 parse、不做派生計算。

import type { Ref } from 'vue'

// ============================================================
// 後端 v2 shape — 對應 docs/api-260429.txt + alignment doc §3.6
// ============================================================

/** 統一回應外殼 */
export interface ApiEnvelope<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string }
}

/** 篩選選項(filter option) */
export interface ApiFilterOption {
  value: string
  label: string
  count: number
}

/** /api/filters 回傳 */
export interface ApiFiltersData {
  brands: ApiFilterOption[]
  ingredients: ApiFilterOption[]
  petTypes: ApiFilterOption[]
  forms: ApiFilterOption[]
  // alignment §3.1 B1 後端待補
  ages?: ApiFilterOption[]
  isPrescription: ApiFilterOption[]
}

/** /api/products 單筆產品(包含 alignment §3.6 目標 shape;凡是後端尚未補的欄位皆 optional) */
export interface ApiProduct {
  id: number
  title: string
  brand: string
  petType: 'cat' | 'dog'
  form: 'wet' | 'dry'
  isPrescription: boolean

  // alignment §3.1 後端待補(B1-B4)
  age?: 'kitten' | 'adult' | 'senior' | 'all' | null
  volume?: string | null
  price?: number | null
  priceSource?: string | null
  priceUpdatedAt?: string | null
  images?: string[]

  // alignment §3.2 B5b:nutrition 結構化欄位由後端 parse;raw 字串只在詳情頁原樣顯示
  nutritionText?: string | null
  // alignment §3.2 B6(2026-05-06 拍板):成分保留字串原樣,後端不拆陣列
  ingredientsText?: string | null

  // 結構化營養(後端 parse 後欄位)
  proteinPct?: number | null
  fatPct?: number | null
  fiberPct?: number | null
  // alignment §3.3 B8c:後端公式算 100 - protein - fat - fiber - moisture - ash
  carbsPct?: number | null
  // alignment §3.3 B8:從 nutritionText 拆,Phase 1 接受多數 null
  phosphorusPct?: number | null
  // alignment §3.2 B5:取代 caloriesText
  caloriesKcalPerKg?: number | null
  caloriesText?: string | null

  // alignment §3.4:Phase 1 schema 保留,永遠空 / null
  functional?: string[]
  isGrainFree?: boolean | null

  // 詳情頁欄位(backend-issues #7:live 回頂層 url;alignment §11 提案名為 sourceUrl)
  url?: string | null
  sourceUrl?: string | null
  feedingGuide?: string | null
  origin?: string | null
}

export interface ApiPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiProductsData {
  products: ApiProduct[]
  pagination: ApiPagination
}

// ============================================================
// 前端模型 — UI 層使用,null 已收斂、預設值已補齊
// ============================================================

export interface FilterOption {
  value: string
  label: string
  count: number
}

/** Sidebar / Drawer 的 5 + 1 組篩選資料來源 */
export interface FilterOptions {
  petTypes: FilterOption[]
  forms: FilterOption[]
  ages: FilterOption[]
  brands: FilterOption[]
  ingredients: FilterOption[]
  isPrescription: FilterOption[]
}

export interface ProductNutrition {
  proteinPct: number | null
  fatPct: number | null
  fiberPct: number | null
  carbsPct: number | null
  phosphorusPct: number | null
  caloriesKcalPerKg: number | null
}

/** 前端共用的產品模型(ProductCard / 詳情頁皆用此) */
export interface Product {
  id: number
  title: string
  brand: string
  petType: 'cat' | 'dog'
  form: 'wet' | 'dry'
  age: 'kitten' | 'adult' | 'senior' | 'all' | null
  volume: string | null
  price: number | null
  priceSource: string | null
  priceUpdatedAt: string | null
  images: string[]
  // alignment §3.0:這是「產品包裝原樣字串」,跟篩選字典是不同欄位
  ingredientsText: string | null
  // 保證分析原樣字串 — 詳情頁主要顯示(v3 歸因分析:覆蓋率最高的營養資料源)
  nutritionText: string | null
  isPrescription: boolean
  isGrainFree: boolean | null
  functional: string[]
  nutrition: ProductNutrition
  // 詳情頁欄位;來源連結對 live 的頂層 url 取值
  sourceUrl: string | null
  feedingGuide: string | null
  origin: string | null
}

export interface ProductList {
  products: Product[]
  pagination: ApiPagination
}

// ============================================================
// Normalizer — backend → 前端模型
// ============================================================

const AGE_VALUES = ['kitten', 'adult', 'senior', 'all'] as const

const normalizeAge = (v: unknown): Product['age'] =>
  typeof v === 'string' && (AGE_VALUES as readonly string[]).includes(v)
    ? (v as Product['age'])
    : null

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null

const str = (v: unknown): string | null =>
  typeof v === 'string' && v.length > 0 ? v : null

const strArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.length > 0) : []

export const normalizeProduct = (raw: ApiProduct): Product => ({
  id: raw.id,
  title: raw.title,
  brand: raw.brand,
  petType: raw.petType,
  form: raw.form,
  age: normalizeAge(raw.age),
  volume: str(raw.volume),
  price: num(raw.price),
  priceSource: str(raw.priceSource),
  priceUpdatedAt: str(raw.priceUpdatedAt),
  // alignment §3.1 B4:多圖陣列;首張當卡片預覽
  images: strArr(raw.images),
  // alignment §3.2 B6:後端維持字串原樣,前端僅在詳情頁原樣顯示
  ingredientsText: str(raw.ingredientsText),
  nutritionText: str(raw.nutritionText),
  isPrescription: Boolean(raw.isPrescription),
  isGrainFree: typeof raw.isGrainFree === 'boolean' ? raw.isGrainFree : null,
  functional: strArr(raw.functional),
  nutrition: {
    proteinPct: num(raw.proteinPct),
    fatPct: num(raw.fatPct),
    fiberPct: num(raw.fiberPct),
    carbsPct: num(raw.carbsPct),
    phosphorusPct: num(raw.phosphorusPct),
    caloriesKcalPerKg: num(raw.caloriesKcalPerKg),
  },
  sourceUrl: str(raw.url) ?? str(raw.sourceUrl),
  feedingGuide: str(raw.feedingGuide),
  origin: str(raw.origin),
})

export const normalizeFilters = (raw: ApiFiltersData): FilterOptions => ({
  petTypes: raw.petTypes ?? [],
  forms: raw.forms ?? [],
  ages: raw.ages ?? [],
  brands: raw.brands ?? [],
  ingredients: raw.ingredients ?? [],
  isPrescription: raw.isPrescription ?? [],
})

// ============================================================
// 預設空值(SSR 失敗時 graceful fallback,避免頁面 500)
// ============================================================

const emptyFilters = (): FilterOptions => ({
  petTypes: [], forms: [], ages: [], brands: [], ingredients: [], isPrescription: [],
})

const emptyProductList = (): ProductList => ({
  products: [],
  pagination: { page: 1, limit: 24, total: 0, totalPages: 1 },
})

const unwrap = <TRaw, TOut>(
  res: ApiEnvelope<TRaw> | null | undefined,
  normalize: (raw: TRaw) => TOut,
  fallback: () => TOut,
): TOut => {
  if (!res || !res.success || !res.data) return fallback()
  return normalize(res.data)
}

// ============================================================
// Composables — useAsyncData + $fetch,呼叫端直接拿 normalized 結果
// (用 useAsyncData 而非 useFetch 是為了讓 transform 型別乾淨;
//  SSR / 快取 / dedupe 行為與 useFetch 等價)
// ============================================================

type ProductsQuery = Record<string, string | string[] | number | undefined>

/** 取得篩選選項(1 hr 快取);全站共享 key,Sidebar / Drawer 都用同一份 */
export const useFilters = () =>
  useAsyncData<FilterOptions>(
    'filters',
    async () => {
      const res = await $fetch<ApiEnvelope<ApiFiltersData>>('/api/filters')
      return unwrap(res, normalizeFilters, emptyFilters)
    },
    { default: emptyFilters },
  )

/** 取得產品列表(5 min 快取);query 變動會自動重抓(URL → filters → API) */
export const useProducts = (
  query: Ref<ProductsQuery> | (() => ProductsQuery),
) => {
  const queryFn = typeof query === 'function' ? query : () => query.value
  return useAsyncData<ProductList>(
    'products',
    async () => {
      const res = await $fetch<ApiEnvelope<ApiProductsData>>('/api/products', {
        query: queryFn(),
      })
      return unwrap(
        res,
        (raw) => ({
          products: raw.products.map(normalizeProduct),
          pagination: raw.pagination,
        }),
        emptyProductList,
      )
    },
    {
      default: emptyProductList,
      // query 變動自動重抓;getter 在 useAsyncData 內被當作 WatchSource
      watch: [queryFn],
    },
  )
}

/** 取得單一產品(Phase 1 詳情頁用) */
export const useProduct = (id: Ref<string | number> | string | number) => {
  const idRef = isRef(id) ? id : ref(id)
  return useAsyncData<Product | null>(
    () => `product-${idRef.value}`,
    async () => {
      const res = await $fetch<ApiEnvelope<ApiProduct>>(`/api/products/${idRef.value}`)
      return unwrap(res, normalizeProduct, () => null)
    },
    {
      default: () => null,
      watch: [idRef],
    },
  )
}
