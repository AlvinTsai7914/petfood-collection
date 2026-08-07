const LIVE_BASE = 'https://feedradar-production.up.railway.app/api'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  setResponseHeader(event, 'cache-control', 'public, max-age=300')
  // NUXT_LIVE_API=1 時改為代理 live 後端，方便用真實資料檢視畫面
  if (useRuntimeConfig(event).liveApi === '1') {
    return await $fetch(`${LIVE_BASE}/products/${idParam}`)
  }
  const id = Number(idParam)
  const product = Number.isInteger(id) ? findProduct(id) : null
  if (!product) {
    return {
      success: false as const,
      error: { code: 'NOT_FOUND', message: `product ${idParam} not found` },
    }
  }
  return {
    success: true as const,
    data: product,
  }
})
