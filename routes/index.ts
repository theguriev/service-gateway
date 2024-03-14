export default eventHandler(async (event) => {
  const accessToken = getCookie(event, 'accessToken')
  const { secret } = useRuntimeConfig()
  if (accessToken) {
    try {
      const { userId } = await verify(accessToken, secret)
      const userExist = await ModelUser.findOne({
        _id: userId
      })
      if (userExist === null) {
        throw createError({ message: 'User not exists!', status: 409 })
      }
      return userExist
    } catch (error) {
      return error
    }
  }
  throw createError({ message: 'Access token not found!', status: 404 })
})
