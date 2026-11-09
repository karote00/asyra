import { createLocalReferenceTools } from '../local-reference-tools'
import recorded from '../../test-data/ai-drawing/fixtures/discovery-identity-stop-20261107.json'
import { expect, it, vi } from 'vitest'
vi.mock('../../src/contexts', () => ({ default: {} }))
import { basicApiContracts } from '../../src/ai/basic-api-catalog'
import { createBasicApiActions } from '../../src/ai/basic-api-actions'
import { createAiToolContract } from '@asyra/ai-agent-runtime'
import { createLocalOperationTools } from '../local-operation-tools'
import { invokeLocalTool } from '../local-tool-invocation'
import { evaluationToolStop } from '../evaluation-control'
import { toolSemantics } from '../../src/ai/tool-contract'

const setup = () => {
  const dispatch = vi.fn()
  const owner = createLocalOperationTools(
    createBasicApiActions().map(createAiToolContract),
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    dispatch,
    {
      getNativeTools: () =>
        ['first', 'second'].map((namespace) => ({
          name: 'ambiguous',
          namespace,
          description: 'A read capability.',
          inputSchema: { type: 'object' },
          ...toolSemantics({ type: 'object' }, 'read', [])
        }))
    }
  )
  const definition = owner.definitions.find(
    (entry) => entry.name === 'describe_design_apis'
  )

  if (!definition) {
    throw new Error('Missing discovery definition')
  }

  const call = async (input: unknown) => {
    const reply = await invokeLocalTool(
      owner,
      definition,
      input,
      new AbortController().signal
    )

    return { reply, value: JSON.parse(reply.text) }
  }

  return { call, dispatch }
}

it('reproduces the recorded stop and delivers mixed identity recovery without stopping evaluation', async () => {
  expect(evaluationToolStop(recorded.output)?.kind).toBe('tool-failure')
  const { call, dispatch } = setup()
  const { value, reply } = await call(recorded.input)

  expect(value.missingOperations).toEqual(['fill.updateFills'])
  expect(value.apis.map((entry: { name: string }) => entry.name)).toEqual(
    recorded.output.apis.map((entry) => entry.name)
  )
  expect(value).toMatchObject({
    status: 'partial',
    settlement: 'completed',
    recovery: { kind: 'select_identity' }
  })
  expect(evaluationToolStop(reply)).toBeUndefined()
  expect(
    value.apis.every(
      (entry: { definition: { availableInResponse: boolean } }) =>
        entry.definition.availableInResponse
    )
  ).toBe(true)
  expect(dispatch).not.toHaveBeenCalled()
  const corrected = await call({
    operations: ['fill.updateFillsAtIndex'],
    view: 'usage'
  })

  expect(corrected.value.missingOperations).toEqual([])
  expect(corrected.value.toolOutcome.status).toBe('success')
  expect(evaluationToolStop(corrected.reply)).toBeUndefined()
})

it.each([
  { operations: ['fill.updateFills'], view: 'usage' },
  { names: ['missing-native'], view: 'usage' },
  { names: ['ambiguous'], view: 'usage' },
  { names: ['hierarchy.groupElements', 'ambiguous'], view: 'usage' }
])(
  'keeps identity selection recoverable without substituting a route: %j',
  async (input) => {
    const { call, dispatch } = setup()
    const { value, reply } = await call(input)

    expect(value).toMatchObject({
      settlement: 'completed',
      recovery: { kind: 'select_identity' }
    })
    expect(evaluationToolStop(reply)).toBeUndefined()
    expect(dispatch).not.toHaveBeenCalled()
  }
)

it('preserves identity recovery through complete content paging and retained refresh', async () => {
  const { call } = setup()
  const input = {
    operations: [
      ...basicApiContracts.map((entry) => entry.operation),
      'missing.operation'
    ],
    view: 'full'
  }
  let response = await call(input)
  const pages: string[] = []

  while (response.value.contentDelivery) {
    expect(evaluationToolStop(response.reply)).toBeUndefined()
    pages.push(response.value.contentDelivery.text)
    if (!response.value.contentDelivery.next) {
      break
    }

    response = await call(response.value.contentDelivery.next.arguments)
  }

  expect(pages.length).toBeGreaterThan(1)
  const full = JSON.parse(pages.join(''))

  expect(full.missingOperations).toEqual(['missing.operation'])
  const retained = await call({
    fromResult: full.resultKey,
    names: ['hierarchy.groupElements', 'missing.operation']
  })

  expect(evaluationToolStop(retained.reply)).toBeUndefined()
  const refreshed = await call({ ...recorded.input, refresh: true })

  expect(evaluationToolStop(refreshed.reply)).toBeUndefined()
})

it('stops when an unresolved identity accompanies an unavailable known field contract', async () => {
  const { call } = setup()
  const { value, reply } = await call({
    names: ['hierarchy.groupElements', 'missing-native'],
    schemaPaths: ['/notAnExistingSchemaField']
  })

  expect(value.code).toBe('DEFINITION_UNAVAILABLE')
  expect(value.recovery?.kind).not.toBe('select_identity')
  expect(evaluationToolStop(reply)?.kind).toBe('tool-failure')
})

it.each([
  'unknown-settlement',
  'independent-issue',
  'error',
  'failed-delivery'
])('does not hide %s behind identity recovery', async (failure) => {
  const { call } = setup()
  const { value } = await call(recorded.input)

  if (failure === 'unknown-settlement') {
    value.toolOutcome.settlement = 'unknown'
  }

  if (failure === 'independent-issue') {
    value.toolOutcome.issues.push({
      code: 'DELIVERY_FAILED',
      message: 'Output missing'
    })
  }

  if (failure === 'error') {
    value.error = 'Transport failed'
  }

  if (failure === 'failed-delivery') {
    value.code = 'DEFINITION_UNAVAILABLE'
  }

  expect(evaluationToolStop({ text: JSON.stringify(value) })?.kind).toBe(
    'tool-failure'
  )
})

it.each(
  ['import_reference_image', 'a', 'b', 'c'].flatMap((name) =>
    [
      'import reference image url',
      'import reference image from url',
      'import an image from a reference url'
    ].map((query) => ({ name, query }))
  )
)(
  'delivers the recorded complete import purpose through the host for %s',
  async ({ name, query }) => {
    const fixture = (
      await import('../../test-data/ai-drawing/fixtures/task-continuity-20261107.json')
    ).default
    const dispatch = vi.fn()
    const owner = createLocalOperationTools(
      createBasicApiActions().map(createAiToolContract),
      {
        modelActions: (a) => a,

        resolveBatch: (v) => v
      },
      dispatch,
      {
        getNativeTools: () => [
          {
            ...createLocalReferenceTools(vi.fn(), vi.fn()).definitions[0],
            name,
            namespace: 'sources'
          }
        ]
      }
    )
    const definition = owner.definitions.find(
      (d) => d.name === 'describe_design_apis'
    )

    if (!definition) {
      throw Error('Missing discovery')
    }

    const reply = await invokeLocalTool(
      owner,
      definition,
      { ...fixture.query, query },
      new AbortController().signal
    )
    const value = JSON.parse(reply.text)

    expect(reply.success, reply.text).toBe(true)
    expect(value.tools[0].rank).toBe(1)
    expect(value.tools[0].match.unmatchedTerms).toEqual([])
    expect(value.tools[0].usageGuide.parameters).toBeDefined()
    expect(value.tools[0].execution).toEqual({
      kind: 'host-operation',
      tool: 'execute_design',
      operation: 'sources.' + name
    })
    expect(dispatch).not.toHaveBeenCalled()
  }
)
