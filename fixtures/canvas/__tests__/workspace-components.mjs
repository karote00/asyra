import assert from 'node:assert/strict'
import test from 'node:test'
import { expect } from '@playwright/test'
import { withConsumer } from './packed-consumer.mjs'

const design = ['sdk/canvas', 'sdk/design']

test('packed Design JavaScript places and composes live controls by name', async () => {
  await withConsumer(design, 'workspace.js', async (page) => {
    await page.evaluate(() => globalThis.ready)
    const frame = page.frameLocator('iframe').first()
    const ids = await page.evaluate(() => {
      const { editor } = globalThis
      const target = globalThis.document.body.appendChild(
        globalThis.document.createElement('aside')
      )

      target.id = 'tools'
      const group = editor.getUI('drawingTools')

      group.setItems([group.items.penToolIcon, group.items.selectToolIcon])
      globalThis.release = editor.getUI('penToolIcon').mount(target)

      return editor.uiKeys.map((id) => editor.getUI(id).id)
    })

    assert.ok(
      ids.includes('gradient') &&
        ids.includes('addFill') &&
        ids.includes('layerTree')
    )
    const pen = page.locator('#tools [data-toolbar-action="pen"]')

    await expect(pen).toHaveCount(1)
    await expect(frame.locator('[data-toolbar-action="pen"]')).toHaveCount(0)
    await page.evaluate(() => {
      const e = globalThis.editor
      const actions = e.getUI('toolbarActions')

      actions.setItems([
        actions.items['action.redo'],
        actions.items['action.undo']
      ])
      e.getUI('action.undo').mount(globalThis.document.querySelector('#tools'))
    })
    await expect(
      page.locator('#tools [data-toolbar-action="undo"]')
    ).toHaveCount(1)
    await pen.click()
    assert.equal(await page.evaluate(() => globalThis.editor.getTool()), 'pen')
    await page.evaluate(() => globalThis.editor.setDisabledFeatures(['pen']))
    await expect(pen).toHaveCount(0)
    await page.evaluate(() => globalThis.editor.setDisabledFeatures([]))
    await expect(pen).toHaveCount(1)
    await page.evaluate(() => {
      globalThis.release()
      const e = globalThis.editor
      const shape = e.drawRectangle({ x: 0, y: 0, width: 20, height: 20 })

      e.select([shape])
      const props = e.getUI('appearance')

      props.setItems([props.items.strokes, props.items.fills])
      const custom = {
        id: 'readout',

        mount(target) {
          target.textContent = 'Host readout'

          return () => {
            globalThis.cleaned = true
          }
        }
      }

      globalThis.removeItem = props.insertAt(1, custom)
      e.getUI('appearance').mount(globalThis.document.querySelector('#tools'))
    })
    const external = page.locator('#tools')

    await expect(external.getByText('Host readout')).toHaveCount(1)
    const order = await external
      .locator('[data-component="appearance"]')
      .evaluate((el) =>
        Array.from(
          el.querySelectorAll('[data-component], [data-template-item]')
        )
          .map((el) => el.dataset.component ?? el.dataset.templateItem)
          .filter((id) => ['fills', 'strokes', 'readout'].includes(id))
      )

    assert.deepEqual(order, ['strokes', 'readout', 'fills'])
    await external.locator('[data-fill-action="add"]').click()
    await page.evaluate(() => globalThis.removeItem())
    await expect(external.getByText('Host readout')).toHaveCount(0)
    assert.equal(await page.evaluate(() => globalThis.cleaned), true)
    await page.evaluate(async () => {
      const e = globalThis.editor

      e.setPresentation({ hideUI: true })
      const node = globalThis.document.querySelector('#tools')
      const releaseOld = e.getUI('penToolIcon').mount(node)
      const other = globalThis.document.body.appendChild(
        globalThis.document.createElement('aside')
      )

      other.id = 'other'
      e.getUI('penToolIcon').mount(other)
      releaseOld()
      const host = globalThis.document.body.appendChild(
        globalThis.document.createElement('main')
      )

      host.style.cssText = 'width:300px;height:300px'
      globalThis.second = await globalThis.createDesign(host)
    })
    await page.locator('#other [data-toolbar-action="pen"]').click()
    assert.deepEqual(
      await page.evaluate(() => [
        globalThis.editor.getTool(),
        globalThis.second.getTool()
      ]),
      ['pen', 'select']
    )
    await page.evaluate(() => globalThis.editor.destroy())
    await expect(page.locator('#other > *, #tools > *')).toHaveCount(0)
  })
})

test('packed Design React places an editor component in JSX with hidden chrome', async () => {
  await withConsumer(
    [
      ...design,
      'node_modules/react',
      'node_modules/react-dom',
      'node_modules/scheduler',
      'node_modules/@types/react',
      'node_modules/csstype'
    ],
    'component-react.js',
    async (page) => {
      const pen = page.locator('aside [data-toolbar-action="pen"]')

      await expect(pen).toHaveCount(1)
      await pen.click()
      assert.equal(
        await page.evaluate(() => globalThis.editor.getTool()),
        'pen'
      )
      await expect(
        page.frameLocator('iframe').locator('[data-editor-panel="toolbar"]')
      ).toHaveCount(0)
      await page.getByRole('button', { name: 'Hide pen' }).click()
      await expect(pen).toHaveCount(0)
    }
  )
})

test('packed Design transfers a live component between section templates', async () => {
  await withConsumer(design, 'workspace.js', async (page) => {
    await page.evaluate(() => globalThis.ready)
    await page.evaluate(() => {
      const e = globalThis.editor
      const view = e.getUI('view')

      globalThis.restore = view.insertAt(0, e.getUI('penToolIcon'))
    })
    const board = page.frameLocator('iframe')
    const pen = board.locator(
      '[data-toolbar-section="view"] [data-toolbar-action="pen"]'
    )

    await pen.click()
    assert.equal(await page.evaluate(() => globalThis.editor.getTool()), 'pen')
    await expect(
      board.locator(
        '[data-toolbar-section="commands"] [data-toolbar-action="pen"]'
      )
    ).toHaveCount(0)
    await page.evaluate(() => globalThis.restore())
    await expect(
      board.locator(
        '[data-toolbar-section="commands"] [data-toolbar-action="pen"]'
      )
    ).toHaveCount(1)
    assert.ok(
      await page.evaluate(() => {
        try {
          globalThis.editor
            .getUI('view')
            .insertAt(0, globalThis.editor.getUI('toolbar'))

          return false
        } catch (error) {
          return /contain itself/.test(error.message)
        }
      })
    )
  })
})

test('packed Design keeps a moved inspector connected to selection, paint and document history', async () => {
  await withConsumer(design, 'workspace.js', async (page) => {
    await page.evaluate(() => globalThis.ready)
    await page.evaluate(() => {
      const editor = globalThis.editor
      const side = globalThis.document.body.appendChild(
        globalThis.document.createElement('aside')
      )

      side.id = 'inspector'
      const id = editor.drawRectangle({ x: 4, y: 8, width: 60, height: 40 })

      editor.select([id])
      globalThis.rect = id
      editor.getUI('properties').mount(side)
    })
    const side = page.locator('#inspector')
    const board = page.frameLocator('iframe')

    await expect(board.locator('[data-editor-panel="properties"]')).toHaveCount(
      0
    )
    await expect
      .poll(() =>
        board
          .locator('[data-editor-workspace]')
          .evaluate((node) =>
            globalThis
              .getComputedStyle(node)
              .gridTemplateColumns.split(' ')
              .at(-1)
          )
      )
      .toBe('0px')
    await side
      .locator('[data-fill-id] [data-color-control="toggle"]')
      .first()
      .click()
    await side.locator('[data-fill-mode="gradient"]').click()
    await side.locator('[data-gradient-field="type"]').selectOption('radial')
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            globalThis.editor.getElementProperties(globalThis.rect, ['fills'])
              .fills[0].gradient.gradientType
        )
      )
      .toBe('radial')
    await page.evaluate(() => globalThis.editor.undo())
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            globalThis.editor.getElementProperties(globalThis.rect, ['fills'])
              .fills[0].gradient.gradientType
        )
      )
      .toBe('linear')
    await page.evaluate(() => {
      const editor = globalThis.editor
      const text = editor.createText('Title', {
        x: 0,
        y: 0,
        width: 100,
        height: 40
      })

      editor.select([text])
      const fields = editor.getUI('textFields')

      fields.setItems([
        fields.items.textAlignmentRow,
        fields.items.fontFamilyRow
      ])
    })
    await expect(side.locator('[data-text-alignment="right"]')).toBeVisible()
    await expect(
      side.locator('[data-inspector-field="fontStyle"]')
    ).toHaveCount(0)
  })
})
