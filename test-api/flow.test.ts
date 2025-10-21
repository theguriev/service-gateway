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

  describe('Rate Limiting', () => {
    describe('GET /test-rate-limit', () => {
      it('allows requests within limit', async () => {
        const uniqueIP = '192.168.1.210'
        // Делаем 3 запроса (лимит = 3 запроса за 10 секунд)
        for (let i = 0; i < 3; i++) {
          await $fetch('/test-rate-limit', {
            baseURL: 'http://localhost:3000',
            ignoreResponseError: true,
            headers: {
              Accept: 'application/json',
              'X-Forwarded-For': uniqueIP
            },
            onResponse: ({ response }) => {
              expect(response.status).toBe(200)
              expect(response._data).toMatchObject({
                success: true
              })
            }
          })
        }
      })

      it('blocks requests after exceeding limit', async () => {
        const uniqueIP = '192.168.1.220'
        // Делаем 3 разрешенных запроса
        for (let i = 0; i < 3; i++) {
          await $fetch('/test-rate-limit', {
            baseURL: 'http://localhost:3000',
            ignoreResponseError: true,
            headers: {
              Accept: 'application/json',
              'X-Forwarded-For': uniqueIP
            }
          })
        }

        // 4-й запрос должен быть заблокирован
        await $fetch('/test-rate-limit', {
          baseURL: 'http://localhost:3000',
          ignoreResponseError: true,
          headers: {
            Accept: 'application/json',
            'X-Forwarded-For': uniqueIP
          },
          onResponse: ({ response }) => {
            expect(response.status).toBe(429)
            expect(response._data).toMatchObject({
              message: 'Rate limit exceeded'
            })
          }
        })
      })

      it('resets limit after window expires', async () => {
        // Используем уникальный IP для этого теста
        const uniqueIP = '192.168.1.200'
        
        // Первый запрос должен пройти
        await $fetch('/test-rate-limit-strict', {
          baseURL: 'http://localhost:3000',
          ignoreResponseError: true,
          headers: {
            Accept: 'application/json',
            'X-Forwarded-For': uniqueIP
          },
          onResponse: ({ response }) => {
            expect(response.status).toBe(200)
          }
        })

        // Второй запрос сразу должен быть заблокирован
        await $fetch('/test-rate-limit-strict', {
          baseURL: 'http://localhost:3000',
          ignoreResponseError: true,
          headers: {
            Accept: 'application/json',
            'X-Forwarded-For': uniqueIP
          },
          onResponse: ({ response }) => {
            expect(response.status).toBe(429)
          }
        })

        // Ждем 6 секунд (больше чем window = 5 секунд)
        await new Promise(resolve => setTimeout(resolve, 6000))

        // Теперь запрос должен пройти
        await $fetch('/test-rate-limit-strict', {
          baseURL: 'http://localhost:3000',
          ignoreResponseError: true,
          headers: {
            Accept: 'application/json',
            'X-Forwarded-For': uniqueIP
          },
          onResponse: ({ response }) => {
            expect(response.status).toBe(200)
            expect(response._data).toMatchObject({
              success: true
            })
          }
        })
      }, 10000) // увеличиваем timeout теста до 10 секунд

      it('tracks different IPs separately', async () => {
        // Этот тест сложнее реализовать в текущей среде,
        // так как все запросы идут с одного IP.
        // В реальной среде можно было бы использовать разные прокси
        // или симулировать разные IP через заголовки X-Forwarded-For

        // Для демонстрации покажем, что заголовок X-Forwarded-For учитывается
        await $fetch('/test-rate-limit-strict', {
          baseURL: 'http://localhost:3000',
          ignoreResponseError: true,
          headers: {
            Accept: 'application/json',
            'X-Forwarded-For': '192.168.1.100'
          },
          onResponse: ({ response }) => {
            expect(response.status).toBe(200)
          }
        })

        // Второй запрос с тем же IP должен быть заблокирован
        await $fetch('/test-rate-limit-strict', {
          baseURL: 'http://localhost:3000',
          ignoreResponseError: true,
          headers: {
            Accept: 'application/json',
            'X-Forwarded-For': '192.168.1.100'
          },
          onResponse: ({ response }) => {
            expect(response.status).toBe(429)
          }
        })

        // Но запрос с другого IP должен пройти
        await $fetch('/test-rate-limit-strict', {
          baseURL: 'http://localhost:3000',
          ignoreResponseError: true,
          headers: {
            Accept: 'application/json',
            'X-Forwarded-For': '192.168.1.101'
          },
          onResponse: ({ response }) => {
            expect(response.status).toBe(200)
          }
        })
      })
    })
  })
})
