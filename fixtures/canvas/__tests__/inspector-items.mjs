import assert from 'node:assert/strict'
import test from 'node:test'
import { expect } from '@playwright/test'
import { withConsumer } from './packed-consumer.mjs'

test('packed Design inspector composes native and custom fields on an ordinary editor', async () => {
  await withConsumer(
    ['sdk/canvas', 'sdk/design'],
    'workspace.js',
    async (page) => {
      await page.evaluate(() => globalThis.ready)
      await page.evaluate(async () => {
        const { host, createDesign } = globalThis

        await globalThis.editor.destroy()
        const e = await createDesign(host, {
          extensions: [
            { id: 'marker', node: { name: 'Marker', fields: { abc: 0 } } }
          ]
        })
        const id = e.common.element.createElement({
          type: 'marker',
          workspacePosition: { x: 1, y: 2 },
          width: 40,
          height: 30
        })

        e.select([id])
        const row = e.getUI('positionRow')
        const stats = { mounts: 0, stops: 0 }
        const z = {
          kind: 'number',
          id: 'abc',
          label: 'Z',

          getValue: () => e.getElementProperties(id, ['abc']).abc,

          subscribe: (notify) => {
            stats.mounts++
            const stop = e.common.transaction.subscribeToTransactionStatus(
              (event) => {
                if (event.status === 'committed') {
                  notify()
                }
              }
            )

            return () => {
              stats.stops++
              stop()
            }
          },

          setValue: (abc) =>
            e.common.element.updateElementProperties([id], { abc })
        }
        const remove = row.insertAfter(row.items.x, z)

        Object.assign(globalThis, { editor: e, id, row, z, remove, stats })
      })
      const panel = page
        .frameLocator('main iframe')
        .getByTestId('properties-panel')
      const zInput = panel.getByTestId('prop-abc')

      const order = () =>
        zInput.evaluate((el) =>
          Array.from(el.closest('.grid').querySelectorAll('input'), (input) =>
            input.getAttribute('aria-label')
          )
        )

      await expect(zInput).toHaveValue('0')
      assert.deepEqual(await order(), ['X', 'Z', 'Y'])
      await zInput.fill('7')
      await zInput.press('Enter')
      await expect(zInput).toHaveValue('7')
      await page.evaluate(() => globalThis.editor.undo())
      await expect(zInput).toHaveValue('0')
      await page.evaluate(() => globalThis.editor.redo())
      await expect(zInput).toHaveValue('7')
      for (const invalid of ['duplicate', 'wrong row', 'missing anchor']) {
        await assert.rejects(
          page.evaluate((invalid) => {
            const { row, z } = globalThis

            if (invalid === 'duplicate') {
              row.setItems([z, z])
            } else if (invalid === 'wrong row') {
              row.setItems(['width'])
            } else {
              row.insertAfter({ ...z, id: 'absent' }, { ...z, id: 'other' })
            }
          }, invalid),
          /inspector/i
        )
      }

      assert.deepEqual(await order(), ['X', 'Z', 'Y'])

      await page.evaluate(() => {
        const { row, z } = globalThis

        row.setItems([row.items.y, z, row.items.x])
        globalThis.remove() // A previous installation cannot remove its replacement.
        globalThis.removeSecond = row.insertAfter(z, {
          ...z,
          id: 'second',
          label: 'Second'
        })
      })
      await expect(panel.getByLabel('Second', { exact: true })).toBeVisible()
      assert.deepEqual(await order(), ['Y', 'Z', 'Second', 'X'])
      await page.evaluate(() => globalThis.removeSecond())
      await expect(panel.getByLabel('Second', { exact: true })).toHaveCount(0)
      assert.deepEqual(await order(), ['Y', 'Z', 'X'])
      const independent = await page.evaluate(async () => {
        const host = globalThis.document.createElement('section')

        globalThis.document.body.append(host)
        const e = await globalThis.createDesign(host)

        e.select([e.drawRectangle({ x: 0, y: 0, width: 20, height: 20 })])
        globalThis.peerEditor = e

        return e.getUI('positionRow') !== globalThis.row
      })

      assert.equal(independent, true)
      const peer = page.frameLocator('section > iframe')

      await expect(peer.getByTestId('prop-x')).toBeVisible()
      await expect(peer.getByLabel('Z', { exact: true })).toHaveCount(0)
      await page.evaluate(() => globalThis.peerEditor.destroy())
      await page.evaluate(() => globalThis.editor.destroy())
      assert.deepEqual(await page.evaluate(() => globalThis.stats), {
        mounts: 2,
        stops: 2
      })
      await assert.rejects(
        page.evaluate(() => globalThis.row.setItems([])),
        /unavailable/
      )
    }
  )
})

test('packed Design inspector keeps independent row subscriptions and restores templates after reset', async () => {
  await withConsumer(
    ['sdk/canvas', 'sdk/design'],
    'workspace.js',
    async (page) => {
      await page.evaluate(() => globalThis.ready)
      await page.evaluate(() => {
        const e = globalThis.editor
        const row = e.getUI('dimensionRow')
        const stats = { subscribed: 0, released: 0 }

        e.select([e.drawRectangle({ x: 1, y: 2, width: 30, height: 40 })])
        const extra = {
          kind: 'number',
          id: 'depth',
          label: 'Depth',

          getValue: () => 5,

          subscribe: () => {
            stats.subscribed++

            return () => {
              stats.released++
            }
          },

          setValue: () => undefined
        }
        const removeDepth = row.insertAfter(row.items.width, extra)

        extra.id = 'changedAfterInstall'
        Object.assign(globalThis, { stats, removeDepth })
      })
      const panel = page
        .frameLocator('main iframe')
        .getByTestId('properties-panel')
      const input = panel.getByTestId('prop-depth')

      await expect(input).toHaveValue('5')
      await page.evaluate(() => {
        const row = globalThis.editor.getUI('positionRow')

        row.setItems([row.items.y, row.items.x])
      })
      assert.deepEqual(await page.evaluate(() => globalThis.stats), {
        subscribed: 1,
        released: 0
      })
      await page.evaluate(() => globalThis.editor.reset())
      await page.evaluate(() => {
        const e = globalThis.editor

        e.select([e.drawRectangle({ x: 0, y: 0, width: 30, height: 40 })])
      })
      await expect(input).toHaveValue('5')
      await page.evaluate(() =>
        globalThis.editor.setDisabledFeatures(['geometry'])
      )
      await expect(input).toHaveCount(0)
      await page.evaluate(() => globalThis.editor.setDisabledFeatures([]))
      await expect(input).toHaveValue('5')
      await page.evaluate(() => {
        globalThis.removeDepth()
        globalThis.removeDepth()
      })
      await expect(input).toHaveCount(0)
      const counts = await page.evaluate(() => globalThis.stats)

      assert.equal(counts.subscribed, counts.released)
      await expect(panel.getByTestId('prop-width')).toHaveValue('30')
    }
  )
})

test('packed Design JS composes a registered number at a row index and edits its document', async () => {
  await withConsumer(
    ['sdk/canvas', 'sdk/design'],
    'workspace.js',
    async (page) => {
      await page.evaluate(async () => {
        await globalThis.ready
        await globalThis.editor.destroy()
        const target = globalThis.document.body.appendChild(
          globalThis.document.createElement('aside')
        )

        target.id = 'geometry'
        const marker = {
          id: 'marker',
          node: { name: 'Marker', fields: { abc: 0, title: 'Marker' } }
        }
        const editor = await globalThis.createDesign(globalThis.host, {
          extensions: [marker],
          hideUI: true,
          uiTargets: { positionRow: 'geometry' }
        })
        const row = editor.getUI('positionRow')
        const field = globalThis.numberField(marker, 'abc', { label: 'Z' })
        const remove = row.insertAt(1, field)
        const id = editor.createNode(
          marker,
          { x: 1, y: 2, width: 20, height: 30 },
          { abc: 3 }
        )

        editor.select([id])
        Object.assign(globalThis, { editor, marker, row, field, remove, id })
      })
      const target = page.locator('#geometry')
      const z = target.getByLabel('Z', { exact: true })

      const order = () =>
        target
          .locator('input')
          .evaluateAll((inputs) =>
            inputs.map((input) => input.getAttribute('aria-label'))
          )

      await expect(z).toHaveValue('3')
      assert.deepEqual(await order(), ['X', 'Z', 'Y'])
      await z.fill('7')
      await z.press('Enter')
      await expect(z).toHaveValue('7')
      await page.evaluate(() => globalThis.editor.undo())
      await expect(z).toHaveValue('3')
      await page.evaluate(() => globalThis.editor.redo())
      await expect(z).toHaveValue('7')
      await page.evaluate(() =>
        globalThis.editor.setDisabledFeatures(['marker'])
      )
      await expect(z).toBeDisabled()
      await expect(z).toHaveValue('7')
      await assert.rejects(
        page.evaluate(() =>
          globalThis.editor.updateSelectedNodes(globalThis.marker, { abc: 11 })
        ),
        /Disabled Design feature/
      )
      await page.evaluate(() => globalThis.editor.setDisabledFeatures([]))
      await expect(z).toBeEnabled()
      await page.evaluate(() =>
        globalThis.editor.updateSelectedNodes(globalThis.marker, { abc: 9 })
      )
      await expect(z).toHaveValue('9')
      for (const index of [-1, 1.5, 4]) {
        await assert.rejects(
          page.evaluate((i) => globalThis.row.removeAt(i), index),
          /index/
        )
        await assert.rejects(
          page.evaluate(
            (i) => globalThis.row.insertAt(i, globalThis.field),
            index
          ),
          /index/
        )
      }

      assert.deepEqual(await order(), ['X', 'Z', 'Y'])
      await page.evaluate(() => {
        const { row, field, remove } = globalThis

        row.removeAt(1)
        row.insertAt(2, field)
        remove()
      })
      assert.deepEqual(await order(), ['X', 'Y', 'Z'])
      await page.evaluate(async () => {
        const { editor, marker, id } = globalThis
        const rectangle = editor.drawRectangle({
          x: 0,
          y: 0,
          width: 20,
          height: 30
        })

        editor.select([rectangle, id])
        if (editor.updateSelectedNodes(marker, { abc: 0 })) {
          throw new Error('Changed mixed selection')
        }

        const snapshot = await editor.save()

        await editor.destroy()
        const restored = await globalThis.createDesign(globalThis.host, {
          document: snapshot,
          extensions: [marker]
        })

        restored.select([id])
        restored.getUI('dimensionRow').insertAt(0, globalThis.field)
        globalThis.editor = restored
      })
      await expect(
        page.frameLocator('main iframe').getByLabel('Z', { exact: true })
      ).toHaveValue('9')
    }
  )
})
