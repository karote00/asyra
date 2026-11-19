import { readPixiProofIdentity } from '../../../../scripts/pixi-proof-identity.mjs'
import { mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { chromium } from '@playwright/test'
import { createServer } from 'vite'
import { expect, it } from 'vitest'
import type { measureRetainedProjection } from './retained-hierarchy-browser-probe.js'

it.skipIf(process.env.HIERARCHY_PROBE_BROWSER !== '1')(
  'measures retained hierarchy through immediate query and real GPU extraction',
  async () => {
    if (process.env.CI || process.env.HIERARCHY_PROBE_BROWSER !== '1') {
      throw new Error(
        'Run explicitly with HIERARCHY_PROBE_BROWSER=1 on a local machine'
      )
    }

    const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
    const output = resolve(
      root,
      `../../../tmp/conversation-improvements/retained-hierarchy-${JSON.parse(readFileSync(resolve(root, '../../../node_modules/pixi.js/package.json'), 'utf8')).version}`
    )

    mkdirSync(output, { recursive: true })
    const server = await createServer({
      configFile: false,
      plugins: [
        {
          name: 'hierarchy-probe-page',

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
        throw new Error('Missing owned listener')
      }

      browser = await chromium.launch({ channel: 'chrome' })
      const page = await browser.newPage({
        viewport: { width: 640, height: 400 },
        deviceScaleFactor: 1
      })

      await page.goto(`http://127.0.0.1:${address.port}/`)
      const sdkIdentity = readPixiProofIdentity(
        await page.evaluate(
          `import('/__tests__/retained-hierarchy-browser-probe.ts').then(module => module.pixiVersion)`
        )
      )
      const evidencePath = process.env.HIERARCHY_HANDOFF_EVIDENCE_ROOT

      if (!evidencePath) {
        throw new Error(
          'Set HIERARCHY_HANDOFF_EVIDENCE_ROOT to the verified App handoff evidence directory'
        )
      }

      const evidenceRoot = resolve(evidencePath)
      const evidenceDirectory = readdirSync(evidenceRoot).find((name) =>
        name.endsWith('at-immediate-read-barriers-chromium-dpr-1')
      )

      if (!evidenceDirectory) {
        throw new Error('Run the App applied-handoff test first')
      }

      const handoff = JSON.parse(
        readFileSync(
          resolve(evidenceRoot, evidenceDirectory, 'applied-handoff.json'),
          'utf8'
        )
      )

      expect(handoff.sdkIdentity).toEqual(sdkIdentity)

      for (const source of handoff.sourceHashes as {
        file: string
        sha256: string
      }[]) {
        expect(
          createHash('sha256')
            .update(readFileSync(resolve(root, '../../..', source.file)))
            .digest('hex')
        ).toBe(source.sha256)
      }

      const replay = await page.evaluate<
        { expected: number[][]; actual: number[][] }[]
      >(
        `import('/__tests__/retained-hierarchy-browser-probe.ts').then(module =>
          module.replayAcceptedHandoff(${JSON.stringify(handoff)}))`
      )

      expect(replay).toHaveLength(handoff.batches.length + 1)
      for (const sample of replay) {
        expect(sample.actual).toEqual(sample.expected)
      }

      const results = []
      const sources = [
        'retained-hierarchy-probe.ts',
        'retained-hierarchy-browser-probe.ts',
        'retained-hierarchy-browser.test.ts'
      ].map((file) => ({
        file,
        sha256: createHash('sha256')
          .update(readFileSync(resolve(root, '__tests__', file)))
          .digest('hex')
      }))

      for (const roots of [4, 1000]) {
        const modes = [
          'ordinary',
          'isolated',
          'retained',
          'retained',
          'isolated',
          'ordinary'
        ] as const
        let expectedCapture = '',
          expectedEdited = '',
          expectedScene = ''

        for (const [block, mode] of modes.entries()) {
          const result = await page.evaluate<
            Awaited<ReturnType<typeof measureRetainedProjection>>
          >(
            `import('/__tests__/retained-hierarchy-browser-probe.ts').then(module =>
              module.measureRetainedProjection(${JSON.stringify(mode)}, ${roots}, ${4000 / roots}))`
          )
          const images = result.images as Record<string, string>
          const imageHashes: Record<string, string> = {}

          for (const [name, value] of Object.entries(images)) {
            const bytes = Buffer.from(value.split(',')[1], 'base64')

            writeFileSync(
              resolve(output, `${roots}-${block}-${mode}-${name}.png`),
              bytes
            )
            imageHashes[name] = createHash('sha256').update(bytes).digest('hex')
          }

          const { images: omitted, ...metrics } = result

          void omitted
          results.push({ ...metrics, block, imageHashes })
          writeFileSync(
            resolve(output, 'measurement.json'),
            JSON.stringify(
              {
                sdkIdentity,
                pid: process.pid,
                port: address.port,
                sources,
                handoffSources: handoff.sourceHashes,
                replay,
                browser: browser.version(),
                results
              },
              null,
              2
            )
          )
          expect(result.policyIntact).toBe(true)
          expect(result.directWork.membershipLeaves).toBe(
            mode === 'isolated' ? 0 : 8 * (4000 / roots)
          )
          for (const samples of Object.values(result.samples)) {
            expect(samples).toHaveLength(24)
          }

          expect(imageHashes.initial).toBe(imageHashes.restored)
          expect(imageHashes.beforeCapture).toBe(imageHashes.afterCapture)
          expect(imageHashes.beforeCapture).toBe(imageHashes.afterDirectCapture)
          expect(imageHashes.directCapture).toBe(imageHashes.capture)
          if (!expectedCapture) {
            expectedCapture = imageHashes.capture
            expectedEdited = imageHashes.editedCapture
            expectedScene = imageHashes.beforeCapture
          }

          expect(imageHashes.capture).toBe(expectedCapture)
          expect(imageHashes.editedCapture).toBe(expectedEdited)
          expect(imageHashes.beforeCapture).toBe(expectedScene)
          expect(imageHashes.capture).not.toBe(imageHashes.editedCapture)
          expect(result.capture.clones).toBe(
            mode === 'retained' ? 4 * (4000 / roots + 1) : 0
          )
        }
      }
    } finally {
      await browser?.close()
      await server.close()
    }
  },
  180_000
)
