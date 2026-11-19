import { SystemPropertyKeys } from '../../constants'
import { createAiContextProvider } from '../context'
import { afterEach, expect, it, vi } from 'vitest'
import core from '../../contexts'
import { createConversationDrafts } from '../conversation-drafts'

const owners: ReturnType<typeof createConversationDrafts>[] = []

afterEach(() => {
  owners.forEach((owner) => owner.dispose())
  owners.length = 0
  vi.restoreAllMocks()
})

it('stores draft values and observes changes through the actual Core system context', () => {
  const owner = createConversationDrafts(core)
  const changed = vi.fn()

  owners.push(owner)
  const unsubscribe = owner.subscribe(changed)

  changed.mockClear()
  owner.update('conversation-a', (draft) => ({
    ...draft,
    text: 'Keep the idea.'
  }))
  expect(
    core.getSystemProperty(SystemPropertyKeys.CONVERSATION_DRAFTS)
  ).toEqual({
    'conversation-a': {
      text: 'Keep the idea.',
      attachments: [],
      error: null,
      generation: 0
    }
  })
  expect(changed).toHaveBeenCalledTimes(1)
  expect(owner.get('conversation-a')).toBe(owner.get('conversation-a'))
  expect(owner.get('conversation-b').text).toBe('')
  unsubscribe()
})

it('clears document draft state and subscriptions and rejects late writes after disposal', () => {
  const owner = createConversationDrafts(core)
  const changed = vi.fn()

  owners.push(owner)
  owner.subscribe(changed)
  owner.update('a', (draft) => ({ ...draft, text: 'Retained' }))
  changed.mockClear()
  owner.dispose()
  owner.update('a', (draft) => ({ ...draft, text: 'Late' }))
  expect(
    core.getSystemProperty(SystemPropertyKeys.CONVERSATION_DRAFTS)
  ).toEqual({})
  expect(owner.get('a').text).toBe('')
  expect(changed).not.toHaveBeenCalled()
})

it('rejects invalid writes at the Core property owner without discarding the valid draft', () => {
  const owner = createConversationDrafts(core)
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

  owners.push(owner)
  owner.update('a', (draft) => ({ ...draft, text: 'Valid draft' }))
  const accepted = core.getSystemProperty(
    SystemPropertyKeys.CONVERSATION_DRAFTS
  )

  for (const invalid of [
    [],
    { a: { text: 1, attachments: [], error: null, generation: 0 } },
    { a: { ...owner.get('a'), generation: -1 } },
    {
      a: {
        ...owner.get('a'),
        attachments: [
          { mediaType: 'image/png', dataUrl: 'wrong', name: 'a.png', size: 1 }
        ]
      }
    }
  ]) {
    core.setSystemProperty(SystemPropertyKeys.CONVERSATION_DRAFTS, invalid)
    expect(core.getSystemProperty(SystemPropertyKeys.CONVERSATION_DRAFTS)).toBe(
      accepted
    )
  }

  expect(warning).toHaveBeenCalledTimes(4)
})

it('keeps private drafts out of canonical saved data and the provider context', async () => {
  const owner = createConversationDrafts(core)

  owners.push(owner)
  owner.update('a', (draft) => ({
    ...draft,
    text: 'Private unsent requirement'
  }))
  expect(core.getSystemContextSnapshot()).toHaveProperty(
    SystemPropertyKeys.CONVERSATION_DRAFTS
  )
  const saved = await core.save()

  expect(saved).not.toHaveProperty(
    `systemContext.${SystemPropertyKeys.CONVERSATION_DRAFTS}`
  )
  const context = await createAiContextProvider({
    getSelectedElementIds: () => [],

    getWorkspaceId: () => null,

    getElementCount: () => 0,

    getElementSummary: () => ({}),

    getSystemSnapshot: () => core.getSystemContextSnapshot()
  }).getContext({
    intent: 'Submitted request',
    signal: new AbortController().signal
  })

  expect(JSON.stringify(context)).not.toContain('Private unsent requirement')
  expect(context).not.toHaveProperty(SystemPropertyKeys.CONVERSATION_DRAFTS)
})
