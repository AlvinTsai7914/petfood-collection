const LIVE_BASE = 'https://feedradar-production.up.railway.app/api'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'public, max-age=3600')
  // NUXT_LIVE_API=1 時改為代理 live 後端，方便用真實資料檢視畫面
  // String():Nuxt 會把環境變數 "1" 轉成數字 1,嚴格比較字串會失敗
  if (String(useRuntimeConfig(event).liveApi) === '1') {
    // live /api/filters 目前會 500(2026-08-04 實測),失敗時回業務錯誤讓前端降級為空選項
    try {
      return await $fetch(`${LIVE_BASE}/filters`)
    } catch {
      return {
        success: false as const,
        error: { code: 'UPSTREAM_ERROR', message: 'live /api/filters unavailable' },
      }
    }
  }
  return {
    success: true as const,
    data: getFilterOptions(),
  }
})
