import { readPixiProofIdentity } from '../../../../scripts/pixi-proof-identity.mjs'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { chromium } from '@playwright/test'
import { createServer } from 'vite'
import { expect, it } from 'vitest'
import type {
  measureSharedPrograms,
  observeRetiredProgramOwners,
  verifyPooledProgramLifetime
} from './shared-program-probe.js'

it.skipIf(process.env.HIERARCHY_PROBE_BROWSER !== '1')(
  'compares shared programs without changing hierarchy or extraction work',
  async () => {
    if (process.env.CI) {
      throw new Error('Local GPU proof only')
    }

    const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
    const output = resolve(
      root,
      `../../../tmp/conversation-improvements/pixi-lifetime-${JSON.parse(readFileSync(resolve(root, '../../../node_modules/pixi.js/package.json'), 'utf8')).version}`
    )

    mkdirSync(output, { recursive: true })
    const server = await createServer({
      configFile: false,
      plugins: [
        {
          name: 'program-probe-page',

          configureServer(devServer) {
            devServer.middlewares.use((request, response, next) => {
              if (request.url !== '/') {
                return next()
              }

              response.setHeader('Content-Type', 'text/html')
              response.end('<!doctype html><html><body></body></html>')
            })
          }
        }
      ],
      root,
      cacheDir: resolve(output, 'vite-cache'),
      logLevel: 'error',
      server: { port: 0, host: '127.0.0.1', hmr: false },
      optimizeDeps: { include: ['pixi.js'] }
    })
    let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined

    try {
      await server.listen()
      const address = server.httpServer?.address()

      if (!address || typeof address === 'string') {
        throw new Error('Missing listener')
      }

      browser = await chromium.launch({ channel: 'chrome' })
      const page = await browser.newPage({
        viewport: { width: 640, height: 400 },
        deviceScaleFactor: 1
      })
      const errors: string[] = []

      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto(`http://127.0.0.1:${address.port}/`)
      const sdkIdentity = readPixiProofIdentity(
        await page.evaluate(
          `import('/__tests__/shared-program-probe.ts').then(module => module.pixiVersion)`
        )
      )
      const ownership = await page.evaluate(
        `import('/__tests__/shared-program-probe.ts').then(module => module.verifyProgramOwnership())`
      )

      expect(ownership).toEqual({
        sameProgram: true,
        separateShaders: true,
        capacitySeparated: true,
        survivorUsable: true
      })
      const restored = await page.evaluate(
        `import('/__tests__/shared-program-probe.ts').then(module => module.verifyProgramContextRestore())`
      )

      expect(restored).toEqual({
        samePixels: true,
        newNativeProgram: true,
        changedPixels: true,
        error: 0
      })
      const lifetime = await page.evaluate(
        `import('/__tests__/shared-program-probe.ts').then(module => module.verifyLiveProgramLifetime())`
      )

      expect(lifetime).toEqual({
        sharedSource: true,
        distinctNativePrograms: true,
        sameAfterRelease: true,
        sameAfterCapture: true,
        programSurvives: true,
        cleared: [255, 255, 255, 255],
        moved: [128, 255, 128, 255],
        unchangedSibling: [0, 0, 255, 255],
        captured: [128, 255, 128, 255],
        bounds: [8, 8],
        later: [0, 255, 0, 255],
        error: 0
      })
      writeFileSync(
        resolve(output, 'lifetime-review.json'),
        JSON.stringify({ sdkIdentity, ownership, restored, lifetime }, null, 2)
      )
      const retainedBefore = await page.evaluate<
        Awaited<ReturnType<typeof observeRetiredProgramOwners>>
      >(
        `import('/__tests__/shared-program-probe.ts').then(module => module.observeRetiredProgramOwners(false))`
      )
      const retainedAfter = await page.evaluate<
        Awaited<ReturnType<typeof observeRetiredProgramOwners>>
      >(
        `import('/__tests__/shared-program-probe.ts').then(module => module.observeRetiredProgramOwners(true))`
      )

      writeFileSync(
        resolve(output, 'retired-owner-review.json'),
        JSON.stringify(
          { before: retainedBefore, after: retainedAfter },
          null,
          2
        )
      )
      for (const retired of [retainedBefore, retainedAfter]) {
        expect(retired.retainedAfterDelete).toBe(0)
        expect(retired.retainedShaders).toBe(0)
        expect(retired.destroyedAfterDelete).toBe(retired.retired)
        expect(retired.destroyedAfterRenderer).toBe(retired.retired)
        expect(retired.contextLost).toBe(true)
      }

      for (const flushBeforeShutdown of [true, false]) {
        const pooled = await page.evaluate<
          Awaited<ReturnType<typeof verifyPooledProgramLifetime>>
        >(
          `import('/__tests__/shared-program-probe.ts').then(module => module.verifyPooledProgramLifetime(${flushBeforeShutdown}))`
        )

        writeFileSync(
          resolve(output, `pool-review-${flushBeforeShutdown}.json`),
          JSON.stringify(pooled, null, 2)
        )
        // SDK teardown can revisit an owner; actual resources must release once.
        const { destroyedAfterShutdown, ...resources } = pooled

        expect(destroyedAfterShutdown).toBeGreaterThan(0)
        expect(resources).toEqual({
          sameOwners: Array(8).fill(true),
          initial: [255, 0, 0, 255],
          edited: [0, 255, 0, 255],
          extracted: [0, 255, 0, 255],
          following: [0, 255, 0, 255],
          destroyedWhileReusing: 0,
          retainedWhilePooled: true,
          geometryReleases: 1,
          shaderReleases: 1,
          retainedAfterShutdown: false,
          error: 0
        })
      }

      let mixedReference: unknown

      for (const shared of [false, true]) {
        const mixed = await page.evaluate<{
          images: Record<string, string>
          bounds: { width: number; height: number }
          error: number
          selectedPixel: number[]
        }>(
          `import('/__tests__/shared-program-probe.ts').then(module => module.verifyMixedProgramContent(${shared}))`
        )

        expect(mixed.error).toBe(0)
        expect(mixed.selectedPixel).toEqual([221, 221, 238, 255])
        expect(mixed.images.initial).toBe(mixed.images.restored)
        expect(mixed.images.edited).not.toBe(mixed.images.initial)
        expect(mixed.bounds.width).toBeGreaterThan(0)
        expect(mixed.bounds.width).toBeLessThan(180)
        if (mixedReference) {
          expect(mixed).toEqual(mixedReference)
        } else {
          mixedReference = mixed
        }

        for (const [name, data] of Object.entries(mixed.images)) {
          writeFileSync(
            resolve(output, `mixed-${shared}-${name}.png`),
            Buffer.from(data.split(',')[1], 'base64')
          )
        }
      }

      const sources = [
        '__tests__/shared-program-browser.test.ts',
        '__tests__/shared-program-probe.ts',
        '__tests__/retained-hierarchy-browser-probe.ts',
        '__tests__/retained-hierarchy-probe.ts',
        'mesh-material-batch.ts',
        'mesh-material-shader.ts'
      ].map((file) => ({
        file,
        sha256: createHash('sha256')
          .update(readFileSync(resolve(root, file)))
          .digest('hex')
      }))
      const results = []

      for (const roots of [4, 1000]) {
        let expected: Record<string, string> | undefined

        for (const [block, shared] of [false, true, true, false].entries()) {
          const result = await page.evaluate<
            Awaited<ReturnType<typeof measureSharedPrograms>>
          >(
            `import('/__tests__/shared-program-probe.ts').then(module => module.measureSharedPrograms(${shared}, ${roots}))`
          )
          const hashes: Record<string, string> = {}

          for (const [name, data] of Object.entries(result.images)) {
            const bytes = Buffer.from(data.split(',')[1], 'base64')

            hashes[name] = createHash('sha256').update(bytes).digest('hex')
            writeFileSync(
              resolve(output, `${roots}-${block}-${name}.png`),
              bytes
            )
          }

          const { images, ...metrics } = result

          void images
          results.push({ block, shared, ...metrics, hashes })
          writeFileSync(
            resolve(output, 'measurement.json'),
            JSON.stringify(
              {
                sdkIdentity,
                pid: process.pid,
                port: address.port,
                browser: browser.version(),
                sources,
                results
              },
              null,
              2
            )
          )
          if (expected) {
            expect(hashes).toEqual(expected)
          } else {
            expected = hashes
          }

          expect(result.policyIntact).toBe(true)
          expect(result.directWork.membershipLeaves).toBe(0)
          expect(result.capture.clones).toBe(0)
          expect(result.work.programs).toBe(shared ? 1 : roots + 1)
          expect(result.work.programBinds).toBe(shared ? 0 : roots + 1)
          expect(hashes.initial).toBe(hashes.restored)
          expect(hashes.capture).not.toBe(hashes.editedCapture)
        }
      }

      expect(errors).toEqual([])
    } finally {
      await browser?.close()
      await server.close()
    }
  },
  180_000
)
