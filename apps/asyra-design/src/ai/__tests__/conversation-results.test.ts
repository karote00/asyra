import { expect, it } from 'vitest'
import { createConversationResults } from '../conversation-results'

it('retains selected snapshots across turns of the same document conversation only', () => {
  let document = {}
  const app = createConversationResults(() => document)
  const first = app.open('one')

  first.exchange({ save: { windows: ['id-1', 'id-2'] } })
  expect(app.open('one').names()).toEqual(['windows'])
  expect(
    app
      .open('one')
      .exchange({ read: { windows: { name: 'windows', path: '' } } })
  ).toEqual({
    windows: ['id-1', 'id-2']
  })
  expect(() =>
    app
      .open('two')
      .exchange({ read: { windows: { name: 'windows', path: '' } } })
  ).toThrow()
  document = {}
  expect(app.open('one').names()).toEqual([])
  expect(() => first.exchange({ save: { late: 5 } })).toThrow()
})

it('projects from immutable snapshots before transport and atomically refuses oversized replacement', () => {
  const context = createConversationResults(() => 1).open('tower')
  const value = { ids: ['pane-1', 'pane-2'], coordinates: [45, 70] }

  context.exchange({ save: { facade: value } })
  value.ids.pop()
  expect(
    context.exchange({
      read: {
        dimension: { name: 'facade', path: '/coordinates/1' },
        id: { name: 'facade', path: '/ids/1' }
      }
    })
  ).toEqual({ dimension: 70, id: 'pane-2' })
  expect(() =>
    context.exchange({
      save: { facade: [], extra: 'x'.repeat(4 * 1024 * 1024) }
    })
  ).toThrow(/capacity/)
  expect(context.names()).toEqual(['facade'])
  expect(
    context.exchange({ read: { id: { name: 'facade', path: '/ids/1' } } })
  ).toEqual({ id: 'pane-2' })
})

it('publishes bounded saved-value navigation without values or rescanning on reads', () => {
  const app = createConversationResults(() => 1)
  const context = app.open('crown')

  context.exchange({
    save: {
      crown: {
        keyToId: { top: 'private-id' },
        draft: {
          children: Array.from({ length: 1000 }, () => ({
            name: 'private-name'
          }))
        }
      }
    }
  })
  const catalog = context.describe()

  expect(catalog[0]).toMatchObject({ name: 'crown', type: 'object' })
  expect(catalog[0].paths).toContainEqual({ path: '/keyToId', type: 'object' })
  expect(JSON.stringify(catalog)).not.toMatch(/private-id|private-name/)
  expect(catalog[0].paths.length).toBeLessThanOrEqual(16)
  expect(context.describe()[0]).toBe(catalog[0])
  expect(app.open('crown').describe()[0]).toBe(catalog[0])
  context.exchange({ save: { crown: [] } })
  expect(context.describe()[0]).not.toBe(catalog[0])
  expect(app.open('other').describe()).toEqual([])
})

it('navigates a saved subtree without returning its values or cloning the full draft', () => {
  const context = createConversationResults(() => 1).open('navigation')

  context.exchange({
    save: {
      source: {
        children: [
          {
            members: [
              { vertices: [{ x: 12345, y: 67890, z: 100 }] },
              { vertices: [{ x: 54321, y: 98760, z: 200 }] }
            ]
          }
        ]
      }
    }
  })
  const result = context.exchange({
    read: {
      structure: { name: 'source', path: '/children/0', view: 'shape' }
    }
  })

  expect(result.structure).toMatchObject({
    name: 'source',
    paths: expect.arrayContaining([
      { path: '/children/0/members', type: 'array', length: 2 },
      { path: '/children/0/members/0', type: 'object' }
    ])
  })
  expect(JSON.stringify(result)).not.toMatch(/12345|67890|54321|98760/)
  expect(
    context.exchange({
      read: {
        value: { name: 'source', path: '/children/0/members/1/vertices/0/x' }
      }
    })
  ).toEqual({ value: 54321 })
  expect(() =>
    context.exchange({
      read: { missing: { name: 'source', path: '/missing', view: 'shape' } }
    })
  ).toThrow('Missing result field')
})

it('selects escaped keys from separate saved composition entries across turns', () => {
  const app = createConversationResults(() => 'document')

  app.open('tower').exchange({
    save: {
      targets: [
        { compositionId: 'base', keyToId: { 'panel/x~y': 'base-id' } },
        { compositionId: 'crown', keyToId: { 'panel/x~y': 'crown-id' } }
      ]
    }
  })
  expect(
    app.open('tower').exchange({
      read: {
        base: { name: 'targets', path: '/0/keyToId/panel~1x~0y' },
        crown: { name: 'targets', path: '/1/keyToId/panel~1x~0y' }
      }
    })
  ).toEqual({ base: 'base-id', crown: 'crown-id' })
})
