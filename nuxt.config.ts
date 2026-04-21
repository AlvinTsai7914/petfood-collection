export default defineNuxtConfig({
  compatibilityDate: '2026-04-01',
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  ui: {
    global: true,
  },
  colorMode: {
    preference: 'light',
    fallback: 'light',
  },
  devtools: { enabled: true },
  app: {
    head: {
      title: '寵物食品產品資料庫',
      htmlAttrs: { lang: 'zh-Hant' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
})
