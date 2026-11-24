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

test('installs a packed editor and edits isolated documents in the production React consumer', async () => {
  const scratch = path.join(root, 'tmp/react-canvas')

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
  const archives = [
    'sdk/react',
    'node_modules/react',
    'node_modules/react-dom',
    'node_modules/scheduler',
    'node_modules/@types/react',
    'node_modules/csstype'
  ].map((dir) => pack(path.join(root, dir)))

  npm([
    'install',
    '--offline',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    ...archives
  ])
  for (const name of ['index.html', 'main.jsx']) {
    await cp(path.join(fixture, name), path.join(cwd, name))
  }

  await writeFile(
    path.join(cwd, 'consumer.tsx'),
    [
      "import { AsyraCanvas, type CanvasAction } from '@asyra/react'",
      "const action: CanvasAction = {label: 'Draw', execute: editor => editor.drawRectangle({x: 0, y: 0, width: 10, height: 10})}",
      'export const panel = <AsyraCanvas actions={[action]} />'
    ].join('\n')
  )
  execFileSync(
    process.execPath,
    [
      path.join(root, 'node_modules/typescript/bin/tsc'),
      '--noEmit',
      '--strict',
      '--target',
      'ES2022',
      '--jsx',
      'react-jsx',
      '--module',
      'ESNext',
      '--moduleResolution',
      'bundler',
      '--types',
      'react',
      'consumer.tsx'
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
    const first = page.frameLocator('[title="Asyra canvas"]')
    const second = page.frameLocator('[title="Persistent diagram"]')

    async function ready(frame) {
      await frame
        .locator('output')
        .filter({ hasText: /^Ready$/ })
        .waitFor({ timeout: 10000 })
        .catch(async (e) => {
          throw new Error(await frame.locator('output').textContent(), {
            cause: e
          })
        })
    }

    async function color(frame, x, y) {
      const png = await frame.locator('canvas').screenshot()
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

    await ready(first)
    await ready(second)
    const bounds = await first.locator('canvas').boundingBox()
    const mouse = page.mouse

    await mouse.move(bounds.x + 55, bounds.y + 50)
    await mouse.down()
    await mouse.move(bounds.x + 155, bounds.y + 130, { steps: 5 })
    await mouse.up()
    await expectColor(first, 90, 85, [204, 204, 204])
    await expectColor(first, 45, 85, [255, 255, 255])
    await first.getByRole('button', { name: 'Select', exact: true }).click()
    await first.locator('canvas').click({ position: { x: 90, y: 85 } })
    await first
      .locator('output')
      .filter({ hasText: 'Selected:' })
      .waitFor({ timeout: 4000 })
    await expectColor(first, 55, 85, [21, 122, 231])
    await page.screenshot({ path: path.join(cwd, 'selected-rectangle.png') })
    await first.getByRole('button', { name: 'Undo' }).click()
    await expectColor(first, 90, 85, [255, 255, 255])
    await first.getByRole('button', { name: 'Redo' }).click()
    await expectColor(first, 90, 85, [204, 204, 204])
    await expectColor(second, 90, 85, [255, 255, 255])
    await page.getByRole('button', { name: 'Toggle first editor' }).click()
    await second.getByRole('button', { name: 'Invalid block' }).click()
    await second.getByText(/positive dimensions/).waitFor()
    await second.getByRole('button', { name: 'Add block' }).click()
    await expectColor(second, 25, 20, [204, 204, 204])
    await second.getByRole('button', { name: 'Save' }).click()
    await second.getByText('Saved', { exact: true }).waitFor()
    await page.reload()
    await ready(first)
    await ready(second)
    await expectColor(first, 90, 85, [255, 255, 255])
    await expectColor(second, 25, 20, [204, 204, 204])
    await first.locator('canvas').click({ position: { x: 30, y: 30 } })
    await page.mouse.move(bounds.x + 20, bounds.y + 20)
    await page.mouse.down()
    await page.mouse.move(bounds.x + 90, bounds.y + 80)
    await page.keyboard.press('Escape')
    await page.mouse.up()
    await expectColor(first, 60, 60, [255, 255, 255])
    await page.evaluate(() =>
      globalThis.localStorage.setItem('@asyra/react:document:diagram', '{}')
    )
    await page.reload()
    await ready(first)
    await second
      .getByText('The saved canvas document is invalid')
      .waitFor({ timeout: 5000 })
    assert.equal(await second.locator('nav').getAttribute('inert'), '')
    assert.deepEqual(errors, [])
  } finally {
    await browser?.close()
    await new Promise((resolve) => server.httpServer.close(resolve))
  }
})
