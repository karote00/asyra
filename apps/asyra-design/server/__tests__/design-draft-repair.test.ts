import { expect, it } from 'vitest'
import { createDesignDraftRepairStore } from '../design-draft-repair'
import { DesignPreparationLimits as limits } from '../../src/ai/prepared-design'

it('retains immutable rejected source with exact request-local references', () => {
  const store = createDesignDraftRepairStore()
  const source = { children: [{ key: 'duplicate' }], 'a/b~c': 1 }
  const draftId = store.retain(source)
  if (!draftId) throw new Error('Expected the valid draft to be retained')
  source.children[0].key = 'later caller change'
  const repair = {
    draftId,
    replacements: [{ path: '/children/0/key', value: 'corrected' }]
  }
  expect(store.repair(repair)).toEqual({
    children: [{ key: 'corrected' }],
    'a/b~c': 1
  })
  expect(
    store.repair({ draftId, replacements: [{ path: '/a~1b~0c', value: 2 }] })
  ).toEqual({
    children: [{ key: 'duplicate' }],
    'a/b~c': 2
  })
  expect(() => createDesignDraftRepairStore().repair(repair)).toThrow(
    /unavailable/
  )
  store.release(draftId)
  expect(() => store.repair(repair)).toThrow(/unavailable/)
})

it('bounds retained source and makes eviction explicit without changing source admission', () => {
  const store = createDesignDraftRepairStore()
  const first = store.retain({ key: 'first' })
  for (let index = 0; index < limits.retainedDrafts; index++)
    store.retain({ key: index })
  expect(() =>
    store.repair({
      draftId: first,
      replacements: [{ path: '/key', value: 'new' }]
    })
  ).toThrow(/unavailable/)
  expect(
    store.retain({ text: 'x'.repeat(limits.retainedDraftBytes) })
  ).toBeUndefined()
})

it('rejects nonexisting or malformed paths without changing a retained draft', () => {
  const store = createDesignDraftRepairStore()
  const draftId = store.retain({ children: [{ key: 'old' }] })
  for (const path of [
    '/missing',
    '/children/4/key',
    '/children/length',
    '/children/-/key',
    '/children/0/~2',
    '/__proto__/polluted'
  ]) {
    expect(() =>
      store.repair({ draftId, replacements: [{ path, value: 'new' }] })
    ).toThrow()
  }
  expect(() =>
    store.repair({
      draftId,
      replacements: [
        { path: '/children/0/key', value: 'one' },
        { path: '/children/0/key', value: 'two' }
      ]
    })
  ).toThrow(/unique/)
  expect(
    store.repair({
      draftId,
      replacements: [{ path: '/children/0/key', value: 'new' }]
    })
  ).toEqual({ children: [{ key: 'new' }] })
})
