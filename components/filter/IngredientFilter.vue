<script setup lang="ts">
// 包含 / 排除成分雙列(對應 alignment doc §4.1 F11)
//
// UI 設計:select dropdown 加入 + chip 列展示已選;包含用 accent-primary 左 bar,
// 排除用 danger 左 bar + 刪除線文字,語意對比清楚。dropdown 已選項目自動隱藏。

import type { FilterOption } from '~/composables/useApi'

const props = defineProps<{
  options: FilterOption[]
  include: string[]
  exclude: string[]
}>()

const emit = defineEmits<{
  'update:include': [v: string[]]
  'update:exclude': [v: string[]]
}>()

// dropdown 候選清單:扣除已選的(include / exclude 任一已選都不再列出)
const availableOptions = computed(() => {
  const used = new Set([...props.include, ...props.exclude])
  return props.options.filter(o => !used.has(o.value))
})

const labelOf = (v: string) =>
  props.options.find(o => o.value === v)?.label ?? v

const onAdd = (target: 'include' | 'exclude', e: Event) => {
  const select = e.target as HTMLSelectElement
  const v = select.value
  if (!v) return
  // 立即重置 select 回 placeholder,讓使用者可連續加入
  select.value = ''
  if (target === 'include') {
    if (!props.include.includes(v)) emit('update:include', [...props.include, v])
  } else {
    if (!props.exclude.includes(v)) emit('update:exclude', [...props.exclude, v])
  }
}

const remove = (target: 'include' | 'exclude', v: string) => {
  if (target === 'include') {
    emit('update:include', props.include.filter(x => x !== v))
  } else {
    emit('update:exclude', props.exclude.filter(x => x !== v))
  }
}

const totalSelected = computed(() => props.include.length + props.exclude.length)
</script>

<template>
  <section class="py-4">
    <header class="mb-3 flex items-baseline justify-between">
      <h3 class="text-caption font-medium uppercase tracking-widest text-neutral-500">
        成分
      </h3>
      <span
        v-if="totalSelected > 0"
        class="font-mono text-caption tabular-nums text-accent"
      >
        {{ totalSelected }}
      </span>
    </header>

    <!-- 包含成分(OR) -->
    <div class="mb-4">
      <label class="mb-1.5 flex items-center justify-between text-caption">
        <span class="text-neutral-500">包含</span>
        <span
          v-if="include.length"
          class="font-mono tabular-nums text-accent-primary"
        >+{{ include.length }}</span>
      </label>
      <select
        class="w-full border border-neutral-300 bg-white px-2 py-1.5 text-small text-neutral-700 focus:border-neutral-900 focus:outline-none"
        @change="onAdd('include', $event)"
      >
        <option value="">+ 加入包含成分…</option>
        <option v-for="o in availableOptions" :key="o.value" :value="o.value">
          {{ o.label }} ({{ o.count }})
        </option>
      </select>
      <ul v-if="include.length" class="mt-2 flex flex-wrap gap-1.5">
        <li v-for="v in include" :key="v">
          <button
            type="button"
            class="group flex items-center gap-1.5 border border-neutral-300 accent-bar-primary px-2 py-0.5 text-caption hover:border-neutral-500"
            @click="remove('include', v)"
          >
            <span>{{ labelOf(v) }}</span>
            <span class="text-neutral-400 group-hover:text-neutral-900">✕</span>
          </button>
        </li>
      </ul>
    </div>

    <!-- 排除成分(AND NOT) -->
    <div>
      <label class="mb-1.5 flex items-center justify-between text-caption">
        <span class="text-neutral-500">排除</span>
        <span
          v-if="exclude.length"
          class="font-mono tabular-nums text-danger"
        >−{{ exclude.length }}</span>
      </label>
      <select
        class="w-full border border-neutral-300 bg-white px-2 py-1.5 text-small text-neutral-700 focus:border-neutral-900 focus:outline-none"
        @change="onAdd('exclude', $event)"
      >
        <option value="">− 加入排除成分…</option>
        <option v-for="o in availableOptions" :key="o.value" :value="o.value">
          {{ o.label }} ({{ o.count }})
        </option>
      </select>
      <ul v-if="exclude.length" class="mt-2 flex flex-wrap gap-1.5">
        <li v-for="v in exclude" :key="v">
          <button
            type="button"
            class="group flex items-center gap-1.5 border border-neutral-300 accent-bar-danger px-2 py-0.5 text-caption text-neutral-500 line-through decoration-neutral-400 hover:border-neutral-500"
            @click="remove('exclude', v)"
          >
            <span>{{ labelOf(v) }}</span>
            <span class="text-neutral-400 no-underline group-hover:text-neutral-900">✕</span>
          </button>
        </li>
      </ul>
    </div>
  </section>
</template>
