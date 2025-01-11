import { readFileSync } from 'node:fs'
import { safeDestr } from 'destr'
import type { NitroRouteConfig } from 'nitropack'
import type { RouterMethod } from 'h3'

type Route = NitroRouteConfig & { methods: Array<RouterMethod>; authorizationNeeded?: boolean; };

const prepareTarget = (target: string, params: Record<string, string>, search: string) => {
  return `${target.replace(/\/:([^/]+)/g, (_, key) => `/${params[key] || ''}`)}${search}`
}

export default defineNitroPlugin((app) => {
  try {
    const { routesFile, secret } = useRuntimeConfig()
    const file = readFileSync(routesFile, 'utf-8')
    const routes = safeDestr<{ [path: string]: Route }>(file)

    Object.entries(routes).forEach(([path, { methods, authorizationNeeded, proxy }]) => {
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
