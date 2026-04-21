<script setup lang="ts">
interface Option {
  value: string
  label: string
  count?: number
}

interface FilterOptions {
  types: Option[]
  forms: Option[]
  ages: Option[]
  brands: Option[]
  flavors: Option[]
  functional: Option[]
  special: Option[]
}

export interface FilterState {
  type: string[]
  form: string[]
  age: string[]
  brand: string[]
  flavor: string[]
  func: string[]
  special: string[]
}

const props = defineProps<{
  filterOptions: FilterOptions
  modelValue: FilterState
}>()

const emit = defineEmits<{ 'update:modelValue': [v: FilterState] }>()

const update = <K extends keyof FilterState>(key: K, v: string[]) => {
  emit('update:modelValue', { ...props.modelValue, [key]: v })
}

const clearAll = () => {
  emit('update:modelValue', {
    type: [], form: [], age: [], brand: [], flavor: [], func: [], special: [],
  })
}

const totalSelected = computed(() =>
  Object.values(props.modelValue).reduce((sum, arr) => sum + arr.length, 0)
)

const groups = computed(() => [
  { key: 'type' as const, title: '類型', options: props.filterOptions.types },
  { key: 'form' as const, title: '食物型態', options: props.filterOptions.forms },
  { key: 'age' as const, title: '適用年齡', options: props.filterOptions.ages },
  { key: 'brand' as const, title: '品牌', options: props.filterOptions.brands },
  { key: 'flavor' as const, title: '口味', options: props.filterOptions.flavors },
  { key: 'func' as const, title: '機能配方', options: props.filterOptions.functional },
  { key: 'special' as const, title: '特殊配方', options: props.filterOptions.special },
])
</script>

<template>
  <aside class="border-r border-neutral-200 bg-white">
    <header class="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
      <h2 class="text-small font-medium uppercase tracking-widest text-neutral-900">篩選</h2>
      <button
        v-if="totalSelected > 0"
        class="text-caption text-neutral-400 underline underline-offset-2 hover:text-neutral-900"
        @click="clearAll"
      >
        清除 ({{ totalSelected }})
      </button>
    </header>

    <div class="divide-y divide-neutral-100">
      <div v-for="g in groups" :key="g.key" class="px-5">
        <FilterGroup
          :title="g.title"
          :options="g.options"
          :model-value="modelValue[g.key]"
          @update:model-value="update(g.key, $event)"
        />
      </div>
    </div>
  </aside>
</template>
