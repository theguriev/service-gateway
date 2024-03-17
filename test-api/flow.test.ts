describe('Gateway', () => {
  describe('GET /test', () => {
    it('gest 200 on success', async () => {
      await $fetch('/test', {
        baseURL: 'http://localhost:3000',
        ignoreResponseError: true,
        headers: { Accept: 'application/json' },
        onResponse: ({ response }) => {
          expect(response.status).toBe(200)
          expect(response._data).toMatchObject({
            success: true
          })
        }
      })
    })
  })

  describe('GET /test-authorization', () => {
    it('gets 404 on empty access token', async () => {
      await $fetch('/test-authorization', {
        baseURL: 'http://localhost:3000',
        ignoreResponseError: true,
        headers: { Accept: 'application/json' },
        onResponse: ({ response }) => {
          expect(response.status).toBe(404)
          expect(response._data).toMatchObject({
            message: 'Access token not found!'
          })
        }
      })
    })

    it('gets 401 on invalid access token', async () => {
      await $fetch('/test-authorization', {
        baseURL: 'http://localhost:3000',
        ignoreResponseError: true,
        headers: { Accept: 'application/json', Cookie: 'accessToken=blahblah;' },
        onResponse: ({ response }) => {
          expect(response.status).toBe(401)
          expect(response._data).toMatchObject({
            message: 'Invalid access token!'
          })
        }
      })
    })

    it('gets 200 valid response', async () => {
      const secret = String(process.env.NITRO_SECRET)
      const accessToken = issueAccessToken({ id: 123 }, { secret })
      await $fetch('/test-authorization', {
        baseURL: 'http://localhost:3000',
        headers: {
          Accept: 'application/json',
          Cookie: `accessToken=${accessToken};`
        },
        onResponse: ({ response }) => {
          expect(response.status).toBe(200)
          expect(response._data).toMatchObject({
            success: true
          })
        }
      })
    })
  })
})
