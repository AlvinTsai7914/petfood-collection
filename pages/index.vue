<script setup lang="ts">
import type { FilterKey, FilterState, MultiFilterKey } from '~/utils/filter-state'

// 首頁有自己的 full-height flex + 獨立 scrollbar + header 縮放,不套 default layout
definePageMeta({ layout: false })

const route = useRoute()
const router = useRouter()

// filters 內存狀態 — 立即響應 UI;URL 是最終真實狀態,經 debounce 同步
const filters = ref<FilterState>(parseFilterQuery(route.query))

// URL → filters(上一頁/下一頁、書籤)
let syncingFromUrl = false
watch(() => route.query, (q) => {
  syncingFromUrl = true
  filters.value = parseFilterQuery(q)
  nextTick(() => { syncingFromUrl = false })
})

// filters → URL(debounce 300ms,符合 spec 桌機 instant filter 需求)
let debounceTimer: ReturnType<typeof setTimeout> | undefined
watch(filters, (f) => {
  if (syncingFromUrl) return
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    router.replace({ query: toQueryParams(f) })
  }, 300)
}, { deep: true })

// 抓篩選選項(靜態、1 hr 快取);composable 已 normalize 出 5 + 1 組
const { data: filterOptions } = await useFilters()

// API 參數只從 route.query 推導(不讀內存 filters):
// 內存 filters 變動先經 300ms debounce 寫回 URL,URL 變了才觸發 refetch —
// 每次點選只打一次 API,且分享連結 / 上一頁下一頁天然一致
const productsQuery = computed(() => {
  const out: Record<string, string> = { ...toQueryParams(parseFilterQuery(route.query)) }
  if (route.query.page) out.page = String(route.query.page)
  if (route.query.limit) out.limit = String(route.query.limit)
  return out
})

// 抓產品(URL query 變動 → 自動 refetch);composable 統一吃 envelope 與 normalize
const { data: productList, pending, error, refresh } = await useProducts(productsQuery)
const products = computed(() => productList.value!.products)
const pagination = computed(() => productList.value!.pagination)

// Drawer
const drawerOpen = ref(false)

const totalSelected = computed(() => countSelected(filters.value))

// 多選欄位的 label 對應(用於 active tag 顯示中文)
const multiOptionsByKey = computed<Record<MultiFilterKey, { value: string; label: string }[]>>(() => {
  const o = filterOptions.value!
  return {
    petType: o.petTypes,
    form: o.forms,
    age: o.ages,
    brand: o.brands,
    ingredient: o.ingredients,
    excludeIngredient: o.ingredients,
  }
})

// 已選標籤(從 filters + filterOptions 推導顯示用 label;排除成分前綴 「排除:」 區別)
const activeTags = computed(() => {
  const rows: { field: FilterKey; value: string; label: string }[] = []
  for (const key of MULTI_FILTER_KEYS) {
    const list = multiOptionsByKey.value[key]
    for (const v of filters.value[key]) {
      const baseLabel = list?.find(o => o.value === v)?.label ?? v
      const label = key === 'excludeIngredient' ? `排除:${baseLabel}` : baseLabel
      rows.push({ field: key, value: v, label })
    }
  }
  if (filters.value.isPrescription) {
    rows.push({ field: 'isPrescription', value: 'true', label: '處方飼料' })
  }
  return rows
})

// 卡片上點標籤 → 加入篩選;step C 改完 ProductCard 後 fields 會固定為以下幾個
const cardFieldToFilterKey: Record<string, MultiFilterKey> = {
  petType: 'petType',
  form: 'form',
  age: 'age',
  brand: 'brand',
  ingredient: 'ingredient',
}

const onCardTagClick = (field: string, value: string) => {
  const key = cardFieldToFilterKey[field]
  if (!key) return
  if (!filters.value[key].includes(value)) {
    filters.value[key] = [...filters.value[key], value]
  }
}

const removeTag = (field: FilterKey, value: string) => {
  if (field === 'isPrescription') {
    filters.value.isPrescription = false
    return
  }
  filters.value[field] = filters.value[field].filter(v => v !== value)
}

const clearAllFilters = () => {
  filters.value = emptyFilterState()
}

// 換頁:寫回 URL + 把 main 捲到頂;page=1 不放進 URL 保持網址乾淨
const onPageChange = (pg: number) => {
  const query = { ...route.query }
  if (pg > 1) query.page = String(pg)
  else delete query.page
  router.push({ query })
  mainRef.value?.scrollTo({ top: 0 })
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
  clearTimeout(debounceTimer)
})
</script>

<template>
  <div class="flex h-full flex-col bg-white">
    <LayoutAppHeader :compact="isScrolled" />

    <div class="flex min-h-0 flex-1">
      <FilterSidebar
        v-model="filters"
        :filter-options="filterOptions!"
        class="hidden w-64 flex-none overflow-y-auto md:block"
      />

      <main ref="mainRef" class="min-w-0 flex-1 overflow-y-auto">
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
          <div v-if="activeTags.length" class="mt-2 flex flex-wrap items-center gap-2">
            <FilterActiveTag
              v-for="tag in activeTags"
              :key="tag.field + tag.value"
              :label="tag.label"
              @remove="removeTag(tag.field, tag.value)"
            />
          </div>
        </section>

        <section
          v-if="activeTags.length"
          class="sticky top-0 z-10 hidden flex-wrap items-center gap-2 border-b border-neutral-100 bg-white px-6 py-3 text-small md:flex"
        >
          <span class="text-neutral-400">已選:</span>
          <FilterActiveTag
            v-for="tag in activeTags"
            :key="tag.field + tag.value"
            :label="tag.label"
            @remove="removeTag(tag.field, tag.value)"
          />
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

        <section class="px-6 py-6">
          <div
            v-if="pending && products.length === 0"
            class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
          >
            <UiProductSkeleton v-for="n in 8" :key="n" />
          </div>

          <UiErrorState
            v-else-if="error"
            :message="error.message"
            @retry="refresh"
          />

          <UiEmptyState
            v-else-if="products.length === 0"
            @clear="clearAllFilters"
          />

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

          <UiPagination
            :page="pagination.page"
            :total-pages="pagination.totalPages"
            @change="onPageChange"
          />
        </section>
      </main>
    </div>

    <FilterDrawer
      v-model:open="drawerOpen"
      v-model="filters"
      :filter-options="filterOptions!"
    />
  </div>
</template>
