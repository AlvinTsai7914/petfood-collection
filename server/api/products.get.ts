const LIVE_BASE = 'https://feedradar-production.up.railway.app/api'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  setResponseHeader(event, 'cache-control', 'public, max-age=300')
  // NUXT_LIVE_API=1 時改為代理 live 後端，方便用真實資料檢視畫面
  // String():Nuxt 會把環境變數 "1" 轉成數字 1,嚴格比較字串會失敗
  if (String(useRuntimeConfig(event).liveApi) === '1') {
    return await $fetch(`${LIVE_BASE}/products`, { query })
  }
  return {
    success: true as const,
    data: queryProducts(query),
  }
})
