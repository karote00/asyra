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
