import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { expect } from '@playwright/test'
import { withDocumentServices } from '../services.mjs'
import { root, withConsumer } from './packed-consumer.mjs'

const design = ['sdk/canvas', 'sdk/design']
const react = [
  ...design,
  'node_modules/react',
  'node_modules/react-dom',
  'node_modules/scheduler',
  'node_modules/@types/react',
  'node_modules/csstype'
]

async function workspace(check) {
  await withConsumer(design, 'workspace.js', async (page) => {
    await page.waitForFunction(() => Boolean(globalThis.editor))
    await check(page)
  })
}

const scriptUrl = (page) =>
  page
    .locator('iframe')
    .evaluate((frame) => frame.contentDocument.querySelector('script[src]').src)

test('packed Design lifecycle releases a host moved during startup', async () => {
  await workspace(async (page) => {
    const url = await scriptUrl(page)
    let requested
    const started = new Promise((resolve) => {
      requested = resolve
    })
    let resume
    const paused = new Promise((resolve) => {
      resume = resolve
    })

    await page.route(
      url,
      async (route) => {
        requested()
        await paused
        await route.continue().catch(() => undefined)
      },
      { times: 1 }
    )
    try {
      await page.evaluate(() => {
        const host = globalThis.document.createElement('main')

        globalThis.document.body.append(host)
        globalThis.movingHost = host
        globalThis.createDesign(host).then(
          async (editor) => {
            await editor.destroy()
            globalThis.settled = true
          },
          () => {
            globalThis.settled = true
          }
        )
      })
      await started
      await page.evaluate(() =>
        globalThis.document.body.prepend(globalThis.movingHost)
      )
    } finally {
      resume()
    }

    await page.waitForFunction(() => globalThis.settled, undefined, {
      timeout: 4000
    })
    await page.evaluate(async () => {
      const editor = await globalThis.createDesign(globalThis.movingHost)

      await editor.destroy()
    })
  })
})

test('packed Design lifecycle applies availability during reset', async () => {
  await workspace(async (page) => {
    const enabled = await page.evaluate(async () => {
      const editor = globalThis.editor

      await Promise.all([editor.reset(), editor.setDisabledFeatures(['pen'])])

      return editor.isFeatureEnabled('pen')
    })

    assert.equal(enabled, false)
  })
})

test('packed Design lifecycle retries an interrupted reset', async () => {
  await workspace(async (page) => {
    await page.route(await scriptUrl(page), (route) => route.abort('failed'), {
      times: 1
    })
    await assert.rejects(
      page.evaluate(() => globalThis.editor.reset()),
      /Unable to load/
    )
    await page.evaluate(() => globalThis.editor.reset())
    assert.ok(
      await page.evaluate(() =>
        globalThis.editor.drawRectangle({ x: 0, y: 0, width: 10, height: 10 })
      )
    )
  })
})

test('packed Design lifecycle delivers availability past a failing observer', async () => {
  await workspace(async (page) => {
    const result = await page.evaluate(async () => {
      const notifications = []
      const errors = []

      globalThis.reportError = (error) => errors.push(error.message)
      const editor = globalThis.editor

      editor.observe('disabledFeatures', (ids) => {
        if (ids.length) {
          throw new Error('subscriber error')
        }
      })
      editor.observe('disabledFeatures', (ids) => notifications.push(ids))
      await editor.setDisabledFeatures(['pen'])

      return { notifications, errors }
    })

    assert.deepEqual(result, {
      notifications: [[], ['pen']],
      errors: ['subscriber error']
    })
  })
})

test('packed Design lifecycle docks a floating React tool in Properties', async () => {
  await withConsumer(react, 'react.js', async (page) => {
    await page.evaluate(() =>
      globalThis.renderBoard(
        {
          extensions: [
            {
              id: 'sample',
              ui: [
                {
                  id: 'sample',
                  placement: 'toolbar.top',

                  mount({ container }) {
                    container.append('Sample')
                  }
                }
              ]
            }
          ]
        },
        'tools'
      )
    )
    const host = page.locator('main > asyra-design')

    await expect
      .poll(() => host.evaluate((el) => el.editor?.features.includes('sample')))
      .toBe(true)
    await host.evaluate((el) =>
      el.editor.toolGroups.float('sample', { x: 70, y: 90 })
    )
    const grip = await page
      .getByRole('button', { name: 'Move sample' })
      .boundingBox()
    const dock = host
      .frameLocator('iframe')
      .locator('[data-tool-dock="Properties"]')
    const box = await dock.boundingBox()

    await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2, box.y + 15, { steps: 6 })
    await page.mouse.up()
    await expect(dock.locator('[data-tool-group="sample"]')).toHaveCount(1)
  })
})

test('packed Design lifecycle retries React startup after correcting options', async () => {
  await withConsumer(react, 'react.js', async (page) => {
    await page.evaluate(() => {
      globalThis.reportError = (error) => {
        globalThis.startupError = error.message
      }

      globalThis.renderBoard({ disabledFeatures: ['rectangel'] }, 'retry')
    })
    await page.waitForFunction(() =>
      globalThis.startupError?.includes('rectangel')
    )
    await page.evaluate(() =>
      globalThis.renderBoard({ disabledFeatures: ['rectangle'] }, 'retry')
    )
    const host = page.locator('main > asyra-design')

    await expect
      .poll(() =>
        host.evaluate((el) => el.editor?.isFeatureEnabled('rectangle'))
      )
      .toBe(false)
  })
})

test('packed Design lifecycle rejects unsupported editor capabilities in declarations', async () => {
  await withConsumer(react, 'react.js', async (_page, cwd) => {
    execFileSync(
      process.execPath,
      [
        path.join(root, 'node_modules/typescript/bin/tsc'),
        '--noEmit',
        '--strict',
        '--typeRoots',
        './node_modules/@types',
        '--moduleResolution',
        'bundler',
        '--module',
        'ESNext',
        '--target',
        'ES2022',
        '--jsx',
        'react-jsx',
        'examples/editor-contract.tsx'
      ],
      { cwd }
    )
  })
})

test('packed Design lists registered observations for each live workspace', async () => {
  await workspace(async (page) => {
    const result = await page.evaluate(async () => {
      const editor = globalThis.editor
      const keys = editor.observeKeys
      const initialDeliveries = []

      for (const key of keys) {
        editor.observe(key, () => initialDeliveries.push(key))()
      }

      const host = globalThis.document.createElement('aside')

      globalThis.document.body.append(host)
      const second = await globalThis.createDesign(host, {
        hideUI: true,
        disabledFeatures: ['fills']
      })

      try {
        const secondKeys = second.observeKeys
        let availability
        const stop = editor.observe('disabledFeatures', (value) => {
          availability = value
        })

        await editor.setDisabledFeatures(['fills'])
        const disabled = availability
        const same = editor.observeKeys === keys

        await editor.setDisabledFeatures([])
        stop()
        await editor.reset()

        return {
          keys,
          initialDeliveries,
          disabled,
          enabled: availability,
          same,
          frozen: Object.isFrozen(keys),
          isolated:
            secondKeys !== keys &&
            second.observeKeys === secondKeys &&
            !second.isFeatureEnabled('fills'),
          afterReset: editor.observeKeys,
          replaced: editor.observeKeys !== keys
        }
      } finally {
        await second.destroy()
        host.remove()
      }
    })

    assert.deepEqual(new Set(result.initialDeliveries), new Set(result.keys))
    assert.equal(new Set(result.keys).size, result.keys.length)
    for (const key of [
      'elementSelection',
      'fills',
      'strokes',
      'typography',
      'primaryTool',
      'hoveredElementId',
      'disabledFeatures',
      'viewportPosition',
      'collaboration'
    ]) {
      assert.ok(result.keys.includes(key), key)
    }

    assert.deepEqual(result.disabled, ['fills'])
    assert.deepEqual(result.enabled, [])
    assert.ok(
      result.same && result.frozen && result.isolated && result.replaced
    )
    assert.deepEqual(result.afterReset, result.keys)
  })
})

for (const development of [true, false]) {
  const mode = development
    ? 'default Vite development server'
    : 'production preview'

  test(
    'packed Design saves and restores the React quickstart in the ' + mode,
    async () => {
      await withConsumer(
        react,
        'react.js',
        async (page) => {
          const board = page.locator('asyra-design')

          await expect
            .poll(() => board.evaluate((el) => Boolean(el.editor)))
            .toBe(true)
          await page.evaluate(() => globalThis.renderSavedBoard())
          await expect
            .poll(() =>
              board.evaluate((el) =>
                Boolean(el.editor && el.options?.storageKey === 'my-board')
              )
            )
            .toBe(true)
          await expect(
            page.getByRole('button', { name: 'Save board' })
          ).toHaveCount(0)
          await board
            .frameLocator('iframe')
            .getByTestId('tool-rectangle')
            .click()
          const box = await board.locator('iframe').boundingBox()

          await page.mouse.move(box.x + 370, box.y + 150)
          await page.mouse.down()
          await page.mouse.move(box.x + 445, box.y + 210, { steps: 5 })
          await page.mouse.up()
          const id = await board.evaluate((el) =>
            el.editor
              .getLayers()
              .ids.find(
                (id) => el.editor.getLayers().elements[id].type === 'rect'
              )
          )

          assert.ok(id, 'The toolbar and pointer created a rectangle')
          await page.reload()
          await page.evaluate(() => globalThis.renderSavedBoard())
          await expect
            .poll(() =>
              board.evaluate(
                (el, id) => el.editor?.getLayers().ids.includes(id),
                id
              )
            )
            .toBe(true)
        },
        { development }
      )
    }
  )
}

test('packed Design React switches the document on the same mounted board', async () => {
  await withConsumer(react, 'react.js', async (page) => {
    const host = page.locator('main > asyra-design')

    await expect
      .poll(() => host.evaluate((el) => Boolean(el.editor)))
      .toBe(true)
    const [a, b] = await host.evaluate(async (el) => {
      const e = el.editor
      const bounds = { x: 10, y: 10, width: 30, height: 30 }
      const a = e.drawRectangle(bounds)
      const doc = await e.save()

      e.select([a])
      e.deleteSelectedElement()
      const b = e.drawOval(bounds)

      globalThis.secondDocument = await e.save()
      globalThis.renderBoard({ document: doc }, 'boards')

      return [a, b]
    })

    await expect
      .poll(() =>
        host.evaluate((el, id) => el.editor?.getLayers().ids.includes(id), a)
      )
      .toBe(true)
    const old = await host.elementHandle()

    await page.evaluate(() =>
      globalThis.renderBoard({ document: globalThis.secondDocument }, 'boards')
    )
    await expect
      .poll(() =>
        old.evaluate((el, id) => el.editor?.getLayers().ids.includes(id), b)
      )
      .toBe(true)
    assert.equal(
      await old.evaluate(
        async (el, id) =>
          Boolean((await el.editor.save()).sceneTree.elements[id]),
        a
      ),
      false
    )
  })
})

test('packed Design rolls back a failed extension activation and retries', async () => {
  await workspace(async (page) => {
    const state = await page.evaluate(async () => {
      const host = globalThis.document.body.appendChild(
        globalThis.document.createElement('main')
      )
      const slot = globalThis.document.body.appendChild(
        globalThis.document.createElement('aside')
      )
      let attempts = 0
      const notifications = []
      const e = await globalThis.createDesign(host, {
        hideUI: true,
        disabledFeatures: ['plugin', 'rectangle'],
        extensions: [
          {
            id: 'plugin',
            ui: [
              {
                id: 'controls',
                placement: 'manual',

                mount({ container }) {
                  if (++attempts === 1) {
                    throw new Error('mount failed')
                  }

                  container.append('Controls')
                }
              }
            ]
          }
        ]
      })

      try {
        e.toolGroups.mount('controls', slot)
        e.observe('disabledFeatures', (ids) => notifications.push([...ids]))
        const error = await e.setDisabledFeatures([]).then(
          () => null,
          (err) => err.message
        )
        const enabled = e.isFeatureEnabled('plugin')
        let drawingBlocked = false

        try {
          e.drawRectangle({ x: 1, y: 1, width: 10, height: 10 })
        } catch {
          drawingBlocked = true
        }

        await e.setDisabledFeatures([])

        return {
          error,
          enabled,
          drawingBlocked,
          attempts,
          notifications,
          ui: slot.textContent
        }
      } finally {
        await e.destroy()
      }
    })

    assert.deepEqual(state, {
      error: 'mount failed',
      enabled: false,
      drawingBlocked: true,
      attempts: 2,
      notifications: [['plugin', 'rectangle'], []],
      ui: 'Controls'
    })
  })
})

test('packed Design reserves built-in feature IDs for app commands', async () => {
  await workspace(async (page) => {
    const accepted = await page.evaluate(async () => {
      const host = globalThis.document.body.appendChild(
        globalThis.document.createElement('main')
      )
      const accepted = []

      for (const id of ['group', 'zoomFit', 'fills', 'rectangle']) {
        try {
          const editor = await globalThis.createDesign(host, {
            extensions: [
              {
                actions: {
                  [id]: {
                    label: 'Custom',

                    run: () => undefined
                  }
                }
              }
            ]
          })

          accepted.push(id)
          await editor.destroy()
        } catch (error) {
          if (!error.message.includes('unique Design action')) {
            throw error
          }
        }
      }

      return accepted
    })

    assert.deepEqual(accepted, [])
  })
})

test('packed Design React changes collaboration rooms without retaining the previous editor', async () => {
  await withConsumer(react, 'react.js', async (page, directory) => {
    await withDocumentServices(
      directory,
      new globalThis.URL(page.url()).origin,
      async (endpoint) => {
        const host = page.locator('main > asyra-design')

        async function enter(fileId) {
          await page.evaluate(
            ({ fileId, endpoint }) => {
              globalThis.previousRoomEditor =
                globalThis.document.querySelector('asyra-design')?.editor
              globalThis.renderBoard(
                { collaboration: { fileId, endpoint } },
                'shared'
              )
            },
            { fileId, endpoint }
          )
          await expect
            .poll(() =>
              host.evaluate(
                (el) =>
                  el.editor !== globalThis.previousRoomEditor &&
                  el.editor?.getCollaborationState()?.connection === 'connected'
              )
            )
            .toBe(true)
        }

        await enter('first')
        const id = await host.evaluate((el) =>
          el.editor.drawRectangle({ x: 1, y: 1, width: 30, height: 30 })
        )

        await enter('second')
        assert.equal(
          await host.evaluate(
            (el, id) => el.editor.getLayers().ids.includes(id),
            id
          ),
          false
        )
        assert.equal(
          await page.evaluate(() => {
            try {
              globalThis.previousRoomEditor.getLayers()

              return false
            } catch {
              return true
            }
          }),
          true
        )
        await page.evaluate(() => globalThis.unmount())
      }
    )
  })
})

test('packed Design resolves browser assets with Webpack development conditions', async () => {
  await withConsumer(design, 'workspace.js', async (_page, cwd) => {
    execFileSync(
      process.execPath,
      [
        '--conditions=browser',
        '--conditions=webpack',
        '--conditions=development',
        '--input-type=module',
        '--eval',
        [
          "import { access } from 'node:fs/promises'",
          "import { getAssets } from '@asyra/design/internal/workspace-assets'",
          "const assets = getAssets('https://example.test/')",
          'await Promise.all(Object.values(assets).map(url => access(new URL(url))))'
        ].join('\n')
      ],
      { cwd, stdio: 'pipe' }
    )
  })
})

test('packed Design local autosave coalesces commits and restores Undo, Redo and reset by board key', async () => {
  await workspace(async (page) => {
    const state = await page.evaluate(async () => {
      const slot = globalThis.document.body.appendChild(
        globalThis.document.createElement('section')
      )
      const other = globalThis.document.body.appendChild(
        globalThis.document.createElement('section')
      )
      const storage = globalThis.localStorage
      const writes = []
      const original = globalThis.Storage.prototype.setItem

      globalThis.Storage.prototype.setItem = function (key, value) {
        if (key === 'board-a' || key === 'board-b') {
          writes.push(key)
        }

        return original.call(this, key, value)
      }

      const open = (el, storageKey) =>
        globalThis.createDesign(el, { storageKey, hideUI: true })

      const contains = (key, id) =>
        Boolean(
          JSON.parse(storage.getItem(key) ?? 'null')?.sceneTree.elements[id]
        )

      const settle = () =>
        new Promise((resolve) => globalThis.setTimeout(resolve, 0))

      let a = await open(slot, 'board-a')
      const b = await open(other, 'board-b')

      try {
        const initial = writes.length
        const bounds = { x: 1, y: 1, width: 20, height: 20 }
        const first = a.drawRectangle(bounds)
        const second = a.drawOval(bounds)
        const peer = b.drawRectangle(bounds)

        await settle()
        const coalesced = [...writes]

        const shapes = (key) =>
          Object.values(JSON.parse(storage.getItem(key)).sceneTree.elements)
            .map((el) => el.type)
            .filter((type) => type === 'oval' || type === 'rect')
            .sort()

        const isolated = [shapes('board-a'), shapes('board-b')]

        await a.undo()
        await settle()
        const undone =
          contains('board-a', first) && !contains('board-a', second)

        await a.redo()
        await settle()
        const redone = contains('board-a', second)
        const last = a.drawRectangle(bounds)

        await a.destroy()
        a = await open(slot, 'board-a')
        const restored = a.getLayers().ids.includes(last)

        await a.reset()
        await a.destroy()
        a = await open(slot, 'board-a')

        return {
          initial,
          coalesced,
          isolated,
          undone,
          redone,
          restored,
          reset: !a.getLayers().ids.includes(last),
          peer: contains('board-b', peer)
        }
      } finally {
        globalThis.Storage.prototype.setItem = original
        await a.destroy()
        await b.destroy()
      }
    })

    assert.deepEqual(state, {
      initial: 0,
      coalesced: ['board-a', 'board-b'],
      isolated: [['oval', 'rect'], ['rect']],
      undone: true,
      redone: true,
      restored: true,
      reset: true,
      peer: true
    })
  })
})
