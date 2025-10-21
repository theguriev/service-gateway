import { readFileSync } from 'node:fs'
import { safeDestr } from 'destr'
import type { RouterMethod } from 'h3'
import type { NitroRouteConfig } from 'nitropack'

type Route = NitroRouteConfig & {
  methods: Array<RouterMethod>
  authorizationNeeded?: boolean
  rateLimit?: {
    requests: number
    window: number // в секундах
  }
}

// Простой in-memory store для рейт лимитов
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

const checkRateLimit = (ip: string, limit: { requests: number; window: number }) => {
  const now = Date.now()
  const key = ip
  const current = rateLimitStore.get(key)

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + limit.window * 1000 })
    return true
  }

  if (current.count >= limit.requests) {
    return false
  }

  current.count++
  return true
}

const prepareTarget = (target: string, params: Record<string, string>, search: string) => {
  return `${target.replace(/\/:([^/]+)/g, (_, key) => `/${params[key] || ''}`)}${search}`
}

export default defineNitroPlugin((app) => {
  try {
    const { routesFile, secret } = useRuntimeConfig()
    const file = readFileSync(routesFile, 'utf-8')
    const routes = safeDestr<{ [path: string]: Route }>(file)

    Object.entries(routes).forEach(([path, { methods, authorizationNeeded, rateLimit, proxy }]) => {
      if (!Array.isArray(methods)) {
        return
      }
      methods.forEach((unpreparedMethod) => {
        const method = unpreparedMethod.toLowerCase() as RouterMethod
        if (!(method in app.router)) {
          return
        }
        app.router.add(path, defineEventHandler(async (event) => {
          const { search } = getRequestURL(event)
          const params = getRouterParams(event)

          // Проверка рейт лимита
          if (rateLimit) {
            const clientIP = getHeader(event, 'x-forwarded-for') || getRequestIP(event) || 'unknown'
            if (!checkRateLimit(clientIP, rateLimit)) {
              throw createError({
                message: 'Rate limit exceeded',
                status: 429,
                statusMessage: 'Too Many Requests'
              })
            }
          }

          if (authorizationNeeded) {
            const accessToken = getCookie(event, 'accessToken')
            if (!accessToken) {
              throw createError({ message: 'Access token not found!', status: 404 })
            }

            try {
              await verify(accessToken, secret)
            } catch (_err) {
              throw createError({ message: 'Invalid access token!', status: 401 })
            }
          }

          if (proxy) {
            if (typeof proxy === 'string') {
              return proxyRequest(event, prepareTarget(proxy, params, search))
            }
            if ('to' in proxy) {
              return proxyRequest(event, prepareTarget(proxy.to, params, search))
            }
          }
          return new Response('No proxy defined', { status: 500 })
        }), method)
      })
    })
  } catch (error) {
    console.error('Initialize error: ', error)
  }
})
