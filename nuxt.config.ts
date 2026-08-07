export default defineNuxtConfig({
  compatibilityDate: '2026-04-01',
  runtimeConfig: {
    // NUXT_LIVE_API=1 時 server route 代理 live 後端(見 server/api/*.get.ts)
    liveApi: '',
  },
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  ui: {
    global: true,
  },
  colorMode: {
    preference: 'light',
    fallback: 'light',
  },
  devtools: { enabled: false },
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
