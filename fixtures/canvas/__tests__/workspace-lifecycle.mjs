import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { expect } from '@playwright/test'
import sharp from 'sharp'
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
        'first-board.js',
        async (page) => {
          const board = page.locator('asyra-design')

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
          await expect
            .poll(() =>
              board.evaluate(
                (el, id) => el.editor?.getLayers().ids.includes(id),
                id
              )
            )
            .toBe(true)
        },
        { development, firstInstall: true }
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
      const records = globalThis.IDBObjectStore.prototype
      const writes = []
      const original = records.put

      records.put = function (value, key) {
        if (key === 'board-a' || key === 'board-b') {
          writes.push(key)
        }

        return original.call(this, value, key)
      }

      const open = (el, storageKey) =>
        globalThis.createDesign(el, { storageKey, hideUI: true })

      const requestValue = (request) =>
        new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error)
        })

      let database

      const read = (key) =>
        requestValue(
          database.transaction('documents').objectStore('documents').get(key)
        )

      const contains = async (key, id) =>
        Boolean((await read(key))?.sceneTree.elements[id])

      const settle = () =>
        new Promise((resolve) => globalThis.setTimeout(resolve, 0))

      let a = await open(slot, 'board-a')
      const b = await open(other, 'board-b')

      database = await requestValue(
        globalThis.indexedDB.open('design-workspace-documents')
      )

      try {
        const initial = writes.length
        const bounds = { x: 1, y: 1, width: 20, height: 20 }
        const first = a.drawRectangle(bounds)
        const second = a.drawOval(bounds)
        const peer = b.drawRectangle(bounds)

        await settle()
        const coalesced = [...writes]

        const shapes = async (key) =>
          Object.values((await read(key)).sceneTree.elements)
            .map((el) => el.type)
            .filter((type) => type === 'oval' || type === 'rect')
            .sort()

        const isolated = await Promise.all([
          shapes('board-a'),
          shapes('board-b')
        ])

        await a.undo()
        await settle()
        const undone =
          (await contains('board-a', first)) &&
          !(await contains('board-a', second))

        await a.redo()
        await settle()
        const redone = await contains('board-a', second)
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
          peer: await contains('board-b', peer),
          legacy: globalThis.localStorage.getItem('board-a')
        }
      } finally {
        database.close()
        records.put = original
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
      peer: true,
      legacy: null
    })
  })
})

test('packed Design React onMount receives the ready editor once per board identity', async () => {
  await withConsumer(react, 'react.js', async (page) => {
    const render = (key) =>
      page.evaluate((key) => {
        globalThis.mounts ??= []
        globalThis.renderMountedBoard(key, (editor) =>
          globalThis.mounts.push(editor)
        )
      }, key)

    await render('first')
    await expect
      .poll(() => page.evaluate(() => globalThis.mounts.length))
      .toBe(1)
    await render('first')
    await render('second')
    await expect
      .poll(() => page.evaluate(() => globalThis.mounts.length))
      .toBe(2)
    assert.equal(
      await page.evaluate(
        () =>
          globalThis.mounts[1] ===
            globalThis.document.querySelector('asyra-design').editor &&
          globalThis.mounts[0] !== globalThis.mounts[1]
      ),
      true
    )
  })
})

test('packed node extension restores its own type, appearance and fields on a disabled board', async () => {
  await workspace(async (page) => {
    const open = (disabled) =>
      page.evaluate(async (disabled) => {
        await globalThis.editor.destroy()
        globalThis.editor = await globalThis.createDesign(globalThis.host, {
          extensions: [globalThis.approvalNode],
          storageKey: 'approvals',
          hideUI: true,
          disabledFeatures: disabled
        })
      }, disabled)

    await open([])
    const id = await page.evaluate(async () => {
      const editor = globalThis.editor

      await editor.runAction('insertApproval')

      return editor
        .getLayers()
        .ids.find((id) => editor.getLayers().elements[id].type === 'approval')
    })

    assert.ok(id)
    const state = await page.evaluate(async (id) => {
      const e = globalThis.editor

      const read = () =>
        e.getElementProperties(id, ['status', 'reviewed', 'width', 'x'])

      const initial = read()

      e.select([id])
      e.common.element.updateElementProperties([id], {
        status: 'approved',
        width: 120,
        x: 160
      })
      const edited = read()

      await e.undo()
      const undone = read()

      await e.redo()

      return {
        initial,
        edited,
        undone,
        redone: read(),
        selection: e.getSelection()
      }
    }, id)

    assert.deepEqual(state.initial, {
      status: 'pending',
      reviewed: true,
      width: 100,
      x: 140
    })
    assert.deepEqual(state.edited, {
      status: 'approved',
      reviewed: true,
      width: 120,
      x: 160
    })
    assert.deepEqual(state.undone, state.initial)
    assert.deepEqual(state.redone, state.edited)
    assert.deepEqual(state.selection, [id])
    await page.reload()
    await page.waitForFunction(() => Boolean(globalThis.editor))
    await open(['approval'])
    const properties = await page.evaluate(
      (id) =>
        globalThis.editor.getElementProperties(id, [
          'status',
          'reviewed',
          'width',
          'x',
          'fills'
        ]),
      id
    )
    const { fills, ...persisted } = properties

    assert.deepEqual(persisted, state.edited)
    assert.match(JSON.stringify(fills), /e24989/i)
    // Check the restored renderer and its hit target with the extension disabled.
    const frame = page.locator('main iframe')
    let center

    await expect
      .poll(async () => {
        const { data, info } = await sharp(await frame.screenshot())
          .removeAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true })
        let minX = info.width,
          minY = info.height,
          maxX = -1,
          maxY = -1,
          count = 0

        for (let y = 0; y < info.height; y++) {
          for (let x = 0; x < info.width; x++) {
            const offset = (y * info.width + x) * 3

            if (
              data[offset] === 226 &&
              data[offset + 1] === 73 &&
              data[offset + 2] === 137
            ) {
              count++
              minX = Math.min(x, minX)
              maxX = Math.max(x, maxX)
              minY = Math.min(y, minY)
              maxY = Math.max(y, maxY)
            }
          }
        }

        if (!count) {
          return false
        }

        center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
        const area = (maxX - minX + 1) * (maxY - minY + 1)

        return count > 100 && count / area > 0.73 && count / area < 0.84
      })
      .toBe(true)
    await frame.click({ position: center })
    assert.deepEqual(
      await page.evaluate(() => globalThis.editor.getSelection()),
      [id]
    )
    await assert.rejects(
      page.evaluate(() => globalThis.editor.runAction('insertApproval')),
      /disabled/i
    )
    await assert.rejects(
      page.evaluate(() =>
        globalThis.approvalNode.actions.insertApproval.run(globalThis.editor)
      ),
      /disabled/i
    )
    await assert.rejects(
      page.evaluate(
        (id) =>
          globalThis.editor.common.element.updateElementProperties([id], {
            status: 'blocked'
          }),
        id
      ),
      /disabled/i
    )
    await page.evaluate(() => globalThis.editor.setDisabledFeatures([]))
    await page.evaluate(() => globalThis.editor.runAction('insertApproval'))
    assert.equal(
      await page.evaluate(() => globalThis.editor.getLayers().ids.length),
      2
    )
  })
})

test('packed board migrates a valid legacy snapshot and preserves an invalid original', async () => {
  await workspace(async (page) => {
    const result = await page.evaluate(async () => {
      const id = globalThis.editor.drawRectangle({
        x: 10,
        y: 10,
        width: 20,
        height: 20
      })
      const snapshot = await globalThis.editor.save()

      globalThis.localStorage.setItem('previous', JSON.stringify(snapshot))
      globalThis.localStorage.setItem('invalid', '{')
      const slot = globalThis.document.createElement('div')

      globalThis.document.body.append(slot)

      const open = (storageKey) =>
        globalThis.createDesign(slot, { storageKey, hideUI: true })

      const first = await open('previous')

      await first.destroy()
      const put = globalThis.IDBObjectStore.prototype.add

      globalThis.localStorage.setItem('retry', JSON.stringify(snapshot))
      globalThis.IDBObjectStore.prototype.add = function (...args) {
        const request = put.apply(this, args)

        this.transaction.abort()

        return request
      }

      let retryPreserved

      try {
        await open('retry')
      } catch {
        retryPreserved =
          globalThis.localStorage.getItem('retry') === JSON.stringify(snapshot)
      } finally {
        globalThis.IDBObjectStore.prototype.add = put
      }

      const retried = await open('retry')

      retryPreserved &&= retried.getLayers().ids.includes(id)
      await retried.destroy()
      const next = await open('previous')
      const loaded = next.getLayers().ids.includes(id)

      await next.destroy()
      let rejected = false

      try {
        await open('invalid')
      } catch {
        rejected = true
      }

      return [
        retryPreserved,
        loaded,
        globalThis.localStorage.getItem('previous'),
        rejected,
        globalThis.localStorage.getItem('invalid')
      ]
    })

    assert.deepEqual(result, [true, true, null, true, '{'])
  })
})

test('packed Design React mounts first-party Position in the configured host toolbar', async () => {
  await withConsumer(
    [...react, 'sdk/design-ui'],
    'ui-react.js',
    async (page) => {
      const input = page.locator('#my-toolbar').getByLabel('X', { exact: true })

      await expect(input).toBeVisible()
      await expect(input).toBeDisabled()
      await page.locator('asyra-design').evaluate((el) => {
        const e = el.editor

        e.select([e.drawRectangle({ x: 18, y: 7, width: 30, height: 20 })])
      })
      await expect(input).toHaveValue('18')
      await input.fill('42')
      await input.press('Enter')
      assert.equal(
        await page
          .locator('asyra-design')
          .evaluate(
            (el) =>
              el.editor.getElementProperties(el.editor.getSelection()[0], ['x'])
                .x
          ),
        42
      )
    }
  )
})

test('packed Design resolves only configured UI targets and releases failed mounts', async () => {
  await withConsumer(design, 'common.js', async (page) => {
    await page.evaluate(() => globalThis.ready)
    const state = await page.evaluate(async () => {
      const { document, createDesign, positionRow } = globalThis
      const host = document.body.appendChild(document.createElement('section'))
      const bar = document.body.appendChild(document.createElement('aside'))

      bar.id = 'custom-toolbar'

      const open = (uiTargets) =>
        createDesign(host, {
          ui: [
            positionRow,
            {
              id: 'anotherRow',
              label: 'Another row',
              placement: 'toolbar.top',

              mount({ container }) {
                container.textContent = 'Other control'
              }
            }
          ],
          uiTargets
        })

      const errors = []

      for (const invalid of [
        { positionRow: 'missing-toolbar' },
        { missingGroup: bar.id }
      ]) {
        try {
          await open(invalid)
        } catch (error) {
          errors.push(error.message)
        }
      }

      const editor = await open({ positionRow: bar.id })

      const numberMounted = () =>
        bar.querySelectorAll('[data-tool-group="positionRow"]').length

      const external = numberMounted()
      const internal = host
        .querySelector('iframe')
        .contentDocument.querySelector(
          '[data-tool-slot="toolbar.top"] [data-tool-group="anotherRow"]'
        )?.textContent
      const temporary = document.createElement('div')
      const release = editor.toolGroups.mount(positionRow.id, temporary)
      const moved =
        temporary.querySelector('[data-tool-group]') !== null &&
        numberMounted() === 0

      release()
      const restored = numberMounted()

      await editor.setDisabledFeatures([positionRow.id])
      const disabled = numberMounted()

      await editor.setDisabledFeatures([])
      await editor.reset()
      const reset = numberMounted()

      await editor.destroy()

      return {
        errors,
        external,
        internal,
        moved,
        restored,
        disabled,
        reset,
        closed: numberMounted()
      }
    })

    assert.match(state.errors[0], /missing-toolbar/)
    assert.match(state.errors[1], /missingGroup/)
    assert.match(state.internal, /Other control/)
    assert.deepEqual(
      [
        state.external,
        state.moved,
        state.restored,
        state.disabled,
        state.reset,
        state.closed
      ],
      [1, true, 1, 0, 1, 0]
    )
  })
})

test('packed Design moving Position removes the inspector copy and retains Dimension', async () => {
  await withConsumer(design, 'tool-layout.js', async (page) => {
    await page.evaluate(() => globalThis.ready)
    await page.getByRole('button', { name: 'Select two rectangles' }).click()
    await page.getByLabel('Position row placement').selectOption('manual')
    const inspector = page
      .frameLocator('main iframe')
      .getByTestId('properties-panel')

    await expect(
      page.locator('#external').getByLabel('X', { exact: true })
    ).toBeVisible()
    await expect(inspector.getByTestId('prop-x')).toHaveCount(0)
    await expect(inspector.getByTestId('prop-width')).toBeVisible()
  })
})

for (const useReact of [true, false]) {
  test(
    'packed Design relocates and edits both native rows with Undo in ' +
      (useReact ? 'React' : 'plain JavaScript'),
    async () => {
      await withConsumer(
        useReact ? [...react, 'sdk/design-ui'] : design,
        useReact ? 'ui-react.js' : 'common.js',
        async (page) => {
          if (!useReact) {
            await page.evaluate(async () => {
              const { document } = globalThis

              await globalThis.ready
              for (const id of ['my-toolbar', 'size-toolbar', 'row-board']) {
                const element = document.createElement('section')

                element.id = id
                document.body.append(element)
              }

              const e = await globalThis.createDesign(
                document.getElementById('row-board'),
                {
                  ui: [globalThis.positionRow, globalThis.dimensionRow],
                  uiTargets: { positionRow: 'my-toolbar' }
                }
              )

              document.getElementById('row-board').editor = e
              globalThis.showTargets = (targets) =>
                e.toolGroups.setTargets(targets)
            })
          }

          const host = page.locator(useReact ? 'asyra-design' : '#row-board')

          await expect
            .poll(() => host.evaluate((el) => Boolean(el.editor)))
            .toBe(true)
          await host.evaluate((el) => {
            const e = el.editor

            e.select([e.drawRectangle({ x: 10, y: 12, width: 80, height: 40 })])
          })
          const panel = host
            .frameLocator('iframe')
            .getByTestId('properties-panel')
          const x = page.locator('#my-toolbar').getByTestId('prop-x')
          const w = page.locator('#size-toolbar').getByTestId('prop-width')
          const nativeX = panel.getByTestId('prop-x')
          const nativeW = panel.getByTestId('prop-width')

          const setTargets = (targets) =>
            page.evaluate((targets) => globalThis.showTargets(targets), targets)

          await expect(x).toHaveValue('10')
          await expect(nativeX).toHaveCount(0)
          await expect(nativeW).toHaveValue('80')
          await x.evaluate((el) => {
            el.ownerDocument.defaultView.top.originalX = el
          })
          await nativeW.evaluate((el) => {
            el.ownerDocument.defaultView.top.originalW = el
          })
          await setTargets({
            positionRow: 'my-toolbar',
            dimensionRow: 'size-toolbar'
          })
          await expect(nativeW).toHaveCount(0)
          await expect(w).toHaveValue('80')
          assert.ok(
            await w.evaluate(
              (el) => el === el.ownerDocument.defaultView.top.originalW
            )
          )
          await x.fill('24')
          await x.press('Enter')
          await w.fill('120')
          await w.press('Enter')

          const y = page.locator('#my-toolbar').getByTestId('prop-y')
          const height = page
            .locator('#size-toolbar')
            .getByTestId('prop-height')

          await y.fill('-7')
          await y.press('Enter')
          await height.fill('52')
          await height.press('Enter')

          const vertical = () =>
            host.evaluate((el) =>
              el.editor.getElementProperties(el.editor.getSelection()[0], [
                'y',
                'height'
              ])
            )

          assert.deepEqual(await vertical(), { y: -7, height: 52 })
          await host.evaluate((el) => el.editor.undo())
          assert.deepEqual(await vertical(), { y: -7, height: 40 })
          await host.evaluate((el) => el.editor.undo())
          assert.deepEqual(await vertical(), { y: 12, height: 40 })

          const values = () =>
            host.evaluate((el) =>
              el.editor.getElementProperties(el.editor.getSelection()[0], [
                'x',
                'width'
              ])
            )

          assert.deepEqual(await values(), { x: 24, width: 120 })
          await setTargets({ dimensionRow: 'size-toolbar' })
          await expect(x).toHaveCount(0)
          await expect(nativeX).toHaveValue('24')
          assert.ok(
            await nativeX.evaluate(
              (el) => el === el.ownerDocument.defaultView.top.originalX
            )
          )
          await host.evaluate((el) => el.editor.undo())
          assert.deepEqual(await values(), { x: 24, width: 80 })
          await expect(w).toHaveValue('80')
          await host.evaluate((el) => el.editor.undo())
          assert.deepEqual(await values(), { x: 10, width: 80 })
          await setTargets({})
          await expect(w).toHaveCount(0)
          await expect(nativeX).toHaveCount(1)
          await expect(nativeW).toHaveCount(1)
          assert.ok(
            await nativeW.evaluate(
              (el) => el === el.ownerDocument.defaultView.top.originalW
            )
          )
        }
      )
    }
  )
}
