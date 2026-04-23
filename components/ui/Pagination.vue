<script setup lang="ts">
type PageItem = number | 'ellipsis'

const props = defineProps<{
  page: number
  totalPages: number
}>()

defineEmits<{
  (e: 'change', page: number): void
}>()

// 永遠顯示首頁、末頁、當前頁 ±1,中間用 … 填(以當前頁為中心)
const items = computed<PageItem[]>(() => {
  const total = props.totalPages
  const current = props.page
  if (total <= 1) return []
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 3) return [1, 2, 3, 4, 'ellipsis', total]
  if (current >= total - 2) return [1, 'ellipsis', total - 3, total - 2, total - 1, total]
  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total]
})
</script>

<template>
  <nav
    v-if="totalPages > 1"
    class="flex items-center justify-center gap-1 py-4"
    aria-label="分頁"
  >
    <button
      class="flex h-8 w-8 items-center justify-center text-neutral-700 transition-colors hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-neutral-700"
      :disabled="page === 1"
      aria-label="上一頁"
      @click="$emit('change', page - 1)"
    >
      <svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" />
      </svg>
    </button>

    <template v-for="(item, i) in items" :key="i">
      <span
        v-if="item === 'ellipsis'"
        class="flex h-8 w-8 items-center justify-center font-mono text-small text-neutral-400"
        aria-hidden="true"
      >…</span>
      <button
        v-else
        class="flex h-8 min-w-[2rem] items-center justify-center border-b-2 px-2 font-mono text-small tabular-nums transition-colors"
        :class="item === page
          ? 'border-accent-primary text-neutral-900'
          : 'border-transparent text-neutral-600 hover:border-neutral-300 hover:text-neutral-900'"
        :aria-current="item === page ? 'page' : undefined"
        @click="$emit('change', item)"
      >
        {{ item }}
      </button>
    </template>

    <button
      class="flex h-8 w-8 items-center justify-center text-neutral-700 transition-colors hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-neutral-700"
      :disabled="page === totalPages"
      aria-label="下一頁"
      @click="$emit('change', page + 1)"
    >
      <svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" />
      </svg>
    </button>
  </nav>
</template>
