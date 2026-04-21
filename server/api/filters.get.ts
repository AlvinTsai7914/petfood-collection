export default defineEventHandler((event) => {
  setResponseHeader(event, 'cache-control', 'public, max-age=3600')
  return {
    success: true as const,
    data: getFilterOptions(),
  }
})
