<template>
  <footer class="border-t border-neutral-100 bg-white px-6 py-8">
    <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div class="space-y-1">
        <p class="font-mono text-caption uppercase tracking-widest text-neutral-400">
          PET FOOD DB
        </p>
        <p class="text-small text-neutral-600">
          © {{ new Date().getFullYear() }} 寵物食品資料庫
        </p>
      </div>
      <nav class="flex flex-wrap gap-6 text-small text-neutral-600">
        <NuxtLink to="/about" class="hover:text-neutral-900">關於我們</NuxtLink>
        <NuxtLink to="/contact" class="hover:text-neutral-900">聯絡方式</NuxtLink>
        <NuxtLink to="/privacy" class="hover:text-neutral-900">隱私政策</NuxtLink>
      </nav>
    </div>
    <p class="mt-6 max-w-3xl text-caption leading-relaxed text-neutral-400">
      本網站產品圖片引用自各品牌官方網站,版權歸原廠商所有。如有侵權疑慮,請聯繫我們,將立即移除。
    </p>
  </footer>
</template>
