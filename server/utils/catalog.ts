interface Nutrition {
  protein: string
  fat: string
  carbs: string
  phosphorus: string
  calories: string
}

interface MockProduct {
  id: string
  name: string
  brand: string
  type: 'cat' | 'dog'
  form: 'wet' | 'dry'
  flavors: string[]
  age: string
  functional: string[]
  special: string[]
  volume: string
  price: number
  image: string
  nutrition: Nutrition
}

const TYPE_LABELS: Record<string, string> = { cat: '貓', dog: '狗' }
const FORM_LABELS: Record<string, string> = { wet: '濕食', dry: '乾糧' }
const AGE_LABELS: Record<string, string> = {
  kitten: '幼貓/幼犬', adult: '成貓/成犬', senior: '老貓/老犬', all: '全齡',
}
const BRAND_LABELS: Record<string, string> = {
  wangmiao: '汪喵星球', alleycat: '巷弄貓', nutrience: '紐崔斯',
  ziwi: '巔峰', ziwipeak: 'Ziwi', schesir: 'Schesir', almo: 'Almo Nature',
  applaws: 'Applaws', weruva: 'Weruva', tikicat: 'Tiki Cat', cesar: '西莎', hills: 'Hill\'s',
}
const FLAVOR_LABELS: Record<string, string> = {
  chicken: '雞肉', beef: '牛肉', fish: '魚肉', tuna: '鮪魚', turkey: '火雞',
  lamb: '羊肉', duck: '鴨肉', salmon: '鮭魚', venison: '鹿肉', rabbit: '兔肉',
  quail: '鵪鶉', mixed: '綜合',
}
const FUNCTIONAL_LABELS: Record<string, string> = {
  kidney: '腎臟保健', urinary: '泌尿道保健', digest: '腸胃保健',
  skin: '皮膚毛髮', joint: '關節保健', hairball: '化毛配方', weight: '體重管理',
}
const SPECIAL_LABELS: Record<string, string> = {
  'grain-free': '無穀', hypoallergenic: '低敏',
}

const p = (
  id: string, name: string, brand: string, type: 'cat' | 'dog', flavors: string[],
  age: string, functional: string[], special: string[], volume: string, price: number,
  protein: number, fat: number, carbs: number, phos: number, cal: number,
): MockProduct => ({
  id, name, brand, type, form: 'wet', flavors, age, functional, special, volume, price,
  image: `https://picsum.photos/seed/${id}/600/200`,
  nutrition: {
    protein: `${protein}%`, fat: `${fat}%`, carbs: `${carbs}%`,
    phosphorus: `${phos} mg/100kcal`, calories: `${cal} kcal/100g`,
  },
})

const PRODUCTS: MockProduct[] = [
  p('prod_001', '98% 鮮肉主食罐 雞肉', 'wangmiao', 'cat', ['chicken'], 'all', ['digest'], ['grain-free'], '165g', 89, 12, 5, 3, 125, 95),
  p('prod_002', '98% 鮮肉主食罐 牛肉', 'wangmiao', 'cat', ['beef'], 'adult', [], ['grain-free'], '165g', 95, 11, 6, 3, 120, 98),
  p('prod_003', '98% 鮮肉主食罐 鮪魚', 'wangmiao', 'cat', ['tuna'], 'all', [], ['grain-free'], '80g', 55, 13, 5, 2, 130, 92),
  p('prod_004', '超鮮嫩雞胸主食罐', 'alleycat', 'cat', ['chicken'], 'adult', [], [], '80g', 65, 10, 4, 2, 110, 85),
  p('prod_005', '超鮮嫩魚肉主食罐', 'alleycat', 'cat', ['fish'], 'adult', ['urinary'], [], '80g', 70, 11, 4, 3, 105, 88),
  p('prod_006', '挑嘴貓 牛肉主食罐', 'nutrience', 'cat', ['beef'], 'adult', ['urinary'], [], '170g', 120, 11, 6, 2, 100, 92),
  p('prod_007', '挑嘴貓 雞肉主食罐', 'nutrience', 'cat', ['chicken'], 'adult', [], [], '170g', 120, 12, 5, 3, 115, 95),
  p('prod_008', '老貓照顧主食罐', 'wangmiao', 'cat', ['chicken', 'fish'], 'senior', ['kidney'], ['hypoallergenic'], '165g', 99, 9, 4, 3, 80, 88),
  p('prod_009', '狗狗鮮魚主食罐', 'wangmiao', 'dog', ['fish'], 'senior', ['kidney', 'joint'], ['hypoallergenic'], '200g', 135, 9, 4, 3, 80, 88),
  p('prod_010', '狗狗鮮雞主食罐', 'wangmiao', 'dog', ['chicken'], 'adult', [], [], '200g', 125, 11, 5, 4, 100, 92),
  p('prod_011', '無穀全齡雞肉主食罐', 'ziwi', 'cat', ['chicken', 'turkey'], 'all', [], ['grain-free', 'hypoallergenic'], '170g', 180, 13, 7, 2, 130, 110),
  p('prod_012', '無穀全齡牛肉主食罐', 'ziwi', 'cat', ['beef'], 'all', [], ['grain-free'], '170g', 180, 12, 8, 2, 125, 108),
  p('prod_013', '鹿肉低敏主食罐', 'ziwipeak', 'dog', ['venison'], 'adult', ['skin'], ['grain-free', 'hypoallergenic'], '170g', 220, 12, 6, 2, 95, 105),
  p('prod_014', '羊肉鮮食主食罐', 'ziwipeak', 'cat', ['lamb'], 'adult', [], ['grain-free'], '170g', 210, 13, 7, 2, 110, 102),
  p('prod_015', '兔肉低敏主食罐', 'ziwipeak', 'cat', ['rabbit'], 'kitten', [], ['grain-free', 'hypoallergenic'], '85g', 130, 14, 6, 2, 135, 115),
  p('prod_016', 'Schesir 鮪魚主食罐', 'schesir', 'cat', ['tuna'], 'adult', [], [], '85g', 45, 13, 3, 2, 125, 80),
  p('prod_017', 'Schesir 雞肉主食罐', 'schesir', 'cat', ['chicken'], 'adult', [], [], '85g', 45, 12, 3, 2, 120, 78),
  p('prod_018', 'Almo HFC 鮭魚主食罐', 'almo', 'cat', ['salmon'], 'adult', ['skin'], ['grain-free'], '70g', 55, 14, 4, 2, 110, 85),
  p('prod_019', 'Almo HFC 鮪魚主食罐', 'almo', 'cat', ['tuna'], 'adult', [], ['grain-free'], '70g', 55, 13, 3, 2, 115, 82),
  p('prod_020', 'Applaws 雞胸肉主食罐', 'applaws', 'cat', ['chicken'], 'adult', [], ['grain-free'], '70g', 48, 15, 3, 2, 120, 80),
  p('prod_021', 'Weruva 雞湯主食罐', 'weruva', 'cat', ['chicken'], 'all', [], ['grain-free'], '85g', 68, 11, 3, 3, 100, 75),
  p('prod_022', 'Tiki Cat 鮪魚主食罐', 'tikicat', 'cat', ['tuna'], 'adult', [], ['grain-free'], '80g', 58, 14, 3, 2, 125, 78),
  p('prod_023', 'Tiki Cat 雞肉主食罐', 'tikicat', 'cat', ['chicken'], 'senior', ['kidney'], [], '80g', 58, 10, 3, 3, 85, 75),
  p('prod_024', '西莎 成犬牛肉主食罐', 'cesar', 'dog', ['beef'], 'adult', [], [], '100g', 28, 8, 5, 5, 120, 95),
  p('prod_025', '西莎 老犬雞肉主食罐', 'cesar', 'dog', ['chicken'], 'senior', ['joint'], [], '100g', 30, 9, 4, 4, 100, 92),
  p('prod_026', 'Hill\'s 腎臟處方主食罐', 'hills', 'cat', ['chicken'], 'senior', ['kidney'], ['hypoallergenic'], '156g', 150, 10, 5, 8, 70, 105),
  p('prod_027', 'Hill\'s 體重管理主食罐', 'hills', 'cat', ['chicken'], 'adult', ['weight'], [], '156g', 140, 12, 2, 6, 95, 78),
  p('prod_028', '幼貓啟蒙雞肉主食罐', 'nutrience', 'cat', ['chicken'], 'kitten', [], ['grain-free'], '170g', 130, 14, 7, 2, 140, 115),
  p('prod_029', '幼犬啟蒙主食罐', 'wangmiao', 'dog', ['chicken'], 'kitten', [], [], '200g', 140, 14, 7, 3, 135, 112),
  p('prod_030', '化毛配方主食罐', 'alleycat', 'cat', ['chicken', 'tuna'], 'adult', ['hairball', 'digest'], [], '80g', 75, 11, 4, 3, 110, 85),
]

const count = (pred: (p: MockProduct) => boolean) => PRODUCTS.filter(pred).length

const buildOptions = (
  labels: Record<string, string>,
  matches: (p: MockProduct, value: string) => boolean,
) => Object.entries(labels).map(([value, label]) => ({
  value, label, count: count(p => matches(p, value)),
}))

const FILTER_OPTIONS = {
  types: buildOptions(TYPE_LABELS, (p, v) => p.type === v),
  forms: buildOptions(FORM_LABELS, (p, v) => p.form === v),
  ages: buildOptions(AGE_LABELS, (p, v) => p.age === v),
  brands: buildOptions(BRAND_LABELS, (p, v) => p.brand === v),
  flavors: buildOptions(FLAVOR_LABELS, (p, v) => p.flavors.includes(v)),
  functional: buildOptions(FUNCTIONAL_LABELS, (p, v) => p.functional.includes(v)),
  special: buildOptions(SPECIAL_LABELS, (p, v) => p.special.includes(v)),
}

export const getFilterOptions = () => FILTER_OPTIONS

const arr = (v: unknown): string[] => {
  if (!v) return []
  if (Array.isArray(v)) return v.map(String)
  return String(v).split(',').filter(Boolean)
}

export const queryProducts = (query: Record<string, unknown>) => {
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 24))

  const types = arr(query.type)
  const forms = arr(query.form)
  const ages = arr(query.age)
  const brands = arr(query.brand)
  const flavors = arr(query.flavor)
  const funcs = arr(query.func)
  const specials = arr(query.special)

  const filtered = PRODUCTS.filter((pr) => {
    if (types.length && !types.includes(pr.type)) return false
    if (forms.length && !forms.includes(pr.form)) return false
    if (ages.length && !ages.includes(pr.age)) return false
    if (brands.length && !brands.includes(pr.brand)) return false
    if (flavors.length && !pr.flavors.some(f => flavors.includes(f))) return false
    if (funcs.length && !pr.functional.some(f => funcs.includes(f))) return false
    if (specials.length && !pr.special.some(s => specials.includes(s))) return false
    return true
  })

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const start = (page - 1) * limit
  const paginated = filtered.slice(start, start + limit)

  const toResponse = (pr: MockProduct) => ({
    id: pr.id,
    name: pr.name,
    brand: BRAND_LABELS[pr.brand] ?? pr.brand,
    type: pr.type,
    typeLabel: TYPE_LABELS[pr.type] ?? pr.type,
    form: pr.form,
    formLabel: FORM_LABELS[pr.form] ?? pr.form,
    flavors: pr.flavors.map(f => FLAVOR_LABELS[f] ?? f),
    age: pr.age,
    ageLabel: AGE_LABELS[pr.age] ?? pr.age,
    functional: pr.functional.map(f => FUNCTIONAL_LABELS[f] ?? f),
    special: pr.special.map(s => SPECIAL_LABELS[s] ?? s),
    volume: pr.volume,
    price: pr.price,
    image: pr.image,
    nutrition: pr.nutrition,
  })

  return {
    products: paginated.map(toResponse),
    pagination: { page, limit, total, totalPages },
  }
}
