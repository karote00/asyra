import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { URL, fileURLToPath } from 'node:url'
import test from 'node:test'
import { build, preview } from 'vite'
import { chromium } from 'playwright'
import { expect } from '@playwright/test'
import sharp from 'sharp'
import { withDocumentServices } from '../services.mjs'

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
  const headless = entry === 'headless.js'

  await cp(
    path.join(fixture, headless ? 'headless.html' : 'index.html'),
    path.join(cwd, 'index.html')
  )
  if (headless) {
    await cp(path.join(fixture, 'headless.css'), path.join(cwd, 'headless.css'))
  }

  if (entry === 'react.js') {
    await cp(path.join(fixture, 'examples'), path.join(cwd, 'examples'), {
      recursive: true
    })
  }

  await cp(
    path.join(fixture, entry),
    path.join(cwd, headless ? entry : 'main.js')
  )

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
            "const extended = await createDesign(document.body, { extensions: [{ actions: { badge: { label: 'Badge', run(tools) { tools.drawOval({ x: 0, y: 0, width: 10, height: 10 }) } } } }], toolbar: ['badge'], disabledFeatures: ['text', 'pen', 'badge'], hideUI: true })",
            "await extended.runAction('badge')",
            "const workspace = await createDesign(document.body, { toolbar: ['group', 'ungroup', 'deleteSelectedElement', 'zoomFit', 'reset'] })",
            "await workspace.runAction('zoomFit')",
            'workspace.deleteSelectedElement()',
            "const label = workspace.createText('Label', {x:0,y:0,width:50,height:20})",
            'workspace.setLayerLocked(label, false)',
            "workspace.observe('collaboration', state => state?.sync)",
            "workspace.updateStroke(label, 'stroke', {width:3, joinType:'round'})",
            'workspace.getPath(label)?.anchors.forEach(anchor => workspace.moveAnchor(label,anchor.id,anchor))',
            'await workspace.reset()',
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
      const workspace = host.frameLocator('iframe')
      const canvas = workspace.locator('canvas')

      await page.evaluate(() => globalThis.ready)
      assert.equal(await canvas.count(), 1)
      await workspace.getByTestId('tool-rectangle').click()
      await page.waitForFunction(
        () =>
          globalThis.host
            .querySelector('iframe')
            .contentDocument.querySelector('canvas').width === 360
      )
      await host.evaluate((el) => {
        el.style.width = '480px'
      })
      await page.waitForFunction(
        () =>
          globalThis.host
            .querySelector('iframe')
            .contentDocument.querySelector('canvas').width === 480
      )
      const bounds = await canvas.boundingBox()

      await page.mouse.move(bounds.x + 30, bounds.y + 70)
      await page.mouse.down()
      await page.mouse.move(bounds.x + 110, bounds.y + 130, { steps: 5 })
      await page.mouse.up()
      await workspace.getByTestId('tool-select').click()
      await canvas.click({ position: { x: 55, y: 95 } })
      assert.equal(
        await page.evaluate(() => globalThis.editor.getSelection().length),
        1
      )
      await workspace.getByRole('button', { name: 'Undo', exact: true }).click()
      assert.equal(
        await page.evaluate(
          async () =>
            Object.values(
              (await globalThis.editor.save()).sceneTree.elements
            ).filter((el) => el.type === 'rect').length
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
          !!host
            .querySelector('iframe')
            .contentDocument.querySelector('canvas') &&
          !host
            .querySelector('iframe')
            .contentDocument.querySelector('[data-testid=toolbar]')

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

      const workspace = host.frameLocator('iframe')

      await workspace.getByTestId('tool-rectangle').click()
      const canvas = workspace.locator('canvas')

      assert.equal(await canvas.count(), 1)
      const bounds = await canvas.boundingBox()

      await page.mouse.move(bounds.x + 340, bounds.y + 80)
      await page.mouse.down()
      await page.mouse.move(bounds.x + 410, bounds.y + 140, { steps: 5 })
      await page.mouse.up()
      await workspace.getByTestId('tool-select').click()
      await canvas.click({ position: { x: 360, y: 95 } })
      assert.equal(
        await host.evaluate((el) => el.editor.getSelection().length),
        1
      )

      const shapes = () =>
        host.evaluate(
          async (el) =>
            Object.values((await el.editor.save()).sceneTree.elements).filter(
              (el) => el.type === 'rect'
            ).length
        )

      await workspace.getByRole('button', { name: 'Undo', exact: true }).click()
      await expect.poll(shapes).toBe(0)
      await workspace.getByRole('button', { name: 'Redo', exact: true }).click()
      await expect.poll(shapes).toBe(1)
      await page.evaluate(() => {
        globalThis.formerHost = globalThis.document.querySelector(
          'main > asyra-design'
        )
        globalThis.unmount()
      })
      await page.waitForFunction(
        () => !globalThis.formerHost.shadowRoot.querySelector('iframe')
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

      const workspace = board.frameLocator('iframe')

      const count = () =>
        board.evaluate(
          async (el) =>
            Object.values((await el.editor.save()).sceneTree.elements).filter(
              (el) => el.type === 'rect'
            ).length
        )

      await workspace.getByRole('button', { name: 'Add card' }).click()
      await expect.poll(count).toBe(1)
      const moved = await board.evaluate((el) => {
        const original = el.editor
        const parent = globalThis.document.body.appendChild(
          globalThis.document.createElement('section')
        )

        parent.moveBefore(el, null)

        return el.editor === original
      })

      assert.equal(moved, true)
      await workspace.getByRole('button', { name: 'Undo' }).click()
      await expect.poll(count).toBe(0)
      await workspace.getByRole('button', { name: 'Add card' }).click()
      await expect.poll(count).toBe(1)
      await board.evaluate((el) => {
        globalThis.prior = el.editor
        globalThis.document.body.append(el)
      })
      assert.equal(
        await board.evaluate((el) => el.editor === globalThis.prior),
        true,
        'DOM move replaced the editor'
      )
      await workspace.getByRole('button', { name: 'Add card' }).waitFor()
      await expect.poll(count).toBe(1)
      await page.evaluate(async () => {
        const { board, document } = globalThis

        board.remove()
        await new Promise((resolve) => globalThis.setTimeout(resolve, 0))
        document.body.append(board)
      })
      await workspace.getByRole('button', { name: 'Add card' }).click()
      await expect.poll(count).toBe(1)
      await page.evaluate(() => globalThis.board.remove())

      const released = () =>
        page.waitForFunction(
          () =>
            !globalThis.board.shadowRoot.querySelector('iframe') &&
            !globalThis.board.editor
        )

      await released()
      await page.evaluate(async () => {
        const { board, document } = globalThis

        document.body.append(board)
        await Promise.resolve()
        if (!board.shadowRoot.querySelector('iframe')) {
          throw new Error('Expected pending startup')
        }

        board.remove()
      })
      await released()
    }
  )
})

test('opt-in design fits the parent panel and defaults to the viewport', async () => {
  await withConsumer(
    ['sdk/canvas', 'sdk/design'],
    'sizing.js',
    async (page) => {
      const panel = page.locator('main')
      const editor = panel.locator('asyra-design')

      await editor.frameLocator('iframe').getByTestId('tool-select').waitFor()

      async function fits(width, height) {
        await page.waitForFunction(
          ([width, height]) => {
            const editor = globalThis.document.querySelector('asyra-design')
            const canvas = editor.shadowRoot
              .querySelector('iframe')
              .contentDocument.querySelector('canvas')

            return (
              editor.clientWidth === width &&
              editor.clientHeight === height &&
              canvas.width === width &&
              canvas.height === height &&
              canvas.height === canvas.clientHeight
            )
          },
          [width, height],
          { timeout: 2500 }
        )
      }

      await page.setViewportSize({ width: 820, height: 620 })
      await fits(820, 620)
      assert.deepEqual(await editor.boundingBox(), {
        x: 0,
        y: 0,
        width: 820,
        height: 620
      })
      const noOverflow = await page.evaluate(() => {
        const doc = globalThis.document.documentElement

        return (
          doc.scrollWidth === doc.clientWidth &&
          doc.scrollHeight === doc.clientHeight
        )
      })

      assert.ok(noOverflow)
      await page.setViewportSize({ width: 640, height: 510 })
      await fits(640, 510)

      await panel.evaluate((el) => {
        el.style.cssText = 'width:470px;height:290px;padding:12px'
      })
      await fits(470, 290)
      await panel.evaluate((el) => {
        el.style.cssText = 'width:320px;height:190px;display:grid'
      })
      await fits(320, 190)
      await page.setViewportSize({ width: 750, height: 480 })
      await fits(320, 190)
      await panel.evaluate((el) => {
        el.style.cssText = 'width:360px'
      })
      await fits(360, 480)

      await page.evaluate(() => {
        globalThis.document.body.style.margin = '20px'
        globalThis.document.querySelector('main').removeAttribute('style')
      })
      await fits(710, 480)
      assert.equal((await editor.boundingBox()).x, 20)

      // A normal application page keeps its page margins. Grid allocates the
      // second row to the editor independently of the toolbar in its shadow.
      await panel.evaluate((el) => {
        globalThis.document.body.style.removeProperty('margin')
        el.style.cssText =
          'width:400px;height:280px;display:grid;grid-template-rows:50px 1fr'
        el.prepend(globalThis.document.createElement('header'))
      })
      await fits(400, 230)
      assert.equal((await editor.boundingBox()).x, 8)
      await panel.evaluate((el) => {
        el.style.cssText =
          'width:400px;height:260px;display:flex;flex-direction:column'
        el.firstElementChild.style.flex = '0 0 40px'
      })
      await fits(400, 220)
    }
  )
})

test('packed Design workspace edits with the Design app tools, panels and document history', async () => {
  await withConsumer(
    ['sdk/canvas', 'sdk/design'],
    'workspace.js',
    async (page) => {
      const workspace = page.frameLocator('main iframe')

      await page.evaluate(() => globalThis.ready)

      const types = () =>
        page.evaluate(async () =>
          Object.values(
            (await globalThis.editor.save()).sceneTree.elements
          ).map((el) => el.type)
        )

      for (const id of [
        'contents-panel',
        'properties-panel',
        'tool-select',
        'tool-rectangle',
        'tool-oval',
        'tool-pen',
        'tool-text',
        'zoom-level'
      ]) {
        await workspace.getByTestId(id).waitFor()
      }

      assert.equal(
        await workspace.getByTestId('ai-agent-toolbar-button').count(),
        0
      )
      const frame = await page.locator('main iframe').boundingBox()

      const click = (x, y) => page.mouse.click(frame.x + x, frame.y + y)

      const drag = async (x, y, endX, endY) => {
        await page.mouse.move(frame.x + x, frame.y + y)
        await page.mouse.down()
        await page.mouse.move(frame.x + endX, frame.y + endY, { steps: 6 })
        await page.mouse.up()
      }

      await workspace.getByTestId('tool-oval').click()
      await drag(380, 180, 465, 238)
      assert.ok((await types()).includes('oval'))
      await workspace.getByTestId('tool-select').click()
      await click(418, 203)
      const width = workspace.getByTestId('prop-width')

      await width.fill('115')
      await width.press('Enter')
      assert.equal(Number(await width.inputValue()), 115)
      await workspace.getByTestId('prop-stroke-add').click()
      await workspace.getByTestId('prop-fill-color-picker-0-trigger').click()
      await workspace.getByTestId('prop-fill-mode-gradient-0').click()
      await workspace
        .getByTestId('prop-fill-gradient-type-0')
        .selectOption('radial')
      await workspace.getByTestId('prop-fill-color-picker-0-trigger').click()
      assert.match(
        await page.evaluate(async () =>
          JSON.stringify(await globalThis.editor.save())
        ),
        /"gradientType":"radial"/
      )
      await workspace.getByTestId('tool-text').click()
      await click(400, 280)
      const text = workspace.getByRole('textbox', {
        name: 'Canvas text editor'
      })

      await text.fill('Embedded workspace')
      await text.press('Control+Enter')
      assert.ok((await types()).includes('text'))
      await page.evaluate(() => globalThis.editor.undo())
      assert.ok(!(await types()).includes('text'))
      await page.evaluate(() => globalThis.editor.redo())
      await workspace.getByTestId('tool-pen').click()
      await click(380, 380)
      await click(450, 390)
      await click(430, 425)
      await page.keyboard.press('Escape')
      assert.ok((await types()).includes('vector'))
      const restored = await page.evaluate(async () => {
        const saved = await globalThis.editor.save()

        await globalThis.editor.destroy()
        globalThis.editor = await globalThis.createDesign(globalThis.host, {
          document: saved
        })

        return globalThis.editor.save()
      })

      assert.match(JSON.stringify(restored), /Embedded workspace/)
      await page.locator('main iframe').screenshot({
        path: path.join(root, 'tmp/canvas/packed-design-workspace.png')
      })
      assert.ok((await types()).includes('vector'))
    }
  )
})

test('packed Design workspaces use the app collaboration transport and durable document service', async () => {
  await withConsumer(
    ['sdk/canvas', 'sdk/design'],
    'workspace.js',
    async (page, directory) => {
      const origin = new URL(page.url()).origin

      await withDocumentServices(
        directory,
        origin,
        async (endpoint, storage) => {
          const open = async (client) => {
            await client.goto(origin)
            await client.evaluate(async (endpoint) => {
              await globalThis.ready
              await globalThis.editor.destroy()
              globalThis.editor = await globalThis.createDesign(
                globalThis.host,
                {
                  hideUI: true,
                  collaboration: { fileId: 'shared-board', endpoint }
                }
              )
            }, endpoint)
          }

          const peer = await page.context().browser().newPage()

          try {
            await open(page)
            await open(peer)
            const id = await page.evaluate(() =>
              globalThis.editor.drawOval({
                x: 20,
                y: 25,
                width: 80,
                height: 50
              })
            )

            const hasShapeForId = (client, id) =>
              client.evaluate(
                async (id) =>
                  (await globalThis.editor.save()).sceneTree.elements[id]?.type,
                id
              )

            await expect
              .poll(() => hasShapeForId(peer, id), { timeout: 12000 })
              .toBe('oval')
            await expect
              .poll(
                async () => {
                  const response = await globalThis.fetch(
                    storage + '/api/documents/shared-board/bootstrap-checkpoint'
                  )
                  const { checkpoint } = await response.json()

                  return checkpoint?.sceneTree.elements[id]?.type
                },
                { timeout: 12000 }
              )
              .toBe('oval')
            // Simulate a local storage quota failure at the browser storage boundary.
            await page
              .frameLocator('main iframe')
              .locator('body')
              .evaluate(() => {
                const put = globalThis.IDBObjectStore.prototype.put

                globalThis.IDBObjectStore.prototype.put = function (...args) {
                  if (
                    this.transaction.db.name === 'collaboration-publications'
                  ) {
                    throw new globalThis.DOMException(
                      'Storage quota exhausted',
                      'QuotaExceededError'
                    )
                  }

                  return put.apply(this, args)
                }

                globalThis.restoreStorage = () => {
                  globalThis.IDBObjectStore.prototype.put = put
                }
              })
            const unsaved = await page.evaluate(() => {
              globalThis.editor.observe('collaboration', (state) => {
                globalThis.syncState = state
              })

              return globalThis.editor.createText('Recover me', {
                x: 10,
                y: 10,
                width: 100,
                height: 50
              })
            })

            await expect
              .poll(() =>
                page.evaluate(() => globalThis.syncState?.recoveryAvailable)
              )
              .toBe(true)
            const downloaded = page.waitForEvent('download')

            await page.evaluate(() => globalThis.editor.downloadRecoveryFile())
            const file = await downloaded

            assert.equal(file.suggestedFilename(), 'document-recovery.json')
            const recovered = JSON.parse(
              await readFile(await file.path(), 'utf8')
            )

            assert.ok(recovered.sceneTree.elements[unsaved])
            await assert.rejects(
              page.evaluate(() => globalThis.editor.retrySaving()),
              /persist|stor/i
            )
            await page
              .frameLocator('main iframe')
              .locator('body')
              .evaluate(() => globalThis.restoreStorage())
            await page.evaluate(() => globalThis.editor.retrySaving())
            await expect
              .poll(() => hasShapeForId(peer, unsaved), { timeout: 12000 })
              .toBe('text')
            assert.equal(
              await page.evaluate(
                () =>
                  globalThis.editor.getCollaborationState()
                    .recoveryAvailable === true
              ),
              false
            )
            await peer.evaluate(() => globalThis.editor.destroy())
            await page.evaluate(() => globalThis.editor.destroy())
            await open(peer)
            await expect.poll(() => hasShapeForId(peer, id)).toBe('oval')
          } finally {
            await peer.close()
          }
        }
      )
    }
  )
})

test('packed Design actions edit and group through the app with isolated histories', async () => {
  await withConsumer(
    ['sdk/canvas', 'sdk/design'],
    'workspace.js',
    async (page) => {
      await page.evaluate(async () => {
        await globalThis.ready
        const panel = globalThis.document.body.appendChild(
          globalThis.document.createElement('section')
        )

        panel.style.height = '360px'
        globalThis.custom = await globalThis.createDesign(panel, {
          panels: { layers: false, properties: false },
          toolbar: ['group', 'undo', 'redo'],
          extensions: [
            {
              actions: {
                group: {
                  label: 'Insert badge',

                  run(tools) {
                    const id = tools.drawOval({
                      x: 12,
                      y: 16,
                      width: 90,
                      height: 36
                    })

                    tools.updateElement({
                      elementId: id,
                      name: 'Status badge',
                      fillColor: '#ff5500'
                    })
                    tools.select([id])
                  }
                }
              }
            }
          ]
        })
      })
      const custom = page.frameLocator('section iframe')

      await custom.getByRole('button', { name: 'Insert badge' }).click()
      assert.equal(await custom.getByTestId('contents-panel').count(), 0)
      assert.equal(await custom.getByTestId('properties-panel').count(), 0)
      const results = await page.evaluate(async () => {
        const { custom, editor } = globalThis
        const [badge] = custom.getSelection()
        const rect = custom.drawRectangle({
          x: 15,
          y: 22,
          width: 20,
          height: 20
        })

        custom.select([badge, rect])
        const group = custom.group()
        const grouped = await custom.save()
        const children = custom.ungroup()

        await custom.undo()
        const restored = await custom.save()

        await custom.destroy()
        const other = await editor.save()

        return {
          group,
          children,
          grouped: grouped.sceneTree.elements[group]?.children,
          name: restored.sceneTree.elements[badge]?.name,
          restored: restored.sceneTree.elements[group]?.children,
          unrelated: Object.values(other.sceneTree.elements).filter(
            (el) => el.type !== 'workspace'
          ).length
        }
      })

      assert.ok(results.group)
      assert.equal(results.children.length, 2)
      assert.deepEqual(results.children, results.grouped)
      assert.deepEqual(results.restored, results.grouped)
      assert.equal(results.name, 'Status badge')
      assert.equal(results.unrelated, 0)
    }
  )
})

test('packed Design toolbar actions use the app selection, viewport, history and reset', async () => {
  await withConsumer(
    ['sdk/canvas', 'sdk/design'],
    'workspace.js',
    async (page) => {
      const commands = [
        'group',
        'ungroup',
        'deleteSelectedElement',
        'zoomFit',
        'reset'
      ]
      const [rect, oval] = await page.evaluate(async (toolbar) => {
        await globalThis.ready
        await globalThis.editor.destroy()
        const editor = await globalThis.createDesign(globalThis.host, {
          toolbar
        })

        globalThis.editor = editor
        const a = editor.drawRectangle({ x: 20, y: 20, width: 30, height: 30 })
        const b = editor.drawOval({ x: 2000, y: 1000, width: 60, height: 60 })

        editor.select([a, b])

        return [a, b]
      }, commands)
      const frame = page.frameLocator('main iframe')

      const button = (name) => frame.getByRole('button', { name, exact: true })

      const selection = () =>
        page.evaluate(() => globalThis.editor.getSelection())

      const elements = () =>
        page.evaluate(
          async () => (await globalThis.editor.save()).sceneTree.elements
        )

      await button('Zoom to fit').click()
      await expect
        .poll(async () =>
          Number(
            await frame.getByTestId('zoom-level').getAttribute('data-value')
          )
        )
        .toBeLessThan(1)
      await button('Group').click()
      const [group] = await selection()

      assert.deepEqual((await elements())[group].children, [rect, oval])
      await button('Ungroup').click()
      assert.deepEqual(await selection(), [rect, oval])
      await page.evaluate((id) => globalThis.editor.select([id]), oval)
      await button('Delete selection').click()
      assert.equal((await elements())[oval], undefined)
      await page.evaluate(() => globalThis.editor.undo())
      assert.ok((await elements())[oval])
      await page.evaluate(() => globalThis.editor.runAction('reset'))
      assert.deepEqual(
        Object.values(await elements()).filter(
          (element) => element.type !== 'workspace'
        ),
        []
      )
      assert.deepEqual(await selection(), [])
      await button('Zoom to fit').waitFor()

      await page.evaluate(async (ids) => {
        await globalThis.editor.destroy()

        globalThis.editor = await globalThis.createDesign(globalThis.host, {
          toolbar: ids,
          disabledFeatures: ids
        })
      }, commands)
      assert.equal(
        await frame
          .getByTestId('toolbar')
          .getByRole('button', { name: 'Reset document' })
          .count(),
        0
      )
      const errors = await page.evaluate(
        (ids) =>
          Promise.all(
            ids.map(async (id) => {
              try {
                await globalThis.editor.runAction(id)
              } catch (error) {
                return error.message
              }
            })
          ),
        commands
      )

      assert.deepEqual(
        errors,
        commands.map((id) => 'Disabled Design feature: ' + id)
      )
    }
  )
})

test('packed Design disabled features guard gestures, shortcuts and API while saved content renders', async () => {
  await withConsumer(
    ['sdk/canvas', 'sdk/design'],
    'workspace.js',
    async (page) => {
      await page.evaluate(() => globalThis.ready)
      const frame = page.frameLocator('main iframe')
      const canvas = frame.locator('canvas').first()

      const click = (x, y) => canvas.click({ position: { x, y } })

      await frame.getByTestId('tool-text').click()
      await click(410, 270)
      const inline = frame.getByRole('textbox', { name: 'Canvas text editor' })

      await inline.fill('Visible saved text')
      await inline.press('Control+Enter')
      await frame.getByTestId('tool-pen').click()
      await click(420, 395)
      await click(470, 430)
      await page.keyboard.press('Escape')
      await page.keyboard.press('Escape')
      await page.evaluate(() => globalThis.editor.setTool('select'))
      await page.evaluate(() => globalThis.editor.select([]))
      await page.mouse.move(0, 0)
      // Reopen both variants from identical serialized content and viewport state.
      await page.evaluate(async () => {
        globalThis.savedPolicyExample = await globalThis.editor.save()
        await globalThis.editor.destroy()
        globalThis.editor = await globalThis.createDesign(globalThis.host, {
          document: globalThis.savedPolicyExample
        })
      })

      const fit = async () => {
        await frame.getByTestId('canvas-host').focus()
        await page.keyboard.press('Control+1')
        await page.mouse.move(0, 0)
      }

      await fit()
      const area = { x: 247, y: 52, width: 348, height: 650 }

      const sample = async () =>
        sharp(await canvas.screenshot())
          .extract({
            left: area.x,
            top: area.y,
            width: area.width,
            height: area.height
          })
          .png()
          .toBuffer()

      // Capture after the renderer has painted and compare the same content after load.
      await canvas.evaluate(
        () =>
          new Promise((resolve) =>
            globalThis.requestAnimationFrame(() =>
              globalThis.requestAnimationFrame(resolve)
            )
          )
      )
      const before = await sample()
      const pixels = await sharp(before).removeAlpha().raw().toBuffer()

      const paintedPoint = (top, bottom) => {
        for (let y = top; y < bottom; y++) {
          for (let x = 0; x < area.width; x++) {
            if (pixels[(y * area.width + x) * 3] > 150) {
              return { x: area.x + x, y: area.y + y }
            }
          }
        }

        throw new Error('Expected visible document content')
      }

      const textPoint = paintedPoint(0, 300)
      const vectorPoint = paintedPoint(300, area.height)

      await canvas.screenshot({
        path: path.join(root, 'tmp/canvas/packed-feature-reference.png')
      })

      await page.evaluate(async () => {
        const saved = globalThis.savedPolicyExample

        await globalThis.editor.destroy()
        globalThis.editor = await globalThis.createDesign(globalThis.host, {
          document: saved,
          disabledFeatures: ['pen', 'text', 'oval', 'undo', 'group', 'custom'],
          actions: {
            custom: {
              label: 'Custom',

              run() {
                throw new Error('Callback invoked')
              }
            }
          }
        })
      })
      await fit()
      await canvas.evaluate(
        () =>
          new Promise((resolve) =>
            globalThis.requestAnimationFrame(() =>
              globalThis.requestAnimationFrame(resolve)
            )
          )
      )
      await expect.poll(async () => (await sample()).equals(before)).toBe(true)
      await canvas.screenshot({
        path: path.join(root, 'tmp/canvas/packed-feature-restricted.png')
      })
      for (const tool of ['text', 'pen', 'oval']) {
        assert.equal(await frame.getByTestId('tool-' + tool).count(), 0)
      }

      assert.equal(
        await frame
          .getByRole('button', { name: 'Custom', exact: true })
          .count(),
        0
      )
      await click(440, 340)
      for (const key of ['p', 't', 'o']) {
        await page.keyboard.press(key)
        assert.equal(
          await page.evaluate(() => globalThis.editor.getTool()),
          'select'
        )
      }

      const ids = await page.evaluate(async () =>
        Object.fromEntries(
          Object.values(
            (await globalThis.editor.save()).sceneTree.elements
          ).map((item) => [item.type, item.id])
        )
      )

      await page.evaluate(
        (ids) => globalThis.editor.select([ids.text, ids.vector]),
        ids
      )
      await canvas.click({ button: 'right', position: textPoint })
      await frame.getByRole('menu').waitFor()
      assert.equal(
        await frame
          .getByRole('menuitem', { name: 'Group selected layers', exact: true })
          .count(),
        0
      )
      await page.keyboard.press('Escape')
      await frame.getByTestId('canvas-host').focus()
      await page.keyboard.press('Control+g')
      await page.keyboard.press('Meta+g')
      assert.equal(
        await page.evaluate(async () =>
          Object.values(
            (await globalThis.editor.save()).sceneTree.elements
          ).some((el) => el.type === 'group')
        ),
        false
      )
      await page.evaluate((id) => globalThis.editor.select([id]), ids.text)
      await canvas.dblclick({ position: textPoint })
      assert.equal(await inline.count(), 0)
      assert.equal(
        await frame.getByRole('region', { name: 'Typography' }).count(),
        0
      )
      const rejected = await page.evaluate(async (id) => {
        const e = globalThis.editor
        const operations = [
          () => e.setTool('text'),
          () => e.drawOval({ x: 0, y: 0, width: 20, height: 10 }),
          () => e.undo(),
          () => e.group(),
          () => e.runAction('custom'),
          () =>
            e.updateElement({
              elementId: id,
              name: 'Partial edit',
              properties: { fontSize: 32 }
            })
        ]

        return Promise.all(
          operations.map(async (run) => {
            try {
              await run()

              return false
            } catch (error) {
              return error.message.startsWith('Disabled Design feature:')
            }
          })
        )
      }, ids.text)

      assert.deepEqual(rejected, Array(6).fill(true))
      await page.evaluate((id) => globalThis.editor.select([id]), ids.vector)
      await page.keyboard.press('Escape')
      assert.deepEqual(
        await page.evaluate(() => globalThis.editor.getSelection()),
        []
      )
      await page.evaluate((id) => globalThis.editor.select([id]), ids.vector)
      await page.keyboard.press('Enter')
      await canvas.dblclick({ position: vectorPoint })
      assert.deepEqual(
        await page.evaluate(() => globalThis.editor.getSelection()),
        [ids.vector]
      )
      // Outside path editing Delete removes the element. Inside it, Delete only edits an anchor.
      await page.keyboard.press('Backspace')
      assert.equal(
        await page.evaluate(
          async (id) =>
            Object.hasOwn(
              (await globalThis.editor.save()).sceneTree.elements,
              id
            ),
          ids.vector
        ),
        false
      )
      await page.evaluate(async () => {
        const saved = await globalThis.editor.save()

        await globalThis.editor.destroy()
        globalThis.editor = await globalThis.createDesign(globalThis.host, {
          document: saved,
          hideUI: true
        })
      })
      for (const id of ['toolbar', 'contents-panel', 'properties-panel']) {
        assert.equal(await frame.getByTestId(id).count(), 0)
      }

      await canvas.click({ button: 'right', position: { x: 420, y: 395 } })
      assert.equal(await frame.getByRole('menu').count(), 0)
      await click(700, 310)
      await page.keyboard.press('r')
      assert.equal(
        await page.evaluate(() => globalThis.editor.getTool()),
        'rectangle'
      )
    }
  )
})

test('packed Design borrowed canvas guards its own pointer, history and action paths', async () => {
  await withConsumer(
    ['sdk/canvas', 'sdk/design'],
    'design.js',
    async (page) => {
      await page.evaluate(() => globalThis.ready)
      const canvas = page.locator('#first')

      await page.evaluate(async () => {
        await globalThis.editor.destroy()
        globalThis.editor = await globalThis.createDesign(
          globalThis.document.querySelector('#first'),
          {
            hideUI: true,
            disabledFeatures: ['rectangle', 'select', 'undo', 'redo']
          }
        )
      })
      assert.equal(
        await page.getByRole('group', { name: 'Design tools' }).count(),
        0
      )
      assert.equal(await page.evaluate(() => globalThis.editor.getTool()), null)
      const bounds = await canvas.boundingBox()

      await page.mouse.move(bounds.x + 15, bounds.y + 15)
      await page.mouse.down()
      await page.mouse.move(bounds.x + 80, bounds.y + 65)
      await page.mouse.up()
      await canvas.press('Control+z')
      assert.equal(
        await page.evaluate(async () =>
          Object.values(
            (await globalThis.editor.save()).sceneTree.elements
          ).some((el) => el.type === 'rect')
        ),
        false
      )
      for (const id of ['rectangle', 'select', 'undo', 'redo']) {
        await assert.rejects(
          page.evaluate((id) => globalThis.editor.runAction(id), id),
          /Disabled Design feature/
        )
      }

      await assert.rejects(
        page.evaluate(() =>
          globalThis.editor.drawRectangle({ x: 1, y: 1, width: 10, height: 10 })
        ),
        /Disabled Design feature/
      )
    }
  )
})

test('packed Design command availability is isolated per workspace and direction', async () => {
  await withConsumer(
    ['sdk/canvas', 'sdk/design'],
    'workspace.js',
    async (page) => {
      await page.evaluate(() => globalThis.ready)
      const result = await page.evaluate(async () => {
        const second = globalThis.document.createElement('aside')

        second.style.cssText = 'height:720px;width:100%'
        globalThis.host.after(second)
        const restricted = await globalThis.createDesign(second, {
          disabledFeatures: [
            'select',
            'rectangle',
            'redo',
            'ungroup',
            'reset',
            'geometry',
            'strokes',
            'fills',
            'lock',
            'visibility',
            'rename'
          ]
        })
        const bounds = { x: 10, y: 20, width: 28, height: 36 }
        const initial = restricted.getTool()
        const shape = restricted.drawOval(bounds)
        const original = globalThis.editor.drawRectangle(bounds)
        const failures = []

        for (const run of [
          () => restricted.runAction('rectangle'),
          () => restricted.runAction('redo'),
          () => restricted.select([shape]),
          () => restricted.drawRectangle(bounds),
          () => restricted.redo(),
          () => restricted.ungroup(),
          () =>
            restricted.updateElement({ elementId: shape, name: 'New name' }),
          () =>
            restricted.updateElement({
              elementId: shape,
              properties: { width: 120 }
            }),
          () =>
            restricted.updateElement({
              elementId: shape,
              fillColor: '#ffffff'
            }),
          () =>
            restricted.updateElement({
              elementId: shape,
              strokeColor: '#ffffff'
            })
        ]) {
          try {
            await run()
          } catch (error) {
            failures.push(error.message)
          }
        }

        globalThis.restricted = restricted

        return {
          initial,
          shape,
          failures,
          independent: !!(await globalThis.editor.save()).sceneTree.elements[
            original
          ],
          enabledOval: !!(await restricted.save()).sceneTree.elements[shape]
        }
      })

      assert.equal(result.initial, null)
      assert.equal(
        result.failures.filter((message) =>
          message.startsWith('Disabled Design feature:')
        ).length,
        10
      )
      assert.ok(result.independent && result.enabledOval)
      const frame = page.frameLocator('aside iframe')

      for (const id of ['tool-select', 'tool-rectangle', 'reset-button']) {
        assert.equal(await frame.getByTestId(id).count(), 0)
      }

      await frame.getByTestId('element-item-' + result.shape).click()
      assert.deepEqual(
        await page.evaluate(() => globalThis.restricted.getSelection()),
        []
      )
      await frame.getByTestId('tool-oval').click()
      assert.equal(
        await page.evaluate(() => globalThis.restricted.getTool()),
        'oval'
      )
      await frame.locator('canvas').first().press('r')
      await frame.locator('canvas').first().press('v')
      assert.equal(
        await page.evaluate(() => globalThis.restricted.getTool()),
        'oval'
      )
      await page.evaluate(() => globalThis.restricted.undo())
      assert.equal(
        await page.evaluate(async () =>
          Object.values(
            (await globalThis.restricted.save()).sceneTree.elements
          ).some((item) => item.type === 'oval')
        ),
        false
      )
      await frame.locator('canvas').first().press('Control+Shift+z')
      assert.equal(
        await page.evaluate(async () =>
          Object.values(
            (await globalThis.restricted.save()).sceneTree.elements
          ).some((item) => item.type === 'oval')
        ),
        false
      )
    }
  )
})

test('packed Design headless editing uses only host controls and the public tools', async () => {
  await withConsumer(
    ['sdk/canvas', 'sdk/design'],
    'headless.js',
    async (page) => {
      await page.evaluate(() => globalThis.ready)
      await expect(
        page.frameLocator('iframe').getByTestId('toolbar')
      ).toHaveCount(0)
      await page.getByRole('button', { name: 'Insert label' }).click()
      const text = await page.locator('output').textContent()

      assert.ok(text)
      await page.getByRole('button', { name: 'Draw line' }).click()
      await page.getByRole('button', { name: 'Undo' }).click()
      await expect(page.locator('main')).toHaveJSProperty('inert', false)
      const result = await page.evaluate(async (text) => {
        const e = globalThis.editor
        const textValue = e.getElementProperties(text, ['text']).text
        const restored = e.getLayers().ids
        const rect = e.drawRectangle({ x: 620, y: 520, width: 70, height: 40 })

        e.moveElements({ [rect]: { x: 320, y: 120 } })
        e.selectArea({ x: 310, y: 110, width: 90, height: 65 })
        const areaSelection = e.getSelection()
        let hovered
        const off = e.observe('hoveredElementId', (value) => {
          hovered = value
        })

        e.setHoveredElement(rect)
        off()
        e.setHoveredElement(null)
        e.select([text, rect])
        const group = e.group()

        e.moveLayers({
          elementIds: [rect],
          targetParentId: e.getLayers().workspaceId,
          targetIndex: 0
        })
        const root = e.getLayers().workspaceId
        const parent = e.getLayers().elements[rect].parentId

        e.setLayerVisible(rect, false)
        e.setLayerLocked(rect, true)
        const flags = e.getLayers().elements[rect]

        e.setLayerLocked(rect, false)
        e.setLayerVisible(rect, true)
        const fill = e.addFill(rect)
        const gradient = {
          gradientType: 'radial',
          gradientStops: [
            { position: 0, color: '#112233', opacity: 1 },
            { position: 1, color: '#ddeeff', opacity: 1 }
          ],
          gradientHandles: [
            { x: 0, y: 0 },
            { x: 1, y: 1 }
          ]
        }

        e.updateFill(rect, fill, { kind: 'gradient', gradient })
        e.setActiveGradient(rect, fill)
        const handles = e.getGradientHandles(rect, fill)

        e.moveGradientHandle(rect, fill, 1, {
          x: handles[1].x + 10,
          y: handles[1].y
        })
        const stroke = e.addStroke(rect)

        e.updateStroke(rect, stroke, {
          width: 6,
          style: 'dashed',
          dash: 4,
          gap: 3,
          joinType: 'round'
        })
        const appearance = e.getElementProperties(rect, ['fills', 'strokes'])

        e.removeFill(rect, fill)
        e.removeStroke(rect, stroke)
        const removed = e.getElementProperties(rect, ['fills', 'strokes'])

        e.zoomTo(1.5, { x: 0, y: 0 })
        let observedPosition
        const stopPan = e.observe('viewportPosition', (value) => {
          observedPosition = value
        })

        e.panTo({ x: 16, y: 24 })
        stopPan()
        const viewport = e.getViewport()
        const path = e.createPath([
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 }
        ])
        const { anchors, segments } = e.getPath(path)

        e.editPath(path)
        e.selectPathPoint(path, anchors[0].id)
        e.selectPathSegment(path, Object.keys(segments)[0])
        e.editPath(null)
        const added = e.appendAnchor(path, { x: 0, y: 100 })

        e.moveAnchor(path, added, { x: 5, y: 110 })
        const moved = e.getPath(path).anchors.find((a) => a.id === added)
        const segment = Object.values(segments)[0].id
        const split = e.splitSegment(path, segment, { x: 50, y: 0 })

        e.setAnchorType(path, split, 'smooth')
        e.setHandleMode(path, split, 'mirror-angle')
        e.moveHandle(path, split, 'outHandle', { x: 65, y: 10 })
        const controlled = e.getPath(path).anchors.find((a) => a.id === split)

        e.removeAnchor(path, split)
        await e.undo()
        const undoSplitRemoval = e
          .getPath(path)
          .anchors.some((a) => a.id === split)

        e.setPathClosed(path, true)
        const closed = Object.values(e.getPath(path).networks).some(
          (n) => n.closed
        )
        let zoomEvents = 0
        const stop = e.observe('zoom', () => {
          zoomEvents++
        })
        const beforeReset = zoomEvents
        const saved = await e.save()

        await e.reset()
        e.zoomTo(2, { x: 0, y: 0 })
        stop()

        return {
          textValue,
          restored,
          areaSelection,
          hovered,
          group,
          rect,
          parent,
          root,
          flags,
          appearance,
          removed,
          fill,
          stroke,
          viewport,
          observedPosition,
          anchors: anchors.length,
          added,
          moved,
          controlled,
          undoSplitRemoval,
          closed,
          saved,
          resubscribed: zoomEvents >= beforeReset + 2
        }
      }, text)

      assert.equal(result.textValue, 'Custom UI')
      assert.deepEqual(result.restored, [text])
      assert.deepEqual(result.areaSelection, [result.rect])
      assert.equal(result.hovered, result.rect)
      assert.ok(result.group)
      assert.equal(result.parent, result.root)
      assert.equal(result.flags.lock, true)
      assert.equal(result.flags.visible, false)
      assert.equal(
        result.appearance.fills.find((f) => f.id === result.fill).gradient
          .gradientStops[1].color,
        '#ddeeff'
      )
      assert.equal(
        result.appearance.strokes.find((s) => s.id === result.stroke).width,
        6
      )
      assert.ok(!result.removed.fills.some((f) => f.id === result.fill))
      assert.ok(!result.removed.strokes.some((s) => s.id === result.stroke))
      assert.deepEqual(result.viewport, {
        position: { x: 16, y: 24 },
        scale: 1.5
      })
      assert.deepEqual(result.observedPosition, result.viewport.position)
      assert.equal(result.anchors, 3)
      assert.deepEqual([result.moved.x, result.moved.y], [5, 110])
      assert.deepEqual(result.controlled.outHandle, { x: 65, y: 10 })
      assert.ok(result.closed && result.undoSplitRemoval && result.resubscribed)

      const blocked = await page.evaluate(async ({ saved, rect }) => {
        await globalThis.editor.destroy()
        const disabledFeatures = [
          'text',
          'pen',
          'moveLayerHierarchy',
          'moveElements',
          'lock',
          'visibility',
          'fills',
          'strokes',
          'zoom',
          'pan',
          'select',
          'hoverElement'
        ]
        const e = await globalThis.createDesign(globalThis.host, {
          hideUI: true,
          document: saved,
          disabledFeatures
        })
        const point = { x: 10, y: 10 }
        const bounds = { ...point, width: 20, height: 30 }
        const attempts = {
          text: () => e.createText('Blocked', bounds),

          pen: () => e.createPath([point]),

          moveLayerHierarchy: () =>
            e.moveLayers({
              elementIds: [rect],
              targetParentId: e.getLayers().workspaceId,
              targetIndex: 0
            }),

          moveElements: () => e.moveElements({ [rect]: point }),

          lock: () => e.setLayerLocked(rect, true),

          visibility: () => e.setLayerVisible(rect, false),

          fills: () => e.addFill(rect),

          strokes: () => e.addStroke(rect),

          zoom: () => e.zoomTo(3, point),

          pan: () => e.panTo(point),

          select: () => e.selectArea(bounds),

          hoverElement: () => e.setHoveredElement(rect)
        }
        const failures = []

        for (const [id, run] of Object.entries(attempts)) {
          try {
            run()
          } catch (error) {
            if (error.message === 'Disabled Design feature: ' + id) {
              failures.push(id)
            }
          }
        }

        const extraCommands = {
          pen: {
            appendAnchor: [rect, point],
            removeAnchor: [rect, 'anchor'],
            moveAnchor: [rect, 'anchor', point],
            splitSegment: [rect, 'segment', point],
            setPathClosed: [rect, true],
            connectAnchors: [rect, 'a', 'b'],
            setAnchorType: [rect, 'a', 'smooth'],
            setHandleMode: [rect, 'a', 'none'],
            moveHandle: [rect, 'a', 'outHandle', point],
            editPath: [null],
            selectPathPoint: [rect, 'a'],
            selectPathSegment: [rect, 's']
          },
          fills: {
            updateFill: [rect, 'fill', { color: '#112233' }],
            removeFill: [rect, 'fill'],
            setActiveGradient: [null, null],
            moveGradientHandle: [rect, 'fill', 0, point]
          },
          strokes: {
            updateStroke: [rect, 'stroke', { width: 3 }],
            removeStroke: [rect, 'stroke']
          }
        }

        for (const [feature, commands] of Object.entries(extraCommands)) {
          for (const [command, args] of Object.entries(commands)) {
            try {
              e[command](...args)
            } catch (error) {
              if (error.message === 'Disabled Design feature: ' + feature) {
                continue
              }

              throw error
            }

            throw new Error('Disabled command executed: ' + command)
          }
        }

        const read = e.getElementProperties(rect)
        const loadedText = e.getElementProperties(
          Object.values(saved.sceneTree.elements).find(
            (el) => el.type === 'text'
          ).id
        ).text

        await e.destroy()

        return {
          failures,
          expected: disabledFeatures,
          loadedText,
          width: read.width
        }
      }, result)

      assert.deepEqual(blocked.failures, blocked.expected)
      assert.equal(blocked.loadedText, 'Custom UI')
      assert.equal(blocked.width, 70)
    }
  )
})

test('headless playground edits through the host UI and preserves artwork across feature switches', async () => {
  await withConsumer(
    ['sdk/canvas', 'sdk/design'],
    'headless.js',
    async (page) => {
      await page.evaluate(() => globalThis.ready)

      const button = (name) => page.getByRole('button', { name, exact: true })

      const input = (name) => page.getByLabel(name, { exact: true })

      const run = async (name) => {
        await button(name).click()
        await expect(page.locator('#status')).toHaveText(name + ' completed.')
        await expect(page.locator('main')).toHaveJSProperty('inert', false)
      }

      await run('Insert rectangle')
      const rect = await input('Inspect layer').inputValue()

      await input('Layer name').fill('Swatch')
      await run('Rename')
      await run('Hide')
      await run('Show')
      await run('Lock')
      await expect(button('Apply gradient')).toBeDisabled()
      await run('Unlock')
      await input('Gradient type').selectOption('radial')
      await input('End color').fill('#ff7711')
      await run('Apply gradient')
      await input('Stroke width').fill('7')
      await input('Stroke color').fill('#335599')
      await input('Stroke style').selectOption('dashed')
      await run('Apply stroke')
      await run('Insert label')
      const text = await input('Inspect layer').inputValue()

      await input('Label text').fill('Proof label')
      await run('Update text')
      await run('Draw line')
      const vector = await input('Inspect layer').inputValue()

      await input('X').fill('230')
      await input('Y').fill('185')
      await run('Add anchor')
      await input('X').fill('250')
      await run('Move anchor')
      await run('Close path')
      await input('Inspect layer').selectOption(rect)
      await run('Move to first')
      await run('Fit drawing')

      const drawing = () =>
        page.evaluate(
          ({ rect, text, vector }) => {
            const e = globalThis.editor
            const layers = e.getLayers()
            const { fills, strokes } = e.getElementProperties(rect)
            const path = e.getPath(vector)

            return {
              ids: layers.ids,
              name: layers.elements[rect].name,
              text: e.getElementProperties(text).text,
              gradient: fills[0].gradient,
              stroke: strokes[0],
              anchors: path.anchors.map(({ x, y }) => [x, y]),
              closed: Object.values(path.networks)[0].closed
            }
          },
          { rect, text, vector }
        )

      const before = await drawing()

      assert.equal(before.name, 'Swatch')
      assert.equal(before.text, 'Proof label')
      assert.equal(before.gradient.gradientType, 'radial')
      assert.equal(before.gradient.gradientStops[1].color, '#ff7711')
      assert.equal(before.stroke.width, 7)
      assert.equal(before.stroke.fill.color, '#335599')
      assert.equal(before.stroke.style, 'dashed')
      assert.equal(before.anchors.length, 3)
      assert.ok(
        before.anchors.some(
          ([x, y]) => Math.abs(x - 250) < 1e-6 && Math.abs(y - 185) < 1e-6
        ),
        JSON.stringify(before.anchors)
      )
      assert.ok(before.closed)
      const switches = ['pen', 'text', 'fills', 'strokes', 'rename', 'select']

      for (const feature of switches) {
        await input(feature).check()
      }

      await run('Apply features')
      assert.deepEqual(await drawing(), before)
      await expect(
        page.frameLocator('iframe').getByTestId('toolbar')
      ).toHaveCount(0)
      for (const action of [
        'Draw line',
        'Insert label',
        'Apply gradient',
        'Apply stroke',
        'Rename'
      ]) {
        await expect(button(action)).toBeDisabled()
      }

      const rejection = await page.evaluate((id) => {
        try {
          globalThis.editor.addFill(id)
        } catch (error) {
          return error.message
        }
      }, rect)

      assert.equal(rejection, 'Disabled Design feature: fills')
      for (const feature of switches) {
        await input(feature).uncheck()
      }

      await run('Apply features')
      assert.deepEqual(await drawing(), before)
      await run('Remove gradient')
      await run('Remove stroke')
      await input('Inspect layer').selectOption(vector)
      await run('Open path')
      await run('Remove anchor')
      await expect(input('Anchor').locator('option')).toHaveCount(2)
    }
  )
})
