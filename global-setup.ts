import { tmpdir } from 'node:os'
import { promises as fsp } from 'node:fs'
import { createNitro, build, prepare, copyPublicAssets, prerender } from 'nitropack'
import type { Nitro } from 'nitropack'
import { join, resolve } from 'pathe'
import { listen, Listener } from 'listhen'
import { FetchOptions, $fetch } from 'ofetch'
import { fileURLToPath } from 'mlly'
import { joinURL } from 'ufo'

interface Context {
    preset: string;
    nitro?: Nitro;
    rootDir: string;
    outDir: string;
    fetch: (url: string, opts?: FetchOptions) => Promise<any>;
    server?: Listener;
    env: Record<string, string>;
  }

const fixtureDir = fileURLToPath(
  new URL('.', import.meta.url).href
)

const getPresetTmpDir = (preset: string) =>
  resolve(
    process.env.NITRO_TEST_TMP_DIR || join(tmpdir(), 'nitro-tests'),
    preset
  )
const preset = 'node'

let teardownHappened = false
const presetTmpDir = getPresetTmpDir(preset)

const ctx: Context = {
  preset,
  rootDir: fixtureDir,
  outDir: resolve(fixtureDir, presetTmpDir, '.output'),
  env: {
    NITRO_SECRET: 'secret',
    NITRO_ROUTES_FILE: './routes.json'
  },
  fetch: (url, opts): Promise<Response> => $fetch(joinURL(ctx.server!.url, url.slice(1)), {
    redirect: 'manual',
    ignoreResponseError: true,
    ...(opts as any)
  })
}

export const setup = async () => {
  await fsp.rm(presetTmpDir, { recursive: true }).catch(() => {})
  await fsp.mkdir(presetTmpDir, { recursive: true })

  // Set environment variables for process compatible presets
  for (const [name, value] of Object.entries(ctx.env)) {
    process.env[name] = value
  }

  const nitro = (ctx.nitro = await createNitro(
    {
      preset: ctx.preset,
      dev: false,
      rootDir: ctx.rootDir,
      runtimeConfig: {
        nitro: {
          envPrefix: 'CUSTOM_'
        }
      },
      buildDir: resolve(fixtureDir, presetTmpDir, '.nitro'),
      serveStatic: true,
      output: {
        dir: ctx.outDir
      },
      timing: true
    }
  ))

  await prepare(nitro)
  await copyPublicAssets(nitro)
  await prerender(nitro)
  await build(nitro)

  const entryPath = resolve(ctx.outDir, 'server/index.mjs')
  const { listener } = await import(entryPath)
  ctx.server = await listen(listener)
  console.log('>', ctx.server!.url)
}

export const teardown = async () => {
  if (teardownHappened) { throw new Error('teardown called twice') }
  teardownHappened = true

  if (ctx.server) {
    await ctx.server.close()
  }
  if (ctx.nitro) {
    await ctx.nitro.close()
  }
}

export default setup
