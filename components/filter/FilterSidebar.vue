<script setup lang="ts">
// 桌機側欄篩選 — 5 + 1 組(alignment doc §2.3)
// 4 個 enum 多選(petType / form / age / brand)+ 1 個成分 include/exclude + 1 個 toggle

import type { FilterOptions } from '~/composables/useApi'
import type { FilterState, MultiFilterKey } from '~/utils/filter-state'

const props = defineProps<{
  filterOptions: FilterOptions
  modelValue: FilterState
}>()

const emit = defineEmits<{ 'update:modelValue': [v: FilterState] }>()

const updateMulti = (key: MultiFilterKey, v: string[]) => {
  emit('update:modelValue', { ...props.modelValue, [key]: v })
}
const updatePrescription = (v: boolean) => {
  emit('update:modelValue', { ...props.modelValue, isPrescription: v })
}

const clearAll = () => emit('update:modelValue', emptyFilterState())

const totalSelected = computed(() => countSelected(props.modelValue))

// 4 個 enum 多選 group(成分 / toggle 自有元件,不在這裡)
const enumGroups = computed(() => [
  { key: 'petType' as const, title: '類型', options: props.filterOptions.petTypes },
  { key: 'form' as const, title: '食物型態', options: props.filterOptions.forms },
  { key: 'age' as const, title: '適用年齡', options: props.filterOptions.ages },
  { key: 'brand' as const, title: '品牌', options: props.filterOptions.brands },
])

// 處方飼料 toggle 的 count 顯示用後端回的 'true' 那筆
const prescriptionCount = computed(
  () => props.filterOptions.isPrescription[0]?.count,
)
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
      <!-- enum 多選 4 組 -->
      <div v-for="g in enumGroups" :key="g.key" class="px-5">
        <FilterGroup
          :title="g.title"
          :options="g.options"
          :model-value="modelValue[g.key]"
          @update:model-value="updateMulti(g.key, $event)"
        />
      </div>

      <!-- 成分 include / exclude 雙列 -->
      <div class="px-5">
        <FilterIngredientFilter
          :options="filterOptions.ingredients"
          :include="modelValue.ingredient"
          :exclude="modelValue.excludeIngredient"
          @update:include="updateMulti('ingredient', $event)"
          @update:exclude="updateMulti('excludeIngredient', $event)"
        />
      </div>

      <!-- 處方飼料 toggle -->
      <div class="px-5">
        <FilterToggle
          :model-value="modelValue.isPrescription"
          label="處方飼料"
          :count="prescriptionCount"
          @update:model-value="updatePrescription"
        />
      </div>
    </div>
  </aside>
</template>
