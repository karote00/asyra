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
    packages
      .map((dir) =>
        dir.startsWith('sdk/')
          ? 'node_modules/@asyra/' + path.basename(dir)
          : dir
      )
      .sort()
  )
  await cp(path.join(fixture, 'index.html'), path.join(cwd, 'index.html'))
  if (entry === 'react.js') {
    await cp(path.join(fixture, 'examples'), path.join(cwd, 'examples'), {
      recursive: true
    })
  }

  await cp(path.join(fixture, entry), path.join(cwd, 'main.js'))

  await writeFile(
    path.join(cwd, 'consumer.ts'),
    [
      "import { createCanvas } from '@asyra/canvas'",
      "export const surface = createCanvas(document.createElement('canvas'))",
      ...(packages.includes('sdk/design')
        ? [
            "import { createDesign, attachDesignTools } from '@asyra/design'",
            "const editor = await createDesign(document.body.appendChild(document.createElement('div')), { toolbar: false, actions: { revert: { label: 'Undo', run: tools => tools.undo() } } })",
            "await editor.runAction('revert')",
            'await editor.destroy()',
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
      'consumer.ts',
      ...(entry === 'react.js'
        ? ['--jsx', 'react-jsx', 'examples/DesignBoard.tsx']
        : [])
    ],
    { cwd }
  )
  const result = await build({
    esbuild: { jsx: 'automatic' },
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

test('opt-in design entry mounts default controls, custom actions or a host UI', async () => {
  await withConsumer(
    ['sdk/canvas', 'sdk/design'],
    'design.js',
    async (page) => {
      await page.evaluate(() => globalThis.ready)
      const toolbar = page.getByRole('group', { name: 'Design tools' })

      const button = (name) =>
        toolbar.getByRole('button', { name, exact: true })

      const canvas = page.locator('#first')
      const bounds = await canvas.boundingBox()

      async function shapes() {
        return page.evaluate(async () => {
          const doc = await globalThis.editor.save()

          return doc.sceneTree.elements.workspace.children.length
        })
      }

      assert.deepEqual(await toolbar.locator('button').allTextContents(), [
        'Rectangle',
        'Select',
        'Undo',
        'Redo'
      ])
      assert.equal(
        await button('Rectangle').getAttribute('aria-pressed'),
        'true'
      )
      await page.mouse.move(bounds.x + 25, bounds.y + 30)
      await page.mouse.down()
      await page.mouse.move(bounds.x + 110, bounds.y + 90)
      await page.mouse.up()
      assert.equal(await shapes(), 1)
      await button('Select').click()
      await canvas.click({ position: { x: 50, y: 55 } })
      assert.equal(
        await page.evaluate(() => globalThis.editor.getSelection().length),
        1
      )
      await button('Undo').click()
      assert.equal(await shapes(), 0)
      await button('Redo').click()
      assert.equal(await shapes(), 1)
      await page.evaluate(() => globalThis.editor.setTool('rectangle'))
      assert.equal(
        await button('Rectangle').getAttribute('aria-pressed'),
        'true'
      )
      await page.evaluate(() => globalThis.editor.destroy())
      assert.equal(await toolbar.count(), 0)
      assert.equal(await canvas.getAttribute('tabindex'), null)

      await page.evaluate(async () => {
        const target = globalThis.document.querySelector('#first')

        globalThis.editor = await globalThis.createDesign(target, {
          actions: {
            card: {
              label: 'Add card',

              run: (tools) =>
                tools.drawRectangle({ x: 10, y: 20, width: 80, height: 40 })
            }
          },
          toolbar: ['card', 'undo']
        })
      })
      assert.deepEqual(await toolbar.locator('button').allTextContents(), [
        'Add card',
        'Undo'
      ])
      await button('Add card').click()
      assert.equal(await shapes(), 1)
      await button('Undo').click()
      assert.equal(await shapes(), 0)

      await page.evaluate(async () => {
        await globalThis.editor.destroy()
        const target = globalThis.document.querySelector('#second')

        try {
          await globalThis.createDesign(target, { toolbar: ['unknown'] })
        } catch (error) {
          if (!(error instanceof TypeError)) {
            throw error
          }
        }

        globalThis.editor = await globalThis.createDesign(target, {
          toolbar: false,
          actions: {
            stamp: {
              label: 'Stamp',

              run: (tools) =>
                tools.drawRectangle({ x: 5, y: 8, width: 40, height: 25 })
            }
          }
        })
        await globalThis.editor.runAction('stamp')
      })
      assert.equal(await toolbar.count(), 0)
      assert.equal(await shapes(), 1)
      await page.evaluate(() => globalThis.editor.destroy())
      assert.equal(await page.locator('#second').getAttribute('tabindex'), '0')
    }
  )
})

test('opt-in design owns the canvas inside a supplied container', async () => {
  await withConsumer(
    ['sdk/canvas', 'sdk/design'],
    'container.js',
    async (page) => {
      const host = page.locator('#design-host')
      const canvas = host.locator('canvas')
      const controls = host.getByRole('group', { name: 'Design tools' })

      await page.evaluate(() => globalThis.ready)
      assert.equal(await canvas.count(), 1)
      assert.equal(await controls.getByRole('button').count(), 4)
      await page.waitForFunction(() => {
        const canvas = globalThis.host.querySelector('canvas')

        return (
          canvas.width === 360 &&
          canvas.height === canvas.clientHeight &&
          canvas.height > 100
        )
      })
      await host.evaluate((el) => {
        el.style.width = '480px'
      })
      await page.waitForFunction(
        () => globalThis.host.querySelector('canvas').width === 480
      )
      const bounds = await canvas.boundingBox()

      await page.mouse.move(bounds.x + 30, bounds.y + 30)
      await page.mouse.down()
      await page.mouse.move(bounds.x + 110, bounds.y + 80)
      await page.mouse.up()
      await controls.getByRole('button', { name: 'Select' }).click()
      await canvas.click({ position: { x: 55, y: 55 } })
      assert.equal(
        await page.evaluate(() => globalThis.editor.getSelection().length),
        1
      )
      await controls.getByRole('button', { name: 'Undo' }).click()
      assert.equal(
        await page.evaluate(
          async () =>
            (await globalThis.editor.save()).sceneTree.elements.workspace
              .children.length
        ),
        0
      )

      const results = await page.evaluate(async () => {
        const { host, editor, createDesign, original, duplicate } = globalThis

        await editor.destroy()
        const preserved =
          host.childNodes.length === 1 && host.firstChild === original
        let failed = false

        try {
          await createDesign(host, { toolbar: ['invalid'] })
        } catch {
          failed = true
        }

        const rolledBack =
          host.childNodes.length === 1 && host.firstChild === original
        const next = await createDesign(host, { toolbar: false })

        await editor.destroy()
        const remounted =
          !!host.querySelector('canvas') && !host.querySelector('fieldset')

        await next.destroy()

        return {
          duplicate: await duplicate,
          preserved,
          failed,
          rolledBack,
          remounted
        }
      })

      assert.deepEqual(results, {
        duplicate: true,
        preserved: true,
        failed: true,
        rolledBack: true,
        remounted: true
      })
    }
  )
})

test('opt-in design React component mounts and releases a packed editor', async () => {
  await withConsumer(
    [
      'sdk/canvas',
      'sdk/design',
      'node_modules/react',
      'node_modules/react-dom',
      'node_modules/scheduler',
      'node_modules/@types/react',
      'node_modules/csstype'
    ],
    'react.js',
    async (page) => {
      const host = page.locator('main > asyra-design')

      await host.getByRole('button', { name: 'Select' }).waitFor()
      const canvas = host.locator('canvas')

      assert.equal(await canvas.count(), 1)
      const bounds = await canvas.boundingBox()

      await page.mouse.move(bounds.x + 30, bounds.y + 30)
      await page.mouse.down()
      await page.mouse.move(bounds.x + 100, bounds.y + 75)
      await page.mouse.up()
      await host.getByRole('button', { name: 'Select' }).click()
      await canvas.click({ position: { x: 55, y: 50 } })
      assert.equal(
        await host.evaluate((el) => el.editor.getSelection().length),
        1
      )
      await host.getByRole('button', { name: 'Undo' }).click()
      assert.equal(
        await host.evaluate(
          async (el) =>
            (await el.editor.save()).sceneTree.elements.workspace.children
              .length
        ),
        0
      )
      await host.getByRole('button', { name: 'Redo' }).click()
      assert.equal(
        await host.evaluate(
          async (el) =>
            (await el.editor.save()).sceneTree.elements.workspace.children
              .length
        ),
        1
      )
      await page.evaluate(() => {
        globalThis.formerHost = globalThis.document.querySelector(
          'main > asyra-design'
        )
        globalThis.unmount()
      })
      await page.waitForFunction(
        () => !globalThis.formerHost.shadowRoot.querySelector('canvas')
      )
    }
  )
})

test('opt-in design element preserves a moved editor and serializes reconnects', async () => {
  await withConsumer(
    ['sdk/canvas', 'sdk/design'],
    'element.js',
    async (page) => {
      const board = page.locator('asyra-design')

      await board.getByRole('button', { name: 'Add card' }).click()
      assert.equal(
        await page.evaluate(
          async () =>
            (await globalThis.board.editor.save()).sceneTree.elements.workspace
              .children.length
        ),
        1
      )
      await board.getByRole('button', { name: 'Undo' }).click()
      assert.equal(
        await page.evaluate(
          async () =>
            (await globalThis.board.editor.save()).sceneTree.elements.workspace
              .children.length
        ),
        0
      )
      const moved = await page.evaluate(async () => {
        const { board, document } = globalThis
        const original = board.editor
        const parent = document.body.appendChild(
          document.createElement('section')
        )

        parent.append(board)
        await new Promise((resolve) =>
          globalThis.requestAnimationFrame(resolve)
        )

        return (
          board.editor === original &&
          board.shadowRoot.querySelectorAll('canvas').length === 1
        )
      })

      assert.equal(moved, true)
      await page.evaluate(async () => {
        const { board, document } = globalThis

        board.remove()
        await new Promise((resolve) => globalThis.setTimeout(resolve, 0))
        document.body.append(board)
      })
      await board.getByRole('button', { name: 'Add card' }).click()
      assert.equal(await board.locator('canvas').count(), 1)
      await page.evaluate(() => globalThis.board.remove())
      await page.waitForFunction(
        () =>
          !globalThis.board.shadowRoot.querySelector('canvas') &&
          !globalThis.board.editor
      )
      await page.evaluate(async () => {
        const board = globalThis.board

        globalThis.document.body.append(board)
        await Promise.resolve()
        if (!board.shadowRoot.querySelector('canvas')) {
          throw new Error('Expected pending editor startup')
        }

        board.remove()
      })
      await page.waitForFunction(
        () =>
          !globalThis.board.shadowRoot.querySelector('canvas') &&
          !globalThis.board.editor
      )
    }
  )
})
