export default () =>
  defineNitroConfig({
    errorHandler: '~/error',
    runtimeConfig: {
      secret: 'secret'
    },
    imports: {
      imports: [{ name: 'parse', from: 'set-cookie-parser' }],
      presets: [
        {
          from: 'zod',
          imports: ['z']
        }
      ]
    }
  })
