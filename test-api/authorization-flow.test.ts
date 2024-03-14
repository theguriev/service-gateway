import type { Cookie } from 'set-cookie-parser'

describe('Authorization', () => {
  const uniqId = uuidv4().split('-')[0]
  const name = `test${uniqId}`
  const newName = `newtest${uniqId}`
  const email = `test+${uniqId}@test.com`
  const password = 'test1234'
  let validRefreshToken: Cookie
  let validAccessToken: Cookie

  describe('POST /registration', () => {
    it('gets 400 on validation errors', async () => {
      await $fetch('/registration', {
        baseURL: 'http://localhost:3000',
        method: 'POST',
        ignoreResponseError: true,
        headers: { Accept: 'application/json' },
        body: { name: '1', email: '1', password: '1', confirmation: '2' },
        onResponse: ({ response }) => {
          expect(response.status).toBe(400)
          expect(response._data).toMatchObject({
            url: '/registration',
            statusCode: 400,
            statusMessage: 'Validation Error',
            message: 'Validation Error',
            data: [
              {
                code: 'too_small',
                minimum: 3,
                type: 'string',
                inclusive: true,
                exact: false,
                message: 'String must contain at least 3 character(s)',
                path: ['name']
              },
              {
                validation: 'email',
                code: 'invalid_string',
                message: 'Invalid email',
                path: ['email']
              },
              {
                code: 'too_small',
                minimum: 8,
                type: 'string',
                inclusive: true,
                exact: false,
                message: 'String must contain at least 8 character(s)',
                path: ['password']
              },
              {
                code: 'too_small',
                minimum: 8,
                type: 'string',
                inclusive: true,
                exact: false,
                message: 'String must contain at least 8 character(s)',
                path: ['confirmation']
              },
              {
                code: 'custom',
                message: 'Passwords do not match!',
                path: ['confirmation']
              }
            ]
          })
        }
      })
    })
    it('gets 400 on invalid credentials', async () => {
      await $fetch('/registration', {
        baseURL: 'http://localhost:3000',
        method: 'POST',
        headers: { Accept: 'application/json' },
        ignoreResponseError: true,
        body: { name, email, password, confirmation: 'bullshit' },
        onResponse: ({ response }) => {
          expect(response.status).toBe(400)
          expect(response._data).toMatchObject({
            url: '/registration',
            statusCode: 400,
            statusMessage: 'Validation Error',
            message: 'Validation Error',
            data: [
              {
                code: 'custom',
                message: 'Passwords do not match!',
                path: ['confirmation']
              }
            ]
          })
        }
      })
    })
    it('gets 200 on valid credentials', async () => {
      await $fetch('/registration', {
        baseURL: 'http://localhost:3000',
        method: 'POST',
        ignoreResponseError: true,
        headers: { Accept: 'application/json' },
        body: { name, email, password, confirmation: password },
        onResponse: ({ response }) => {
          expect(response.status).toBe(200)
          expect(response._data._id).toBeDefined()
          const setCookie = extractSetCookie(response.headers)
          const refreshTokenObj = setCookie.find(cookie => cookie.name === 'refreshToken')
          const accessTokenObj = setCookie.find(cookie => cookie.name === 'accessToken')
          expect(refreshTokenObj).toBeDefined()
          expect(accessTokenObj).toBeDefined()
        }
      })
    })
    it('gets 409 on email already exist', async () => {
      await $fetch('/registration', {
        baseURL: 'http://localhost:3000',
        method: 'POST',
        headers: { Accept: 'application/json' },
        ignoreResponseError: true,
        body: { name: 'randomname', email, password, confirmation: password },
        onResponse: ({ response }) => {
          expect(response.status).toBe(409)
          expect(response._data).toMatchObject({ message: 'User already exists!' })
        }
      })
    })

    it('gets 409 on name already exist', async () => {
      await $fetch('/registration', {
        baseURL: 'http://localhost:3000',
        method: 'POST',
        headers: { Accept: 'application/json' },
        ignoreResponseError: true,
        body: { name, email: 'random@email.com', password, confirmation: password },
        onResponse: ({ response }) => {
          expect(response.status).toBe(409)
          expect(response._data).toMatchObject({ message: 'User already exists!' })
        }
      })
    })
  })

  describe('POST /login', () => {
    it('gets 400 on validation errors', async () => {
      await $fetch('/login', {
        baseURL: 'http://localhost:3000',
        method: 'POST',
        headers: { Accept: 'application/json' },
        ignoreResponseError: true,
        body: { email: '1', password: '2' },
        onResponse: ({ response }) => {
          expect(response.status).toBe(400)
          expect(response._data).toMatchObject({
            url: '/login',
            statusCode: 400,
            statusMessage: 'Validation Error',
            message: 'Validation Error',
            data: [
              {
                code: 'invalid_string',
                message: 'Invalid email',
                path: ['email'],
                validation: 'email'
              },
              {
                code: 'too_small',
                exact: false,
                inclusive: true,
                message: 'String must contain at least 8 character(s)',
                minimum: 8,
                path: ['password'],
                type: 'string'
              }
            ]
          })
        }
      })
    })

    it('gets 403 on invalid credentials', async () => {
      await $fetch('/login', {
        baseURL: 'http://localhost:3000',
        method: 'POST',
        headers: { Accept: 'application/json' },
        ignoreResponseError: true,
        body: { email: 'wrong@email.com', password: 'test1234' },
        onResponse: ({ response }) => {
          expect(response.status).toBe(403)
          expect(response._data).toMatchObject({ message: 'Wront password or email!' })
        }
      })
    })

    it('gets 200 on valid credentials', async () => {
      await $fetch('/login', {
        baseURL: 'http://localhost:3000',
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: { email, password },
        onResponse: ({ response }) => {
          expect(response.status).toBe(200)
          const setCookie = extractSetCookie(response.headers)
          const refreshTokenObj = setCookie.find(cookie => cookie.name === 'refreshToken')
          const accessTokenObj = setCookie.find(cookie => cookie.name === 'accessToken')
          validRefreshToken = refreshTokenObj!
          validAccessToken = accessTokenObj!
          expect(refreshTokenObj).toBeDefined()
          expect(accessTokenObj).toBeDefined()
        }
      })
    })
  })

  describe('GET /', () => {
    it('gets 404 on empty access token', async () => {
      await $fetch('/', {
        baseURL: 'http://localhost:3000',
        headers: {
          Accept: 'application/json'
        },
        ignoreResponseError: true,
        onResponse: ({ response }) => {
          expect(response.status).toBe(404)
          expect(response._data).toMatchObject({ message: 'Access token not found!' })
        }
      })
    })

    it('gets 500 on empty access token', async () => {
      await $fetch('/', {
        baseURL: 'http://localhost:3000',
        headers: {
          Accept: 'application/json',
          Cookie: 'accessToken=invalid;'
        },
        ignoreResponseError: true,
        onResponse: ({ response }) => {
          expect(response.status).toBe(500)
          expect(response._data.message).toBe('jwt malformed')
        }
      })
    })

    it('gets valid user', async () => {
      await $fetch('/', {
        baseURL: 'http://localhost:3000',
        headers: {
          Accept: 'application/json',
          Cookie: `accessToken=${validAccessToken.value};`
        },
        onResponse: ({ response }) => {
          expect(response.status).toBe(200)
          expect(response._data.email).toBe(email)
        }
      })
    })
  })

  describe('GET /refresh', () => {
    it('gets 404 on invalid refresh token', async () => {
      await $fetch('/refresh', {
        baseURL: 'http://localhost:3000',
        headers: { Accept: 'application/json' },
        ignoreResponseError: true,
        onResponse: ({ response }) => {
          expect(response.status).toBe(404)
          expect(response._data).toMatchObject({ message: 'Refresh token not found!' })
        }
      })
    })
    it('gets 200 on valid refresh token2', async () => {
      await $fetch('/refresh', {
        baseURL: 'http://localhost:3000',
        headers: {
          Accept: 'application/json',
          Cookie: `refreshToken=${validRefreshToken.value}`
        },
        onResponse: ({ response }) => {
          expect(response.status).toBe(200)
          const setCookie = extractSetCookie(response.headers)
          const refreshTokenObj = setCookie.find(cookie => cookie.name === 'refreshToken')
          const accessTokenObj = setCookie.find(cookie => cookie.name === 'accessToken')
          expect(refreshTokenObj).toBeDefined()
          expect(accessTokenObj).toBeDefined()
        }
      })
    })
  })

  describe('POST /forgot-password', () => {
    it('gets 400 on validation errors', async () => {
      await $fetch('/forgot-password', {
        baseURL: 'http://localhost:3000',
        method: 'POST',
        headers: { Accept: 'application/json' },
        ignoreResponseError: true,
        body: { email: '1' },
        onResponse: ({ response }) => {
          expect(response.status).toBe(400)
          expect(response._data).toMatchObject({
            url: '/forgot-password',
            statusCode: 400,
            statusMessage: 'Validation Error',
            message: 'Validation Error',
            data: [
              {
                code: 'invalid_string',
                message: 'Invalid email',
                path: ['email'],
                validation: 'email'
              }
            ]
          })
        }
      })
    })
    it('gets 404 on invalid email', async () => {
      await $fetch('/forgot-password', {
        baseURL: 'http://localhost:3000',
        method: 'POST',
        headers: { Accept: 'application/json' },
        ignoreResponseError: true,
        body: { email: 'invalid@email.com' },
        onResponse: ({ response }) => {
          expect(response.status).toBe(404)
          expect(response._data).toMatchObject({ message: 'User not found!' })
        }
      })
    })
    it('gets 200 on valid email', async () => {
      await $fetch('/forgot-password', {
        baseURL: 'http://localhost:3000',
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: { email },
        onResponse: ({ response }) => {
          expect(response.status).toBe(200)
          expect(response._data).toMatchObject({ ok: true })
        }
      })
    })
  })

  describe('GET /logout', () => {
    it('gets 200 on valid logout', async () => {
      await $fetch('/logout', {
        baseURL: 'http://localhost:3000',
        headers: {
          Accept: 'application/json',
          Cookie: `accessToken=${validAccessToken.value}`
        },
        onResponse: ({ response }) => {
          expect(response.status).toBe(200)
          expect(response.headers.getSetCookie()).toMatchObject([
            'accessToken=; Max-Age=0; Path=/',
            'refreshToken=; Max-Age=0; Path=/'
          ])
        }
      })
    })
    it('gets 404 on invalid logout', async () => {
      await $fetch('/logout', {
        baseURL: 'http://localhost:3000',
        headers: {
          Accept: 'application/json'
        },
        ignoreResponseError: true,
        onResponse: ({ response }) => {
          expect(response.status).toBe(404)
          expect(response._data).toMatchObject({ message: 'Access token not found!' })
        }
      })
    })
    it('gets 500 on invalid logout', () => {
      expect(async () => await $fetch('/logout', {
        baseURL: 'http://localhost:3000',
        headers: {
          Accept: 'application/json',
          Cookie: 'accessToken=bullshit'
        }
      })).rejects.toThrow(/500 Internal Server Error/)
    })
  })

  describe('PUT /change-name', () => {
    it('changes the user name', async () => {
      const newName = 'NewName'
      await $fetch('/change-name', {
        baseURL: 'http://localhost:3000',
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          Cookie: `accessToken=${validAccessToken.value}`
        },
        body: { name: newName },
        onResponse: ({ response }) => {
          expect(response.status).toBe(200)
          expect(response._data.name).toBe(newName)
        }
      })
    })

    it('returns 404 when access token is not provided', async () => {
      await $fetch('/change-name', {
        baseURL: 'http://localhost:3000',
        method: 'PUT',
        headers: { Accept: 'application/json' },
        ignoreResponseError: true,
        body: { name: 'NewName' },
        onResponse: ({ response }) => {
          expect(response.status).toBe(404)
          expect(response._data).toMatchObject({ message: 'Access token not found!' })
        }
      })
    })
  })
})
