// Phase 1 篩選狀態定義(對應 alignment doc §2.3 的 5 + 1 組)
//
// FilterState 的職責:
// - 作為 URL query / Sidebar / Drawer 三方的共用資料結構
// - URL 為單一真實來源,parseFilterQuery 與 toQueryParams 是進出邊界
// - 每個欄位都是 string[](OR within field;empty array = 不篩)

// 多選欄位(同欄位多值 = OR);query 用逗號分隔
export const MULTI_FILTER_KEYS = [
  'petType',           // cat / dog
  'form',              // wet / dry
  'age',               // kitten / adult / senior / all
  'brand',             // 品牌(後端 value,Phase 1 為中文)
  'ingredient',        // 包含成分(OR)
  'excludeIngredient', // 排除成分(AND NOT;UI 上仍以 chip 多選)
] as const

// 布林欄位(toggle);URL 上以 'true' / 缺失 表示
export const TOGGLE_FILTER_KEYS = ['isPrescription'] as const

export const FILTER_KEYS = [...MULTI_FILTER_KEYS, ...TOGGLE_FILTER_KEYS] as const

export type MultiFilterKey = typeof MULTI_FILTER_KEYS[number]
export type ToggleFilterKey = typeof TOGGLE_FILTER_KEYS[number]
export type FilterKey = typeof FILTER_KEYS[number]

export interface FilterState {
  petType: string[]
  form: string[]
  age: string[]
  brand: string[]
  ingredient: string[]
  excludeIngredient: string[]
  isPrescription: boolean
}

export const emptyFilterState = (): FilterState => ({
  petType: [],
  form: [],
  age: [],
  brand: [],
  ingredient: [],
  excludeIngredient: [],
  isPrescription: false,
})

export const cloneFilterState = (s: FilterState): FilterState => ({
  petType: [...s.petType],
  form: [...s.form],
  age: [...s.age],
  brand: [...s.brand],
  ingredient: [...s.ingredient],
  excludeIngredient: [...s.excludeIngredient],
  isPrescription: s.isPrescription,
})

export const countSelected = (s: FilterState): number => {
  let n = 0
  for (const k of MULTI_FILTER_KEYS) n += s[k].length
  if (s.isPrescription) n += 1
  return n
}

// URL → FilterState(載入頁面、上一頁/下一頁、外部分享連結)
export const parseFilterQuery = (q: Record<string, unknown>): FilterState => {
  const state = emptyFilterState()
  for (const k of MULTI_FILTER_KEYS) {
    const v = q[k]
    state[k] = v ? String(v).split(',').filter(Boolean) : []
  }
  // toggle 接受 'true' / true / '1';其餘視為 false
  const presc = q.isPrescription
  state.isPrescription = presc === 'true' || presc === true || presc === '1'
  return state
}

// FilterState → URL query(寫回 router.push,空值省略以保持 URL 乾淨)
export const toQueryParams = (s: FilterState): Record<string, string> => {
  const q: Record<string, string> = {}
  for (const k of MULTI_FILTER_KEYS) {
    if (s[k].length) q[k] = s[k].join(',')
  }
  if (s.isPrescription) q.isPrescription = 'true'
  return q
}
