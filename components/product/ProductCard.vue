<script setup lang="ts">
// ProductCard 對齊新前端 Product 模型(alignment doc §4.1 F1-F8)
//
// 主要變化:
// - 結構化 nutrition 數字直接渲染,不再 regex 拆字串
// - 熱量改 caloriesKcalPerKg 拼「N 大卡/kg」
// - 磷有值才渲染整行
// - 移除 flavors / functional / special tag,新增處方飼料 tag
// - ID 顯示 PROD-{n}(整數直拼)

import type { Product } from '~/composables/useApi'

const props = defineProps<{ product: Product }>()

const emit = defineEmits<{
  (e: 'tag-click', field: string, value: string, label: string): void
}>()

// enum → 中文 label(spec 封閉集合,前端可 hardcode;不依賴後端 *Label)
const PET_TYPE_LABELS: Record<Product['petType'], string> = { cat: '貓', dog: '狗' }
const FORM_LABELS: Record<Product['form'], string> = { wet: '濕食', dry: '乾糧' }
const AGE_LABELS: Record<NonNullable<Product['age']>, string> = {
  kitten: '幼貓/幼犬', adult: '成貓/成犬', senior: '老貓/老犬', all: '全齡',
}

const petTypeLabel = computed(() => PET_TYPE_LABELS[props.product.petType])
const formLabel = computed(() => FORM_LABELS[props.product.form])
const ageLabel = computed(() =>
  props.product.age ? AGE_LABELS[props.product.age] : null,
)

// 依食物型態調整 bar 參考上限:濕食水分高固形物被稀釋故 max 低;乾糧 max 高
// alignment §4.1 F2:Phase 1 wet-only 沿用此表;Phase 2 跨乾濕考慮 DMB 換算
const MACRO_MAX_BY_FORM: Record<Product['form'], number> = {
  wet: 15,
  dry: 45,
}

const macroMax = computed(() => MACRO_MAX_BY_FORM[props.product.form] ?? 15)

// macro bar 三條:蛋白(orange)/ 脂肪(violet)/ 碳水(teal)
// value === null → 顯示「—」、bar 寬度 0(對應 alignment §3.3 B8c carbsPct 任一輸入 null 整欄位 null)
const macroRows = computed(() => {
  const n = props.product.nutrition
  const max = macroMax.value
  const mk = (label: string, v: number | null, color: string) => {
    if (v === null) return { label, value: null, bar: 0, color }
    return { label, value: v, bar: Math.min(100, (v / max) * 100), color }
  }
  return [
    mk('蛋白質', n.proteinPct, 'bg-accent-primary'),
    mk('脂肪', n.fatPct, 'bg-accent-tertiary'),
    mk('碳水', n.carbsPct, 'bg-accent-secondary'),
  ]
})

// 額外營養兩列:磷 / 熱量;null 整行不渲染(alignment §4.1 F4)
const otherRows = computed(() => {
  const n = props.product.nutrition
  const rows: { label: string; value: string; unit: string }[] = []
  if (n.phosphorusPct !== null) {
    rows.push({ label: '磷', value: String(n.phosphorusPct), unit: '%' })
  }
  if (n.caloriesKcalPerKg !== null) {
    rows.push({ label: '熱量', value: String(n.caloriesKcalPerKg), unit: '大卡/kg' })
  }
  return rows
})

// Mobile 把 5 項營養壓進同一排;null 顯示「—」
const mobileAllNutrition = computed(() => {
  const n = props.product.nutrition
  const fmt = (v: number | null, unit: string) =>
    v === null ? { value: '—', unit: '' } : { value: String(v), unit }
  return [
    { label: '蛋白質', ...fmt(n.proteinPct, '%') },
    { label: '脂肪', ...fmt(n.fatPct, '%') },
    { label: '碳水', ...fmt(n.carbsPct, '%') },
    { label: '磷', ...fmt(n.phosphorusPct, '%') },
    { label: '熱量', ...fmt(n.caloriesKcalPerKg, '大卡/kg') },
  ]
})

const productCode = computed(() => `PROD-${props.product.id}`)

const previewImage = computed(() => props.product.images[0] ?? null)

const imageErrored = ref(false)
const onImageError = () => {
  imageErrored.value = true
}
</script>

<template>
  <article class="group flex flex-col border border-neutral-200 bg-white transition-colors hover:border-neutral-400">
    <div class="aspect-[3/1] overflow-hidden bg-neutral-50">
      <img
        v-if="previewImage && !imageErrored"
        :src="previewImage"
        :alt="product.title"
        class="h-full w-full object-cover"
        loading="lazy"
        @error="onImageError"
      />
      <div v-else class="flex h-full w-full items-center justify-center">
        <span class="font-mono text-caption tracking-widest text-neutral-400">NO IMAGE</span>
      </div>
    </div>

    <div class="flex flex-1 flex-col gap-2 px-3 py-2.5 md:gap-2.5 md:px-4 md:py-3">
      <header class="space-y-1">
        <div class="flex items-center justify-between text-caption">
          <span class="font-mono tracking-widest text-neutral-400">{{ productCode }}</span>
          <button
            class="uppercase tracking-wider text-neutral-500 hover:text-accent"
            @click="emit('tag-click', 'brand', product.brand, product.brand)"
          >
            {{ product.brand }}
          </button>
        </div>
        <h3 class="text-h3 text-neutral-900 line-clamp-2">{{ product.title }}</h3>
      </header>

      <p class="text-small text-neutral-600">
        <button class="hover:text-accent" @click="emit('tag-click', 'petType', product.petType, petTypeLabel)">
          {{ petTypeLabel }}
        </button>
        <span class="mx-2 text-neutral-300">·</span>
        <button class="hover:text-accent" @click="emit('tag-click', 'form', product.form, formLabel)">
          {{ formLabel }}
        </button>
        <template v-if="product.age && ageLabel">
          <span class="mx-2 text-neutral-300">·</span>
          <button class="hover:text-accent" @click="emit('tag-click', 'age', product.age, ageLabel)">
            {{ ageLabel }}
          </button>
        </template>
      </p>

      <!-- 處方飼料 tag(F8);left bar 用 accent-primary 與其他特殊標記視覺一致 -->
      <ul v-if="product.isPrescription" class="flex flex-wrap gap-x-3 gap-y-1.5">
        <li class="accent-bar-primary text-small font-medium text-neutral-700">
          處方飼料
        </li>
      </ul>

      <hr class="border-neutral-100" />

      <div class="space-y-2">
        <p class="hidden items-baseline justify-between text-caption md:flex">
          <span class="uppercase tracking-widest text-neutral-400">三大營養</span>
          <span class="font-mono tracking-wider text-neutral-300">/ {{ macroMax }}% max</span>
        </p>

        <!-- Mobile:5 項營養壓在同一排(純文字、stacked value/unit) -->
        <dl class="grid grid-cols-5 gap-2 md:hidden">
          <div
            v-for="row in mobileAllNutrition"
            :key="row.label"
            class="min-w-0"
          >
            <dt class="text-caption text-neutral-500">{{ row.label }}</dt>
            <dd class="flex flex-col leading-tight">
              <span class="font-mono text-small tabular-nums text-neutral-900">{{ row.value }}</span>
              <span class="break-words text-[10px] text-neutral-400">{{ row.unit }}</span>
            </dd>
          </div>
        </dl>

        <!-- Desktop:垂直堆疊(label / bar / value) -->
        <dl class="hidden space-y-1.5 md:block">
          <div
            v-for="row in macroRows"
            :key="row.label"
            class="grid grid-cols-[3rem_1fr_2.5rem] items-center gap-2"
          >
            <dt class="text-caption text-neutral-500">{{ row.label }}</dt>
            <div class="h-1 bg-neutral-100">
              <div class="h-full" :class="row.color" :style="{ width: row.bar + '%' }" />
            </div>
            <dd class="text-right font-mono text-small tabular-nums text-neutral-900">
              <template v-if="row.value !== null">
                {{ row.value }}<span class="text-neutral-400">%</span>
              </template>
              <template v-else>—</template>
            </dd>
          </div>
        </dl>
      </div>

      <!-- 磷 / 熱量:有值才渲染整行;沒任何一行就整個 dl 不出現 -->
      <dl
        v-if="otherRows.length"
        class="hidden space-y-1 md:block md:border-t md:border-neutral-100 md:pt-2"
      >
        <div
          v-for="row in otherRows"
          :key="row.label"
          class="flex items-baseline justify-between"
        >
          <dt class="text-caption text-neutral-500">{{ row.label }}</dt>
          <dd class="font-mono text-small tabular-nums text-neutral-900">
            {{ row.value }}<span class="ml-1 text-[10px] text-neutral-400">{{ row.unit }}</span>
          </dd>
        </div>
      </dl>

      <footer class="mt-auto flex items-baseline justify-between border-t border-neutral-100 pt-2 md:pt-2.5">
        <span class="font-mono text-small tabular-nums text-neutral-400">{{ product.volume ?? '—' }}</span>
        <span class="font-mono text-h2 font-semibold tabular-nums text-accent">
          <span class="mr-1 font-sans text-small font-normal text-neutral-400">NT$</span>{{ product.price ?? '—' }}
        </span>
      </footer>
    </div>
  </article>
</template>
