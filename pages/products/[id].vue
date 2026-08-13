<script setup lang="ts">
// 產品詳情頁(F16;alignment doc §2.4)
//
// 顯示策略依 2026-08-13 歸因分析修正(backend-issues v3):
// - 保證分析以 nutritionText 原樣字串為主要顯示(覆蓋率最高的營養資料源),
//   結構化欄位當輔助列,null 整行不渲染
// - 圖片單圖顯示;images[] 超過一張時才出縮圖列(live 現況全庫單圖)
// - 成分 ingredientsText 純文字段落原樣顯示,不切 chip、不做點擊互動(§2.4/§3.0)

const route = useRoute()
const productId = computed(() => String(route.params.id))

const { data: product, pending, error, refresh } = await useProduct(productId)

useSeoMeta({
  title: () => product.value ? `${product.value.title} — 寵物食品產品資料庫` : '寵物食品產品資料庫',
})

const petTypeLabel = computed(() => product.value ? PET_TYPE_LABELS[product.value.petType] : '')
const formLabel = computed(() => product.value ? FORM_LABELS[product.value.form] : '')
const ageLabel = computed(() =>
  product.value?.age ? AGE_LABELS[product.value.age] : null,
)

const productCode = computed(() => product.value ? `PROD-${product.value.id}` : '')

// 主圖 + 縮圖列(多圖才顯示縮圖;live 現況單圖,carousel 等資料出現再升級)
const activeImageIndex = ref(0)
const activeImage = computed(() => product.value?.images[activeImageIndex.value] ?? null)
const imageErrored = ref(false)
const onImageError = () => { imageErrored.value = true }
watch(activeImageIndex, () => { imageErrored.value = false })

// 結構化營養輔助列:有值才進表(v3 歸因:null 是來源頁天生沒標,不渲染「—」)
const nutritionRows = computed(() => {
  const n = product.value?.nutrition
  if (!n) return []
  const rows: { label: string; value: string; unit: string }[] = []
  const pct = (label: string, v: number | null) => {
    if (v !== null) rows.push({ label, value: String(v), unit: '%' })
  }
  pct('粗蛋白質', n.proteinPct)
  pct('粗脂肪', n.fatPct)
  pct('粗纖維', n.fiberPct)
  pct('碳水化合物(推算)', n.carbsPct)
  pct('磷', n.phosphorusPct)
  if (n.caloriesKcalPerKg !== null) {
    rows.push({ label: '熱量', value: String(n.caloriesKcalPerKg), unit: '大卡/kg' })
  }
  return rows
})
</script>

<template>
  <div>
    <!-- 載入中 -->
    <div v-if="pending" class="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <div class="h-4 w-32 animate-pulse bg-neutral-100" />
      <div class="mt-6 grid gap-8 md:grid-cols-2">
        <div class="aspect-[4/3] animate-pulse bg-neutral-100" />
        <div class="space-y-4">
          <div class="h-8 w-3/4 animate-pulse bg-neutral-100" />
          <div class="h-4 w-1/2 animate-pulse bg-neutral-100" />
          <div class="h-24 animate-pulse bg-neutral-100" />
        </div>
      </div>
    </div>

    <!-- 錯誤 -->
    <div v-else-if="error" class="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <UiErrorState @retry="refresh" />
    </div>

    <!-- 查無此產品 -->
    <div v-else-if="!product" class="mx-auto max-w-5xl px-4 py-16 text-center md:px-6">
      <p class="font-mono text-h1 tracking-widest text-neutral-300">404</p>
      <p class="mt-4 text-body text-neutral-600">找不到這個產品,它可能已下架或編號有誤。</p>
      <NuxtLink
        to="/"
        class="mt-8 inline-block border border-neutral-900 px-6 py-2 text-small font-medium text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white"
      >
        返回產品列表
      </NuxtLink>
    </div>

    <!-- 產品內容 -->
    <article v-else class="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-10">
      <nav class="text-caption text-neutral-500">
        <NuxtLink to="/" class="hover:text-neutral-900">產品列表</NuxtLink>
        <span class="mx-2 text-neutral-300">/</span>
        <span class="font-mono tracking-widest text-neutral-400">{{ productCode }}</span>
      </nav>

      <div class="mt-6 grid gap-8 md:grid-cols-2 md:gap-10">
        <!-- 圖片區 -->
        <div>
          <div class="aspect-[4/3] overflow-hidden border border-neutral-200 bg-neutral-50">
            <img
              v-if="activeImage && !imageErrored"
              :src="activeImage"
              :alt="product.title"
              class="h-full w-full object-cover"
              @error="onImageError"
            />
            <div v-else class="flex h-full w-full items-center justify-center">
              <span class="font-mono text-caption tracking-widest text-neutral-400">NO IMAGE</span>
            </div>
          </div>
          <!-- 多圖才出縮圖列 -->
          <div v-if="product.images.length > 1" class="mt-2 flex gap-2">
            <button
              v-for="(img, i) in product.images"
              :key="img"
              class="h-16 w-16 overflow-hidden border transition-colors"
              :class="i === activeImageIndex ? 'border-neutral-900' : 'border-neutral-200 hover:border-neutral-400'"
              @click="activeImageIndex = i"
            >
              <img :src="img" :alt="`${product.title} 圖 ${i + 1}`" class="h-full w-full object-cover" />
            </button>
          </div>
        </div>

        <!-- 資訊區 -->
        <div class="flex flex-col gap-4">
          <header class="space-y-2">
            <p class="text-caption uppercase tracking-wider text-neutral-500">{{ product.brand }}</p>
            <h1 class="text-h1 text-neutral-900">{{ product.title }}</h1>
            <p class="text-small text-neutral-600">
              {{ petTypeLabel }}
              <span class="mx-2 text-neutral-300">·</span>
              {{ formLabel }}
              <template v-if="ageLabel">
                <span class="mx-2 text-neutral-300">·</span>
                {{ ageLabel }}
              </template>
            </p>
          </header>

          <ul v-if="product.isPrescription" class="flex flex-wrap gap-x-3 gap-y-1.5">
            <li class="accent-bar-primary text-small font-medium text-neutral-700">處方飼料</li>
          </ul>

          <!-- 價格 / 容量 -->
          <div class="hairline-t hairline-b flex items-baseline justify-between py-4">
            <span class="font-mono text-small tabular-nums text-neutral-500">{{ product.volume ?? '—' }}</span>
            <span class="font-mono text-h1 font-semibold tabular-nums text-accent">
              <span class="mr-1 font-sans text-small font-normal text-neutral-400">NT$</span>{{ product.price ?? '—' }}
            </span>
          </div>
          <p v-if="product.priceUpdatedAt" class="text-caption text-neutral-400">
            價格更新於 <span class="font-mono tabular-nums">{{ product.priceUpdatedAt }}</span>
            <template v-if="product.priceSource"> · 來源 {{ product.priceSource }}</template>
          </p>

          <!-- 保證分析 -->
          <section>
            <h2 class="text-caption font-medium uppercase tracking-widest text-neutral-500">保證分析</h2>
            <!-- 原樣字串為主要顯示(v3 歸因分析) -->
            <p v-if="product.nutritionText" class="mt-2 text-body leading-relaxed text-neutral-800">
              {{ product.nutritionText }}
            </p>
            <p v-else class="mt-2 text-small text-neutral-400">此產品未提供保證分析資料。</p>
            <!-- 結構化輔助列 -->
            <dl v-if="nutritionRows.length" class="mt-3 divide-y divide-neutral-100 border-t border-neutral-100">
              <div
                v-for="row in nutritionRows"
                :key="row.label"
                class="flex items-baseline justify-between py-1.5"
              >
                <dt class="text-small text-neutral-500">{{ row.label }}</dt>
                <dd class="font-mono text-small tabular-nums text-neutral-900">
                  {{ row.value }}<span class="ml-1 text-[10px] text-neutral-400">{{ row.unit }}</span>
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      <!-- 成分:純文字段落原樣顯示,不做 chip 互動(§2.4/§3.0) -->
      <section class="mt-10">
        <h2 class="text-caption font-medium uppercase tracking-widest text-neutral-500">完整成分</h2>
        <p v-if="product.ingredientsText" class="mt-2 max-w-3xl text-body leading-relaxed text-neutral-800">
          {{ product.ingredientsText }}
        </p>
        <p v-else class="mt-2 text-small text-neutral-400">此產品未提供成分資料。</p>
      </section>

      <!-- 餵食指南 / 產地(後端 §11.2 補資料後自動出現) -->
      <section v-if="product.feedingGuide" class="mt-10">
        <h2 class="text-caption font-medium uppercase tracking-widest text-neutral-500">餵食指南</h2>
        <p class="mt-2 max-w-3xl whitespace-pre-line text-body leading-relaxed text-neutral-800">{{ product.feedingGuide }}</p>
      </section>
      <section v-if="product.origin" class="mt-10">
        <h2 class="text-caption font-medium uppercase tracking-widest text-neutral-500">產地</h2>
        <p class="mt-2 text-body text-neutral-800">{{ product.origin }}</p>
      </section>

      <!-- 來源連結 -->
      <footer v-if="product.sourceUrl" class="hairline-t mt-10 pt-4">
        <a
          :href="product.sourceUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-small text-neutral-500 underline decoration-neutral-300 underline-offset-4 hover:text-neutral-900"
        >
          查看原始商品頁 ↗
        </a>
      </footer>
    </article>
  </div>
</template>
