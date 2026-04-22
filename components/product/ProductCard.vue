<script setup lang="ts">
interface Nutrition {
  protein: string | null
  fat: string | null
  carbs: string | null
  phosphorus: string | null
  calories: string | null
}

interface Product {
  id: string
  name: string
  brand: string
  type: 'cat' | 'dog'
  typeLabel: string
  form: 'wet' | 'dry'
  formLabel: string
  flavors: string[]
  age: string
  ageLabel: string
  functional: string[]
  special: string[]
  volume: string | null
  price: number | null
  image: string | null
  nutrition: Nutrition
}

const props = defineProps<{ product: Product }>()

const emit = defineEmits<{
  (e: 'tag-click', field: string, value: string, label: string): void
}>()

const splitUnit = (v: string | null | undefined) => {
  if (!v) return { value: '—', unit: '' }
  const m = v.match(/^([\d.]+)\s*(.*)$/)
  return m ? { value: m[1], unit: m[2] } : { value: v, unit: '' }
}

// 依食物型態調整 bar 參考上限:濕食水分高固形物被稀釋故 max 低;乾糧/零食 max 高
const MACRO_MAX_BY_FORM: Record<string, number> = {
  wet: 15,
  dry: 45,
  treat: 60,
}

const macroMax = computed(() => MACRO_MAX_BY_FORM[props.product.form] ?? 15)

const macroRows = computed(() => {
  const n = props.product.nutrition
  const max = macroMax.value
  const num = (s: string) => {
    const m = s.match(/^([\d.]+)/)
    return m ? parseFloat(m[1]) : 0
  }
  const mk = (label: string, raw: string | null, color: string) => {
    if (!raw) return { label, value: '—', bar: 0, color }
    const v = num(raw)
    return { label, value: String(v), bar: Math.min(100, (v / max) * 100), color }
  }
  return [
    mk('蛋白質', n.protein, 'bg-accent-primary'),
    mk('脂肪', n.fat, 'bg-accent-tertiary'),
    mk('碳水', n.carbs, 'bg-accent-secondary'),
  ]
})

const otherRows = computed(() => {
  const n = props.product.nutrition
  return [
    { label: '磷', ...splitUnit(n.phosphorus) },
    { label: '熱量', ...splitUnit(n.calories) },
  ]
})

// 手機版把 5 項營養壓進同一排,純文字
const mobileAllNutrition = computed(() => {
  const n = props.product.nutrition
  return [
    { label: '蛋白質', ...splitUnit(n.protein) },
    { label: '脂肪', ...splitUnit(n.fat) },
    { label: '碳水', ...splitUnit(n.carbs) },
    { label: '磷', ...splitUnit(n.phosphorus) },
    { label: '熱量', ...splitUnit(n.calories) },
  ]
})

const productCode = computed(() =>
  props.product.id.replace(/^prod_/i, 'PROD-').toUpperCase()
)

const imageErrored = ref(false)
const onImageError = () => {
  imageErrored.value = true
}
</script>

<template>
  <article class="group flex flex-col border border-neutral-200 bg-white transition-colors hover:border-neutral-400">
    <div class="aspect-[3/1] overflow-hidden bg-neutral-50">
      <img
        v-if="product.image && !imageErrored"
        :src="product.image"
        :alt="product.name"
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
          <span class="uppercase tracking-wider text-neutral-500">{{ product.brand }}</span>
        </div>
        <h3 class="text-h3 text-neutral-900 line-clamp-2">{{ product.name }}</h3>
      </header>

      <p class="text-small text-neutral-600">
        <button class="hover:text-accent" @click="emit('tag-click', 'type', product.type, product.typeLabel)">
          {{ product.typeLabel }}
        </button>
        <span class="mx-2 text-neutral-300">·</span>
        <button class="hover:text-accent" @click="emit('tag-click', 'form', product.form, product.formLabel)">
          {{ product.formLabel }}
        </button>
        <span class="mx-2 text-neutral-300">·</span>
        <button class="hover:text-accent" @click="emit('tag-click', 'age', product.age, product.ageLabel)">
          {{ product.ageLabel }}
        </button>
        <template v-for="flavor in product.flavors" :key="flavor">
          <span class="mx-2 text-neutral-300">·</span>
          <button class="hover:text-accent" @click="emit('tag-click', 'flavor', flavor, flavor)">
            {{ flavor }}
          </button>
        </template>
      </p>

      <ul
        v-if="product.functional.length || product.special.length"
        class="flex flex-wrap gap-x-3 gap-y-1.5 md:gap-x-4 md:gap-y-2"
      >
        <li
          v-for="f in product.functional"
          :key="'func-' + f"
          class="accent-bar-secondary cursor-pointer text-small text-neutral-700 hover:text-neutral-900"
          @click="emit('tag-click', 'functional', f, f)"
        >
          {{ f }}
        </li>
        <li
          v-for="s in product.special"
          :key="'spec-' + s"
          class="accent-bar-primary cursor-pointer text-small text-neutral-700 hover:text-neutral-900"
          @click="emit('tag-click', 'special', s, s)"
        >
          {{ s }}
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
              {{ row.value }}<span v-if="row.value !== '—'" class="text-neutral-400">%</span>
            </dd>
          </div>
        </dl>
      </div>

      <dl class="hidden space-y-1 md:block md:border-t md:border-neutral-100 md:pt-2">
        <div
          v-for="row in otherRows"
          :key="row.label"
          class="flex items-baseline justify-between"
        >
          <dt class="text-caption text-neutral-500">{{ row.label }}</dt>
          <dd class="font-mono text-small tabular-nums text-neutral-900">
            {{ row.value }}<span v-if="row.unit" class="ml-1 text-[10px] text-neutral-400">{{ row.unit }}</span>
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
