// enum → 中文 label(spec 封閉集合,前端 hardcode;不依賴後端 *Label)
// ProductCard 與詳情頁共用;alignment doc B1 enum 定案後只改這一份

import type { Product } from '~/composables/useApi'

export const PET_TYPE_LABELS: Record<Product['petType'], string> = { cat: '貓', dog: '狗' }

export const FORM_LABELS: Record<Product['form'], string> = { wet: '濕食', dry: '乾糧' }

export const AGE_LABELS: Record<NonNullable<Product['age']>, string> = {
  kitten: '幼貓/幼犬', adult: '成貓/成犬', senior: '老貓/老犬', all: '全齡',
}
