<script setup lang="ts">
defineProps<{ label: string }>()
defineEmits<{ remove: [] }>()
</script>

<template>
  <button
    class="group flex items-center gap-2 border border-neutral-300 px-2 py-1 text-small hover:border-accent"
    @click="$emit('remove')"
  >
    <span>{{ label }}</span>
    <span class="text-neutral-400 group-hover:text-accent">✕</span>
  </button>
</template>
