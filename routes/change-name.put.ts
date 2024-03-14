const requestBodySchema = z.object({
  name: z.string().min(3).max(20)
})

export default eventHandler(async (event) => {
  const accessToken = getCookie(event, 'accessToken')
  const { secret } = useRuntimeConfig()
  const {
    name
  } = await zodValidateBody(event, requestBodySchema.parse)
  if (accessToken) {
    try {
      const { userId } = await verify(accessToken, secret)
      await ModelUser.updateOne(
        {
          _id: userId
        },
        {
          $set: {
            name
          }
        }
      )
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
