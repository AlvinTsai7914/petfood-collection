<script setup lang="ts">
defineProps<{ message?: string }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="flex flex-col items-center gap-3 border border-neutral-200 bg-white px-6 py-16 text-center">
    <p class="font-mono text-caption tracking-widest text-[color:var(--color-danger)]">ERROR</p>
    <p class="text-h3 text-neutral-900">載入失敗</p>
    <p class="text-small text-neutral-500">{{ message || '請稍後再試' }}</p>
    <button
      class="mt-2 bg-neutral-900 px-4 py-2 text-small font-medium text-white transition-colors hover:bg-neutral-800"
      @click="$emit('retry')"
    >
      重試
    </button>
  </div>
</template>
