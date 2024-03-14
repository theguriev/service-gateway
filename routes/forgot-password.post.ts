const requestBodySchema = z.object({
  email: z.string().email()
})

export default eventHandler(async (event) => {
  const { email } = await zodValidateBody(event, requestBodySchema.parse)
  const user = await ModelUser.findOneAndUpdate(
    { email },
    {
      $set: {
        forgotPassword: { token: issueRefreshToken(), timestamp: Date.now() }
      }
    }
  )
  if (user === null) {
    throw createError({ status: 404, message: 'User not found!' })
  }
  return { ok: true }
})
