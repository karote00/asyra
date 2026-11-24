import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { URL, fileURLToPath } from 'node:url'
import test from 'node:test'
import { build, preview } from 'vite'
import { chromium } from 'playwright'
import sharp from 'sharp'

const fixture = fileURLToPath(new URL('../', import.meta.url))
const root = path.resolve(fixture, '../..')

test('installs a packed editor and edits isolated documents in the plain browser consumer', async () => {
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
  const archives = ['sdk/canvas'].map((dir) => pack(path.join(root, dir)))

  npm([
    'install',
    '--offline',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    ...archives
  ])
  for (const name of ['index.html', 'main.js']) {
    await cp(path.join(fixture, name), path.join(cwd, name))
  }

  await writeFile(
    path.join(cwd, 'consumer.ts'),
    [
      "import { createCanvas } from '@asyra/canvas'",
      "export const editor = createCanvas(document.createElement('canvas'))"
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
      channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
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
    await page
      .waitForFunction(
        () => globalThis.editors?.length === 2 || false,
        undefined,
        { timeout: 10000 }
      )
      .catch((e) => {
        throw new Error(errors.join(' | '), { cause: e })
      })
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
          globalThis.document.querySelector('#first') === globalThis.targets[0]
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
      globalThis.editors[0] = await globalThis.createCanvas(
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
    assert.deepEqual(errors, [])
  } finally {
    await browser?.close()
    await new Promise((resolve) => server.httpServer.close(resolve))
  }
})
