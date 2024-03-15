export default () =>
  defineNitroConfig({
    errorHandler: '~/error',
    runtimeConfig: {
      secret: 'secret',
      routesFile: './routes.ts'
    }
  })
