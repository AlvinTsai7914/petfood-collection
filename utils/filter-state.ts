export const FILTER_KEYS = ['type', 'form', 'age', 'brand', 'flavor', 'func', 'special'] as const

export type FilterKey = typeof FILTER_KEYS[number]

export interface FilterState {
  type: string[]
  form: string[]
  age: string[]
  brand: string[]
  flavor: string[]
  func: string[]
  special: string[]
}

export const emptyFilterState = (): FilterState =>
  FILTER_KEYS.reduce((acc, k) => {
    acc[k] = []
    return acc
  }, {} as FilterState)

export const cloneFilterState = (s: FilterState): FilterState =>
  FILTER_KEYS.reduce((acc, k) => {
    acc[k] = [...s[k]]
    return acc
  }, {} as FilterState)

export const countSelected = (s: FilterState): number =>
  FILTER_KEYS.reduce((sum, k) => sum + s[k].length, 0)

export const parseFilterQuery = (q: Record<string, unknown>): FilterState =>
  FILTER_KEYS.reduce((acc, k) => {
    const v = q[k]
    acc[k] = v ? String(v).split(',').filter(Boolean) : []
    return acc
  }, {} as FilterState)
