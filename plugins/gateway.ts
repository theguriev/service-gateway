import { readFileSync } from 'node:fs'
import { safeDestr } from 'destr'
import type { NitroRouteConfig } from 'nitropack'
import type { RouterMethod } from 'h3'

export default defineNitroPlugin((app) => {
  try {
    const { routesFile, secret } = useRuntimeConfig()
    const file = readFileSync(routesFile, 'utf-8')
    const routes = safeDestr<{ [path: string]: NitroRouteConfig & { method: RouterMethod; authorizationNeeded?: boolean; } }>(file)

    Object.entries(routes).forEach(([path, route]) => {
      const method = (route.method || 'get').toLowerCase() as RouterMethod
      if (method in app.router) {
        app.router.add(path, defineEventHandler(async (event) => {
          if (route.authorizationNeeded) {
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

          if (route.proxy) {
            if (typeof route.proxy === 'string') {
              return proxyRequest(event, route.proxy)
            }
            if ('to' in route.proxy) {
              return proxyRequest(event, route.proxy.to, route.proxy)
            }
          }
          return new Response('No proxy defined', { status: 500 })
        }), method)
      }
    })
    console.log('Nitro plugin!', routes, issueAccessToken({ id: '123', role: 'admin' }, { secret }))
  } catch (error) {
    console.error('Initialize error: ', error)
  }
})
