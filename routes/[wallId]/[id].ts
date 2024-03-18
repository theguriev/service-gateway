export default eventHandler((event) => {
  const params = getRouterParams(event)
  return {
    success: true,
    params
  }
})
