export default defineEventHandler((event) => {
  const query = getQuery(event)
  setResponseHeader(event, 'cache-control', 'public, max-age=300')
  return {
    success: true as const,
    data: queryProducts(query),
  }
})
