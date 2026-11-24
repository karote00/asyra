import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { URL, fileURLToPath } from 'node:url'
import test from 'node:test'
import { build, preview } from 'vite'
import { chromium } from 'playwright'
import sharp from 'sharp'

const fixture = fileURLToPath(new URL('../', import.meta.url))
const root = path.resolve(fixture, '../..')

async function withConsumer(packages, entry, assertions) {
  const scratch = path.join(root, 'tmp/native-canvas')

  await mkdir(scratch, { recursive: true })
  const cwd = await mkdtemp(path.join(scratch, 'consumer-'))

  const npm = (args) =>
    execFileSync('npm', args, {
      cwd,
      encoding: 'utf8',
      env: { ...process.env, npm_config_cache: path.join(scratch, 'npm-cache') }
    })

  const pack = (dir) => {
    const [{ filename }] = JSON.parse(
      npm(['pack', dir, '--ignore-scripts', '--json'])
    )

    return './' + filename
  }

  await writeFile(
    path.join(cwd, 'package.json'),
    JSON.stringify({ private: true, type: 'module' })
  )
  const archives = packages.map((dir) => pack(path.join(root, dir)))

  npm([
    'install',
    '--offline',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    ...archives
  ])
  const { packages: installed } = JSON.parse(
    await readFile(path.join(cwd, 'package-lock.json'), 'utf8')
  )

  assert.deepEqual(
    Object.keys(installed).filter(Boolean).sort(),
    packages.map((dir) => 'node_modules/@asyra/' + path.basename(dir)).sort()
  )
  await cp(path.join(fixture, 'index.html'), path.join(cwd, 'index.html'))
  await cp(path.join(fixture, entry), path.join(cwd, 'main.js'))

  await writeFile(
    path.join(cwd, 'consumer.ts'),
    [
      "import { createCanvas } from '@asyra/canvas'",
      "export const surface = createCanvas(document.createElement('canvas'))",
      ...(packages.includes('sdk/design')
        ? [
            "import { attachDesignTools } from '@asyra/design'",
            'const tools = await attachDesignTools(surface)',
            "tools.setTool('select')",
            'await tools.undo()'
          ]
        : []),
      ...(packages.includes('sdk/simulation')
        ? [
            "import { attachSimulationTools } from '@asyra/simulation'",
            'const tools = await attachSimulationTools(surface)',
            'tools.play(0, 1, seconds => seconds.toFixed(2), () => tools.pause())'
          ]
        : [])
    ].join('\n')
  )
  execFileSync(
    process.execPath,
    [
      path.join(root, 'node_modules/typescript/bin/tsc'),
      '--noEmit',
      '--strict',
      '--typeRoots',
      './node_modules/@types',
      '--target',
      'ES2022',
      '--module',
      'ESNext',
      '--moduleResolution',
      'bundler',
      'consumer.ts'
    ],
    { cwd }
  )
  const result = await build({
    root: cwd,
    configFile: false,
    logLevel: 'error'
  })

  for (const chunk of result.output.filter((entry) => entry.type === 'chunk')) {
    for (const id of chunk.moduleIds) {
      if (path.isAbsolute(id)) {
        assert.ok(
          id.startsWith(cwd + path.sep),
          'Module escaped the clean consumer: ' + id
        )
      }
    }
  }

  const server = await preview({
    root: cwd,
    configFile: false,
    preview: { port: 0, host: '127.0.0.1' }
  })
  let browser

  try {
    browser = await chromium.launch({
      channel:
        process.env.PLAYWRIGHT_CHANNEL ||
        (process.env.CI ? 'chrome' : undefined),
      args: ['--enable-unsafe-swiftshader']
    })
    const page = await browser.newPage({
      viewport: { width: 850, height: 1080 }
    })
    const errors = []

    page.on('pageerror', (error) => {
      errors.push(error.message)
    })
    await page.goto(server.resolvedUrls.local[0])
    await assertions(page, cwd)
    assert.deepEqual(errors, [])
  } finally {
    await browser?.close()
    await new Promise((resolve) => server.httpServer.close(resolve))
  }
}

test('a standalone canvas binding preserves host pixels and owns only mount and disposal', async () => {
  await withConsumer(['sdk/canvas'], 'bare.js', async (page) => {
    await page.waitForFunction(() => Boolean(globalThis.fixture))
    const canvas = page.locator('#first')

    await canvas.click({ position: { x: 50, y: 50 } })
    const state = await page.evaluate(async () => {
      const { surface, target, context, createCanvas } = globalThis.fixture
      const pixels = [
        ...context.getImageData(8, 8, 1, 1).data,
        ...context.getImageData(50, 50, 1, 1).data
      ]
      const identity = surface.target === target
      let release
      let retired = 0
      const pending = surface.mount(
        () =>
          new Promise((resolve) => {
            release = resolve
          })
      )
      const closing = surface.destroy()

      await Promise.resolve()
      release({
        tools: {},

        destroy() {
          retired++
        }
      })
      let interrupted = false

      try {
        await pending
      } catch {
        interrupted = true
      }

      await closing
      const next = createCanvas(target)
      let rejected = false

      try {
        await next.mount(() => {
          throw new Error('Setup failed')
        })
      } catch {
        rejected = true
      }

      const retried = await next.mount((element) => ({
        tools: element === target,

        destroy: () => undefined
      }))

      await next.destroy()

      return {
        pixels,
        identity,
        keys: Object.keys(surface).sort(),
        retired,
        interrupted,
        rejected,
        retried
      }
    })

    assert.deepEqual(state, {
      pixels: [255, 0, 0, 255, 0, 0, 0, 0],
      identity: true,
      keys: ['destroy', 'mount', 'target'],
      retired: 1,
      interrupted: true,
      rejected: true,
      retried: true
    })
  })
})

test('simulation plays and cancels samples with only canvas and simulation installed', async () => {
  await withConsumer(
    ['sdk/canvas', 'sdk/simulation'],
    'simulation.js',
    async (page) => {
      await page.waitForFunction(() => Boolean(globalThis.fixture))
      const state = await page.evaluate(async () => {
        const { surface, tools } = globalThis.fixture
        const samples = []

        await new Promise((resolve) =>
          tools.play(2, 2.05, (time) => samples.push(time), resolve)
        )
        let late = 0

        tools.play(
          0,
          1,
          () => late++,
          () => late++
        )
        await surface.destroy()
        await new Promise((resolve) =>
          globalThis.requestAnimationFrame(resolve)
        )

        return { end: samples.at(-1), late, keys: Object.keys(tools).sort() }
      })

      assert.deepEqual(state, { end: 2.05, late: 0, keys: ['pause', 'play'] })
    }
  )
})

test('opt-in design tools edit isolated documents in the packed browser consumer', async () => {
  await withConsumer(
    ['sdk/canvas', 'sdk/design'],
    'main.js',
    async (page, cwd) => {
      await page.waitForFunction(
        () => globalThis.editors?.length === 2 || false,
        undefined,
        { timeout: 10000 }
      )

      const first = page.locator('#first')
      const second = page.locator('#second')

      async function color(frame, x, y) {
        const png = await frame.screenshot()
        const pixel = await sharp(png)
          .extract({ left: x, top: y, width: 1, height: 1 })
          .removeAlpha()
          .raw()
          .toBuffer()

        return [...pixel]
      }

      async function expectColor(frame, x, y, rgb) {
        await assert.doesNotReject(async () => {
          for (let attempt = 0; attempt < 10; attempt++) {
            const actual = await color(frame, x, y)

            if (actual.every((v, i) => Math.abs(v - rgb[i]) < 3)) {
              return
            }

            if (attempt === 9) {
              assert.deepEqual(actual, rgb)
            }
          }
        })
      }

      const bounds = await first.boundingBox()

      await page.mouse.move(bounds.x + 55, bounds.y + 50)
      await page.mouse.down()
      await page.mouse.move(bounds.x + 155, bounds.y + 130)
      await page.mouse.up()
      await expectColor(first, 90, 85, [204, 204, 204])
      await expectColor(second, 90, 85, [255, 255, 255])
      await page.evaluate(() => globalThis.editors[0].setTool('select'))
      await first.click({ position: { x: 90, y: 85 } })
      await expectColor(first, 55, 85, [21, 122, 231])
      assert.equal(
        await page.evaluate(() => globalThis.editors[0].getSelection().length),
        1
      )
      await page.evaluate(() => globalThis.editors[0].undo())
      await expectColor(first, 90, 85, [255, 255, 255])
      await page.evaluate(() => globalThis.editors[0].redo())
      await expectColor(first, 90, 85, [204, 204, 204])
      await page.screenshot({ path: path.join(cwd, 'selected-rectangle.png') })
      assert.equal(
        await page.evaluate(async () => {
          for (const invalid of [
            globalThis.document.body,
            null,
            globalThis.targets[0]
          ]) {
            try {
              await globalThis.createCanvas(invalid)

              return false
            } catch {
              continue
            }
          }

          return true
        }),
        true
      )
      const snapshot = await page.evaluate(() => globalThis.editors[0].save())

      await page.evaluate(() => globalThis.editors[0].destroy())
      assert.equal(
        await page.evaluate(
          () =>
            globalThis.document.querySelector('#first') ===
            globalThis.targets[0]
        ),
        true
      )
      await page.evaluate(() =>
        globalThis.editors[1].drawRectangle({
          x: 20,
          y: 30,
          width: 50,
          height: 50
        })
      )
      await expectColor(second, 40, 50, [204, 204, 204])
      await page.evaluate(async (snapshot) => {
        globalThis.editors[0] = await globalThis.mountDesign(
          globalThis.targets[0],
          { document: snapshot }
        )
      }, snapshot)
      await expectColor(first, 90, 85, [204, 204, 204])
      await page.evaluate(() =>
        Promise.all(globalThis.editors.map((editor) => editor.destroy()))
      )
      assert.equal(await page.locator('iframe').count(), 0)
      assert.equal(await page.locator('canvas').count(), 2)
    }
  )
})
