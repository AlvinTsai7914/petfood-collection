<script setup lang="ts">
defineEmits<{ clear: [] }>()
</script>

<template>
  <div class="flex flex-col items-center gap-3 border border-neutral-200 bg-white px-6 py-16 text-center">
    <p class="font-mono text-caption tracking-widest text-neutral-400">NO RESULTS</p>
    <p class="text-h3 text-neutral-900">找不到符合條件的產品</p>
    <p class="text-small text-neutral-500">試試調整或清除篩選條件</p>
    <button
      class="mt-2 bg-neutral-900 px-4 py-2 text-small font-medium text-white transition-colors hover:bg-neutral-800"
      @click="$emit('clear')"
    >
      清除全部篩選
    </button>
  </div>
</template>
