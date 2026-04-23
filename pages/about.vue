<script setup lang="ts">
useSeoMeta({
  title: '關於我們 | 寵物食品資料庫',
  description: '關於寵物食品資料庫的立意、資料來源與免責聲明。',
})
</script>

<template>
  <article class="mx-auto max-w-3xl px-6 py-12 md:py-16">
    <header class="mb-10">
      <p class="font-mono text-caption uppercase tracking-widest text-neutral-400">ABOUT</p>
      <h1 class="mt-2 text-h1 text-neutral-900">關於我們</h1>
    </header>

    <div class="space-y-8">
      <section>
        <h2 class="text-h3 text-neutral-900">網站簡介</h2>
        <p class="mt-2 text-body text-neutral-500">
          (網站目的、立意、想解決什麼問題 — 文案待補)
        </p>
      </section>

      <section>
        <h2 class="text-h3 text-neutral-900">資料來源</h2>
        <p class="mt-2 text-body text-neutral-500">
          (資料來自哪些通路、更新頻率、如何驗證 — 文案待補)
        </p>
      </section>

      <section>
        <h2 class="text-h3 text-neutral-900">免責聲明</h2>
        <p class="mt-2 text-body text-neutral-700">
          本網站產品資訊僅供參考,實際內容、價格、供貨狀況以各品牌官方或販售通路為準。
          產品圖片引用自各品牌官方網站,版權歸原廠商所有。如有侵權疑慮,請透過
          <NuxtLink to="/contact" class="text-accent hover:underline">聯絡方式</NuxtLink>
          告知,將立即移除。
        </p>
      </section>
    </div>
  </article>
</template>
