<script setup lang="ts">
import type { FilterState } from '~/components/filter/FilterSidebar.vue'

const products = [
  {
    id: 'prod_001',
    name: '98% 鮮肉主食罐 雞肉',
    brand: '汪喵星球',
    type: 'cat' as const, typeLabel: '貓',
    form: 'wet' as const, formLabel: '濕食',
    flavors: ['雞肉'],
    age: 'all', ageLabel: '全齡',
    functional: ['腸胃保健'],
    special: ['無穀'],
    volume: '165g',
    price: 89,
    image: 'https://picsum.photos/seed/p1/600/450',
    nutrition: { protein: '12%', fat: '5%', carbs: '3%', phosphorus: '125 mg/100kcal', calories: '95 kcal/100g' },
  },
  {
    id: 'prod_002',
    name: '超鮮嫩雞胸主食罐',
    brand: '巷弄貓',
    type: 'cat' as const, typeLabel: '貓',
    form: 'wet' as const, formLabel: '濕食',
    flavors: ['雞肉'],
    age: 'adult', ageLabel: '成貓/成犬',
    functional: [],
    special: [],
    volume: '80g',
    price: 65,
    image: 'https://picsum.photos/seed/p2/600/450',
    nutrition: { protein: '10%', fat: '4%', carbs: '2%', phosphorus: '110 mg/100kcal', calories: '85 kcal/100g' },
  },
  {
    id: 'prod_003',
    name: '挑嘴貓 牛肉主食罐',
    brand: '紐崔斯',
    type: 'cat' as const, typeLabel: '貓',
    form: 'wet' as const, formLabel: '濕食',
    flavors: ['牛肉'],
    age: 'adult', ageLabel: '成貓/成犬',
    functional: ['泌尿道保健'],
    special: [],
    volume: '170g',
    price: 120,
    image: 'https://picsum.photos/seed/p3/600/450',
    nutrition: { protein: '11%', fat: '6%', carbs: '2%', phosphorus: '100 mg/100kcal', calories: '92 kcal/100g' },
  },
  {
    id: 'prod_004',
    name: '狗狗鮮魚主食罐',
    brand: '汪喵星球',
    type: 'dog' as const, typeLabel: '狗',
    form: 'wet' as const, formLabel: '濕食',
    flavors: ['魚肉'],
    age: 'senior', ageLabel: '老貓/老犬',
    functional: ['腎臟保健', '關節保健'],
    special: ['低敏'],
    volume: '200g',
    price: 135,
    image: 'https://picsum.photos/seed/p4/600/450',
    nutrition: { protein: '9%', fat: '4%', carbs: '3%', phosphorus: '80 mg/100kcal', calories: '88 kcal/100g' },
  },
  {
    id: 'prod_005',
    name: '無穀全齡雞肉主食罐',
    brand: '巔峰',
    type: 'cat' as const, typeLabel: '貓',
    form: 'wet' as const, formLabel: '濕食',
    flavors: ['雞肉', '火雞'],
    age: 'all', ageLabel: '全齡',
    functional: [],
    special: ['無穀', '低敏'],
    volume: '170g',
    price: 180,
    image: 'https://picsum.photos/seed/p5/600/450',
    nutrition: { protein: '13%', fat: '7%', carbs: '2%', phosphorus: '130 mg/100kcal', calories: '110 kcal/100g' },
  },
  {
    id: 'prod_006',
    name: '鹿肉低敏主食罐',
    brand: 'Ziwi',
    type: 'dog' as const, typeLabel: '狗',
    form: 'wet' as const, formLabel: '濕食',
    flavors: ['鹿肉'],
    age: 'adult', ageLabel: '成貓/成犬',
    functional: ['皮膚毛髮'],
    special: ['無穀', '低敏'],
    volume: '170g',
    price: 220,
    image: 'https://picsum.photos/seed/p6/600/450',
    nutrition: { protein: '12%', fat: '6%', carbs: '2%', phosphorus: '95 mg/100kcal', calories: '105 kcal/100g' },
  },
]

const filterOptions = {
  types: [
    { value: 'cat', label: '貓' },
    { value: 'dog', label: '狗' },
  ],
  forms: [
    { value: 'wet', label: '濕食' },
    { value: 'dry', label: '乾糧' },
  ],
  ages: [
    { value: 'kitten', label: '幼貓/幼犬' },
    { value: 'adult', label: '成貓/成犬' },
    { value: 'senior', label: '老貓/老犬' },
    { value: 'all', label: '全齡' },
  ],
  brands: [
    { value: 'wangmiao', label: '汪喵星球', count: 24 },
    { value: 'alleycat', label: '巷弄貓', count: 18 },
    { value: 'nutrience', label: '紐崔斯', count: 15 },
    { value: 'ziwi', label: '巔峰', count: 12 },
    { value: 'ziwipeak', label: 'Ziwi', count: 11 },
    { value: 'schesir', label: 'Schesir', count: 9 },
    { value: 'almo', label: 'Almo Nature', count: 8 },
    { value: 'applaws', label: 'Applaws', count: 7 },
    { value: 'weruva', label: 'Weruva', count: 6 },
    { value: 'tikicat', label: 'Tiki Cat', count: 5 },
    { value: 'cesar', label: '西莎', count: 4 },
    { value: 'hills', label: 'Hill\'s', count: 3 },
  ],
  flavors: [
    { value: 'chicken', label: '雞肉', count: 52 },
    { value: 'beef', label: '牛肉', count: 28 },
    { value: 'fish', label: '魚肉', count: 24 },
    { value: 'tuna', label: '鮪魚', count: 20 },
    { value: 'turkey', label: '火雞', count: 15 },
    { value: 'lamb', label: '羊肉', count: 12 },
    { value: 'duck', label: '鴨肉', count: 10 },
    { value: 'salmon', label: '鮭魚', count: 9 },
    { value: 'venison', label: '鹿肉', count: 7 },
    { value: 'rabbit', label: '兔肉', count: 5 },
    { value: 'quail', label: '鵪鶉', count: 3 },
    { value: 'mixed', label: '綜合', count: 18 },
  ],
  functional: [
    { value: 'kidney', label: '腎臟保健' },
    { value: 'urinary', label: '泌尿道保健' },
    { value: 'digest', label: '腸胃保健' },
    { value: 'skin', label: '皮膚毛髮' },
    { value: 'joint', label: '關節保健' },
    { value: 'hairball', label: '化毛配方' },
    { value: 'weight', label: '體重管理' },
  ],
  special: [
    { value: 'grain-free', label: '無穀' },
    { value: 'hypoallergenic', label: '低敏' },
  ],
}

const filters = ref<FilterState>({
  type: [], form: [], age: [], brand: [], flavor: [], func: [], special: [],
})

type FilterKey = keyof FilterState

const cardFieldToFilterKey: Record<string, FilterKey> = {
  type: 'type',
  form: 'form',
  age: 'age',
  flavor: 'flavor',
  functional: 'func',
  special: 'special',
}

const onCardTagClick = (field: string, value: string) => {
  const key = cardFieldToFilterKey[field]
  if (!key) return
  if (!filters.value[key].includes(value)) {
    filters.value[key] = [...filters.value[key], value]
  }
}

const filterKeyToOptions: Record<FilterKey, Array<{ value: string; label: string }>> = {
  type: filterOptions.types,
  form: filterOptions.forms,
  age: filterOptions.ages,
  brand: filterOptions.brands,
  flavor: filterOptions.flavors,
  func: filterOptions.functional,
  special: filterOptions.special,
}

const activeTags = computed(() => {
  const rows: { field: FilterKey; value: string; label: string }[] = []
  for (const key of Object.keys(filters.value) as FilterKey[]) {
    for (const v of filters.value[key]) {
      const label = filterKeyToOptions[key].find(o => o.value === v)?.label ?? v
      rows.push({ field: key, value: v, label })
    }
  }
  return rows
})

const removeTag = (field: FilterKey, value: string) => {
  filters.value[field] = filters.value[field].filter(v => v !== value)
}

const clearAllFilters = () => {
  filters.value = { type: [], form: [], age: [], brand: [], flavor: [], func: [], special: [] }
}

const drawerOpen = ref(false)

const totalSelected = computed(() =>
  Object.values(filters.value).reduce((s, a) => s + a.length, 0)
)

const mainRef = ref<HTMLElement>()
const isScrolled = ref(false)

const handleScroll = () => {
  isScrolled.value = (mainRef.value?.scrollTop ?? 0) > 8
}

onMounted(() => {
  mainRef.value?.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  mainRef.value?.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="flex h-full flex-col bg-white">
    <header
      class="flex-none border-b border-neutral-100 transition-all duration-200 ease-out"
      :class="isScrolled ? 'py-2' : 'py-5'"
    >
      <div class="flex items-center justify-between px-6">
        <h1
          class="tracking-tight transition-all duration-200 ease-out"
          :class="isScrolled ? 'text-small font-medium' : 'text-h3'"
        >
          寵物食品資料庫
        </h1>
        <nav class="flex gap-6 text-small text-neutral-600">
          <a href="#" class="hover:text-neutral-900">關於我們</a>
          <a href="#" class="hover:text-neutral-900">聯絡方式</a>
        </nav>
      </div>
    </header>

    <div class="flex min-h-0 flex-1">
      <aside class="hidden w-64 flex-none overflow-y-auto md:block">
        <FilterSidebar v-model="filters" :filter-options="filterOptions" />
      </aside>

      <main ref="mainRef" class="min-w-0 flex-1 overflow-y-auto">
        <!-- 手機:固定於頂部的篩選入口列(含已選標籤) -->
        <section class="sticky top-0 z-10 border-b border-neutral-100 bg-white px-6 py-3 md:hidden">
          <div class="flex items-center gap-3">
            <button
              class="flex flex-none items-center gap-2 border border-neutral-300 px-3 py-1.5 text-small text-neutral-700 hover:border-neutral-500 hover:text-neutral-900"
              @click="drawerOpen = true"
            >
              <svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 3h12M4 8h8M6 13h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"/>
              </svg>
              篩選
              <span v-if="totalSelected" class="font-mono tabular-nums text-accent">({{ totalSelected }})</span>
            </button>
            <button
              v-if="totalSelected > 0"
              class="text-caption text-neutral-400 underline underline-offset-2 hover:text-neutral-900"
              @click="clearAllFilters"
            >
              清除
            </button>
          </div>
          <div v-if="activeTags.length" class="mt-2 flex flex-wrap items-center gap-2 text-small">
            <button
              v-for="tag in activeTags"
              :key="tag.field + tag.value"
              class="group flex items-center gap-2 border border-neutral-300 px-2 py-1 hover:border-accent"
              @click="removeTag(tag.field, tag.value)"
            >
              <span>{{ tag.label }}</span>
              <span class="text-neutral-400 group-hover:text-accent">✕</span>
            </button>
          </div>
        </section>

        <!-- 桌機/平板:sticky 已選標籤列(有選才顯示) -->
        <section
          v-if="activeTags.length"
          class="sticky top-0 z-10 hidden flex-wrap items-center gap-2 border-b border-neutral-100 bg-white px-6 py-3 text-small md:flex"
        >
          <span class="text-neutral-400">已選:</span>
          <button
            v-for="tag in activeTags"
            :key="tag.field + tag.value"
            class="group flex items-center gap-2 border border-neutral-300 px-2 py-1 hover:border-accent"
            @click="removeTag(tag.field, tag.value)"
          >
            <span>{{ tag.label }}</span>
            <span class="text-neutral-400 group-hover:text-accent">✕</span>
          </button>
          <button
            class="ml-2 text-neutral-400 underline underline-offset-2 hover:text-neutral-900"
            @click="clearAllFilters"
          >
            清除全部
          </button>
        </section>

        <section class="grid grid-cols-1 gap-6 px-6 py-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          <ProductCard
            v-for="product in products"
            :key="product.id"
            :product="product"
            @tag-click="onCardTagClick"
          />
        </section>
      </main>
    </div>

    <FilterDrawer
      v-model:open="drawerOpen"
      v-model="filters"
      :filter-options="filterOptions"
    />
  </div>
</template>
