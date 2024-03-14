import { defineConfig } from 'vitest/config'
import Unimport from 'unimport/unplugin'
import { resolve } from 'pathe'

export default defineConfig({
  plugins: [
    Unimport.vite({
      imports: [
        { name: 'describe', from: 'vitest' },
        { name: 'it', from: 'vitest' },
        { name: 'expect', from: 'vitest' },
        { name: 'beforeAll', from: 'vitest' },
        { name: 'afterAll', from: 'vitest' },
        { name: '$fetch', from: 'ofetch' },
        { name: 'v4', as: 'uuidv4', from: 'uuid' },
        { name: 'parse', from: 'set-cookie-parser' }
      ],
      dirs: ['./utils'],
      dts: true
    })
  ],
  test: {
    coverage: {
      reporter: ['text', 'clover', 'json']
    },
    include: ['./test-api/*.test.ts'],
    globalSetup: './global-setup.ts'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.')
    }
  }
})
