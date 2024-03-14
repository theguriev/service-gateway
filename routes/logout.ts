export default eventHandler(async (event) => {
  const accessToken = getCookie(event, 'accessToken')
  const { secret } = useRuntimeConfig()
  if (accessToken) {
    try {
      const { userId } = await verify(accessToken, secret)
      const refreshTokenDocument = new ModelToken()
      deleteCookie(event, 'accessToken')
      deleteCookie(event, 'refreshToken')
      return await refreshTokenDocument.collection.deleteMany({ userId })
    } catch (error) {
      return error
    }
  }
  throw createError({ message: 'Access token not found!', status: 404 })
})
