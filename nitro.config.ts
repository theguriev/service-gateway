import { camelCase } from 'scule'
import importsHelper from './importsHelper'

// https://nitro.unjs.io/config
export default async () =>
  defineNitroConfig({
    errorHandler: '~/error',
    experimental: {
      openAPI: true
    },
    runtimeConfig: {
      mongoUri: 'mongodb://root:example@localhost:27017/',
      secret: 'secret'
    },
    imports: {
      imports: [
        ...(await importsHelper('./db/model')),
        ...(await importsHelper('./db/schema', camelCase)),
        { name: 'parse', from: 'set-cookie-parser' }
      ],
      presets: [
        {
          from: 'zod',
          imports: ['z']
        }
      ],
      dirs: ['./composables']
    }
  })
