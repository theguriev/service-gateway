export default () =>
  defineNitroConfig({
    errorHandler: '~/error',
    runtimeConfig: {
      secret: 'secret',
      routesFile: './routes.ts'
    },
    routeRules: {
      '/**': { cors: true, headers: { 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } }
    }
  })
