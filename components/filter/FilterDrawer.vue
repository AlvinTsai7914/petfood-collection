<script setup lang="ts">
// 手機底部抽屜篩選 — 與 Sidebar 共用結構,但有 staging 機制
// 按「套用」才把 staging 寫回 modelValue(spec §4.2 mobile 行為)

import type { FilterOptions } from '~/composables/useApi'
import type { FilterState, MultiFilterKey } from '~/utils/filter-state'

const props = defineProps<{
  open: boolean
  filterOptions: FilterOptions
  modelValue: FilterState
}>()

const emit = defineEmits<{
  'update:open': [v: boolean]
  'update:modelValue': [v: FilterState]
}>()

const staging = ref<FilterState>(cloneFilterState(props.modelValue))

// 開啟時把目前已套用狀態複製進 staging(放棄上次未套用的編輯)
watch(() => props.open, (o) => {
  if (o) staging.value = cloneFilterState(props.modelValue)
})

const updateMulti = (key: MultiFilterKey, v: string[]) => {
  staging.value = { ...staging.value, [key]: v }
}
const updatePrescription = (v: boolean) => {
  staging.value = { ...staging.value, isPrescription: v }
}

const close = () => emit('update:open', false)
const apply = () => {
  emit('update:modelValue', staging.value)
  close()
}
const clearLocal = () => {
  staging.value = emptyFilterState()
}

const stagingCount = computed(() => countSelected(staging.value))

const enumGroups = computed(() => [
  { key: 'petType' as const, title: '類型', options: props.filterOptions.petTypes },
  { key: 'form' as const, title: '食物型態', options: props.filterOptions.forms },
  { key: 'age' as const, title: '適用年齡', options: props.filterOptions.ages },
  { key: 'brand' as const, title: '品牌', options: props.filterOptions.brands },
])

const prescriptionCount = computed(
  () => props.filterOptions.isPrescription[0]?.count,
)
</script>

<template>
  <Teleport to="body">
    <div class="md:hidden">
      <Transition name="fade">
        <div
          v-if="open"
          class="fixed inset-0 z-40 bg-black/40"
          @click="close"
        />
      </Transition>

      <Transition name="slide-up">
        <div
          v-if="open"
          class="fixed inset-x-0 bottom-0 z-50 flex h-[80vh] flex-col bg-white"
          role="dialog"
          aria-modal="true"
        >
          <header class="flex flex-none items-center justify-between border-b border-neutral-100 px-5 py-4">
            <h2 class="text-small font-medium uppercase tracking-widest text-neutral-900">
              篩選
              <span
                v-if="stagingCount > 0"
                class="ml-1 font-mono text-caption tabular-nums text-accent"
              >({{ stagingCount }})</span>
            </h2>
            <button
              class="text-neutral-400 hover:text-neutral-900"
              aria-label="關閉"
              @click="close"
            >✕</button>
          </header>

          <div class="flex-1 divide-y divide-neutral-100 overflow-y-auto">
            <!-- enum 多選 4 組 -->
            <div v-for="g in enumGroups" :key="g.key" class="px-5">
              <FilterGroup
                :title="g.title"
                :options="g.options"
                :model-value="staging[g.key]"
                @update:model-value="updateMulti(g.key, $event)"
              />
            </div>

            <!-- 成分 include / exclude 雙列 -->
            <div class="px-5">
              <FilterIngredientFilter
                :options="filterOptions.ingredients"
                :include="staging.ingredient"
                :exclude="staging.excludeIngredient"
                @update:include="updateMulti('ingredient', $event)"
                @update:exclude="updateMulti('excludeIngredient', $event)"
              />
            </div>

            <!-- 處方飼料 toggle -->
            <div class="px-5">
              <FilterToggle
                :model-value="staging.isPrescription"
                label="處方飼料"
                :count="prescriptionCount"
                @update:model-value="updatePrescription"
              />
            </div>
          </div>

          <footer class="grid flex-none grid-cols-2 gap-3 border-t border-neutral-100 p-4">
            <button
              class="border border-neutral-300 py-3 text-small text-neutral-700 transition-colors hover:border-neutral-500 hover:text-neutral-900"
              @click="clearLocal"
            >
              清除篩選
            </button>
            <button
              class="bg-neutral-900 py-3 text-small font-medium text-white transition-colors hover:bg-neutral-800"
              @click="apply"
            >
              套用<span v-if="stagingCount > 0" class="font-mono tabular-nums"> ({{ stagingCount }})</span>
            </button>
          </footer>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
