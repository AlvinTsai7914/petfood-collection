<script setup lang="ts">
defineProps<{
  error: { statusCode: number; message: string }
}>()

useSeoMeta({
  title: '找不到頁面 | 寵物食品資料庫',
  robots: 'noindex',
})

const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <NuxtLayout>
    <article class="mx-auto max-w-3xl px-6 py-24 text-center">
      <p class="font-mono text-caption uppercase tracking-widest text-neutral-400">
        ERROR {{ error.statusCode }}
      </p>
      <h1 class="mt-4 font-mono text-[6rem] font-semibold leading-none tabular-nums text-accent">
        {{ error.statusCode }}
      </h1>
      <p class="mt-6 text-h3 text-neutral-900">
        {{ error.statusCode === 404 ? '找不到頁面' : '發生錯誤' }}
      </p>
      <p class="mt-2 text-body text-neutral-500">
        {{ error.statusCode === 404 ? '你要找的頁面可能已移除或網址輸入錯誤。' : (error.message || '請稍後再試。') }}
      </p>
      <button
        class="mt-10 bg-neutral-900 px-6 py-3 text-small font-medium text-white transition-colors hover:bg-neutral-800"
        @click="handleError"
      >
        回到首頁
      </button>
    </article>
  </NuxtLayout>
</template>
