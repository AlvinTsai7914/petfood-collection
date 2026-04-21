<script setup lang="ts">
import type { FilterState } from '~/components/filter/FilterSidebar.vue'

const route = useRoute()
const router = useRouter()

const FILTER_KEYS = ['type', 'form', 'age', 'brand', 'flavor', 'func', 'special'] as const

const parseFilters = (q: typeof route.query): FilterState => ({
  type: q.type ? String(q.type).split(',') : [],
  form: q.form ? String(q.form).split(',') : [],
  age: q.age ? String(q.age).split(',') : [],
  brand: q.brand ? String(q.brand).split(',') : [],
  flavor: q.flavor ? String(q.flavor).split(',') : [],
  func: q.func ? String(q.func).split(',') : [],
  special: q.special ? String(q.special).split(',') : [],
})

// filters 內存狀態 — 立即響應 UI;URL 是最終真實狀態,經 debounce 同步
const filters = ref<FilterState>(parseFilters(route.query))

// URL → filters(上一頁/下一頁、書籤)
let syncingFromUrl = false
watch(() => route.query, (q) => {
  syncingFromUrl = true
  filters.value = parseFilters(q)
  nextTick(() => { syncingFromUrl = false })
})

// filters → URL(debounce 300ms,符合 spec 桌機 instant filter 需求)
let debounceTimer: ReturnType<typeof setTimeout> | undefined
watch(filters, (f) => {
  if (syncingFromUrl) return
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    const query: Record<string, string> = {}
    for (const k of FILTER_KEYS) {
      const v = f[k]
      if (v.length) query[k] = v.join(',')
    }
    router.replace({ query })
  }, 300)
}, { deep: true })

// 抓篩選選項(靜態、1 hr 快取)
const { data: filtersData } = await useFetch('/api/filters', {
  key: 'filters',
  default: () => ({
    success: true as const,
    data: {
      types: [], forms: [], ages: [], brands: [], flavors: [], functional: [], special: [],
    },
  }),
})
const filterOptions = computed(() => filtersData.value!.data)

// 抓產品(反應式 URL query → 自動 refetch)
const { data: productsData, pending, error, refresh } = await useFetch('/api/products', {
  query: computed(() => route.query),
  default: () => ({
    success: true as const,
    data: {
      products: [],
      pagination: { page: 1, limit: 24, total: 0, totalPages: 1 },
    },
  }),
})
const products = computed(() => productsData.value!.data.products)
const pagination = computed(() => productsData.value!.data.pagination)

// Drawer
const drawerOpen = ref(false)

const totalSelected = computed(() =>
  Object.values(filters.value).reduce((s, a) => s + a.length, 0)
)

// 已選標籤(從 filters + filterOptions 推導顯示用中文 label)
type FilterKey = keyof FilterState
const activeTags = computed(() => {
  const opts = filterOptions.value
  const keyToOptions: Record<FilterKey, Array<{ value: string; label: string }>> = {
    type: opts.types, form: opts.forms, age: opts.ages, brand: opts.brands,
    flavor: opts.flavors, func: opts.functional, special: opts.special,
  }
  const rows: { field: FilterKey; value: string; label: string }[] = []
  for (const key of FILTER_KEYS) {
    for (const v of filters.value[key]) {
      const label = keyToOptions[key]?.find(o => o.value === v)?.label ?? v
      rows.push({ field: key, value: v, label })
    }
  }
  return rows
})

// 卡片上點標籤 → 加入篩選(把 value 或 label 正規化回 slug)
const cardFieldToFilterKey: Record<string, FilterKey> = {
  type: 'type', form: 'form', age: 'age',
  flavor: 'flavor', functional: 'func', special: 'special',
}

const onCardTagClick = (field: string, value: string) => {
  const key = cardFieldToFilterKey[field]
  if (!key) return
  const opts = filterOptions.value
  const optList = {
    type: opts.types, form: opts.forms, age: opts.ages, brand: opts.brands,
    flavor: opts.flavors, func: opts.functional, special: opts.special,
  }[key]
  // 卡片送來的可能是 slug(type/form/age)或中文 label(flavor/func/special)
  let slug = value
  if (!optList.find(o => o.value === value)) {
    slug = optList.find(o => o.label === value)?.value ?? value
  }
  if (!filters.value[key].includes(slug)) {
    filters.value[key] = [...filters.value[key], slug]
  }
}

const removeTag = (field: FilterKey, value: string) => {
  filters.value[field] = filters.value[field].filter(v => v !== value)
}

const clearAllFilters = () => {
  filters.value = { type: [], form: [], age: [], brand: [], flavor: [], func: [], special: [] }
}

// Header 縮小 scroll 監聽
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
        <!-- 手機:sticky 篩選入口 + 已選 -->
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

        <!-- 桌機:sticky 已選標籤(有選才顯示) -->
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
          <span class="ml-auto font-mono text-caption tabular-nums text-neutral-400">
            共 {{ pagination.total }} 筆 · 第 {{ pagination.page }} / {{ pagination.totalPages }} 頁
          </span>
        </section>

        <!-- 主內容區:Loading / Error / Empty / Grid -->
        <section class="px-6 py-6">
          <!-- Loading:骨架 -->
          <div
            v-if="pending && products.length === 0"
            class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
          >
            <UiProductSkeleton v-for="n in 8" :key="n" />
          </div>

          <!-- Error -->
          <UiErrorState
            v-else-if="error"
            :message="error.message"
            @retry="refresh"
          />

          <!-- Empty -->
          <UiEmptyState
            v-else-if="products.length === 0"
            @clear="clearAllFilters"
          />

          <!-- Grid(切篩選時,保留舊資料 + 淡化;spec 要求) -->
          <div
            v-else
            class="grid grid-cols-1 gap-6 transition-opacity duration-200 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
            :class="{ 'opacity-50': pending }"
          >
            <ProductCard
              v-for="product in products"
              :key="product.id"
              :product="product"
              @tag-click="onCardTagClick"
            />
          </div>
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
