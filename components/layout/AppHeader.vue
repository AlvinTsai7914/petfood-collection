<script setup lang="ts">
defineProps<{
  compact?: boolean
}>()
</script>

<template>
  <header
    class="flex-none border-b border-neutral-100 transition-all duration-200 ease-out"
    :class="compact ? 'py-2' : 'py-5'"
  >
    <div class="flex items-center justify-between px-6">
      <NuxtLink
        to="/"
        class="tracking-tight transition-all duration-200 ease-out hover:text-neutral-700"
        :class="compact ? 'text-small font-medium' : 'text-h3'"
      >
        寵物食品資料庫
      </NuxtLink>
      <nav class="flex gap-6 text-small text-neutral-600">
        <NuxtLink to="/about" class="hover:text-neutral-900">關於我們</NuxtLink>
        <NuxtLink to="/contact" class="hover:text-neutral-900">聯絡方式</NuxtLink>
      </nav>
    </div>
  </header>
</template>
