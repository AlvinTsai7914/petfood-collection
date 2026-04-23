<script setup lang="ts">
useSeoMeta({
  title: '聯絡方式 | 寵物食品資料庫',
  description: '電子郵件、社群、問題回報管道。',
})
</script>

<template>
  <article class="mx-auto max-w-3xl px-6 py-12 md:py-16">
    <header class="mb-10">
      <p class="font-mono text-caption uppercase tracking-widest text-neutral-400">CONTACT</p>
      <h1 class="mt-2 text-h1 text-neutral-900">聯絡方式</h1>
    </header>

    <div class="space-y-8">
      <section>
        <h2 class="text-h3 text-neutral-900">電子郵件</h2>
        <p class="mt-2">
          <a href="mailto:hello@example.com" class="font-mono text-body text-accent hover:underline">
            hello@example.com
          </a>
        </p>
        <p class="mt-1 text-small text-neutral-400">(實際 email 待補)</p>
      </section>

      <section>
        <h2 class="text-h3 text-neutral-900">社群</h2>
        <p class="mt-2 text-body text-neutral-500">
          (Instagram / Facebook / Line 等連結待補)
        </p>
      </section>

      <section>
        <h2 class="text-h3 text-neutral-900">問題回報</h2>
        <p class="mt-2 text-body text-neutral-700">
          發現資料錯誤、圖片無法顯示、價格不對、或想建議新增品牌,歡迎來信告知。
          我們會盡快處理。
        </p>
      </section>
    </div>
  </article>
</template>
