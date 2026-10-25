import { basicApiContracts } from '../../src/ai/basic-api-catalog'
import { expect, it, vi } from 'vitest'
import { createLocalKnowledgeTools } from '../local-knowledge'
import { AiDesignToolIds } from '../../src/constants/ai-design'
import { operationInputIssue } from '../operation-input-schema'

const advice =
  'Retain every constraint, including boundary and recovery conditions. '.repeat(
    700
  )
const files = [
  {
    id: 'test.advice',
    revision: 1,
    markdown:
      '---\n' +
      JSON.stringify({
        description: 'Delivery regression',
        provenance: ['Formal fixture']
      }) +
      '\n---\n' +
      advice
  }
]

it('delivers complete advice through bounded same-owner pages without source reload', async () => {
  const load = vi.fn(async () => files)
  const owner = createLocalKnowledgeTools('bounded-advice', load)
  const tool = AiDesignToolIds.READ_KNOWLEDGE
  let input: Record<string, unknown> = { ids: ['test.advice'] }
  let text = '',
    offset = 0,
    pages = 0
  const definition = owner.definitions.find((d) => d.name === tool)
  if (!definition) throw new Error('Missing read declaration')
  try {
    for (;;) {
      const raw = await owner.call(tool, input, new AbortController().signal)
      expect(Buffer.byteLength(raw)).toBeLessThanOrEqual(24000)
      const value = JSON.parse(raw)
      expect(
        operationInputIssue(value, definition.outputSchema)
      ).toBeUndefined()
      const page = value.contentDelivery
      expect(page.kind).toBe('json-fragment')
      expect(page.startByte).toBe(offset)
      text += page.text
      offset = page.endByte
      pages++
      if (page.lastPage) {
        expect(offset).toBe(page.totalBytes)
        break
      }
      input = page.next.arguments
      expect(pages).toBeLessThan(20)
    }
    expect(JSON.parse(text).documents[0].text).toBe(advice)
    expect(load).toHaveBeenCalledTimes(1)
  } finally {
    owner.dispose()
  }
})

import {
  createLocalOperationTools,
  localToolResultInstructions
} from '../local-operation-tools'
import { toolSemantics } from '../../src/ai/tool-contract'

it('preserves the complete schema and execution route through bounded discovery pages', async () => {
  const inputSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['choice'],
    properties: {
      choice: {
        enum: Array.from(
          { length: 700 },
          (_, i) => `${i}: ${'Declared valid choice. '.repeat(4)}`
        )
      }
    }
  }
  const native = {
    name: 'choose',
    namespace: 'test_tools',
    description: 'Choose exactly one declared value.',
    inputSchema,
    ...toolSemantics({ type: 'object' }, 'read', [])
  }
  const dispatch = vi.fn()
  let generation = 0
  const owner = createLocalOperationTools(
    basicApiContracts,
    { modelActions: (a) => a, resolveBatch: (v) => v },
    dispatch,
    { getNativeTools: () => [native], getNativeToolsRevision: () => generation }
  )
  let input: Record<string, unknown> = { names: ['test_tools.choose'] }
  let text = '',
    first: Record<string, unknown> | undefined
  for (let index = 0; index < 20; index++) {
    const raw = await owner.call(
      AiDesignToolIds.DESCRIBE_DESIGN_APIS,
      input,
      new AbortController().signal
    )
    expect(Buffer.byteLength(raw)).toBeLessThanOrEqual(24000)
    const declared = owner.definitions.find(
      (d) => d.name === AiDesignToolIds.DESCRIBE_DESIGN_APIS
    )
    if (!declared) throw new Error('Missing discovery contract')
    await verifyNativePage(owner, declared, input, 'design_operations')
    const page = JSON.parse(raw).contentDelivery
    expect(page.kind).toBe('json-fragment')
    text += page.text
    if (!first) first = page.next.arguments
    if (page.lastPage) break
    input = page.next.arguments
  }
  const definition = JSON.parse(text).tools[0]
  expect(definition.inputSchema).toEqual(inputSchema)
  expect(definition.execution).toEqual({
    kind: 'native-tool',
    namespace: 'test_tools',
    tool: 'choose'
  })
  generation++
  native.description = 'Changed declaration.'
  await expect(
    owner.call(
      AiDesignToolIds.DESCRIBE_DESIGN_APIS,
      first,
      new AbortController().signal
    )
  ).rejects.toThrow(/stale|changed/i)
  expect(dispatch).not.toHaveBeenCalled()
})

import { invokeLocalTool } from '../local-tool-invocation'
import { createHash } from 'node:crypto'

it('retains every current Knowledge page in real native Code Mode successor requests', async () => {
  const nativeModule = new URL(
    '../../test-data/knowledge-evaluation/native-delivery.mjs',
    import.meta.url
  ).href
  const { runNativeDelivery } = await import(/* @vite-ignore */ nativeModule)
  const owner = createLocalKnowledgeTools(
    'native-bounded-advice',
    async () => files
  )
  const tool = AiDesignToolIds.READ_KNOWLEDGE
  const definition = owner.definitions.find((d) => d.name === tool)
  if (!definition) throw new Error('Missing definition')
  let input: Record<string, unknown> = { ids: ['test.advice'] },
    assembled = ''
  try {
    for (let count = 0; count < 20; count++) {
      const reply = await invokeLocalTool(
        owner,
        definition,
        input,
        new AbortController().signal
      )
      expect(reply.success, reply.text.slice(0, 1200)).toBe(true)
      expect(Buffer.byteLength(reply.text)).toBeLessThanOrEqual(24000)
      const fixture = {
        tool,
        namespace: 'design_knowledge',
        input,
        raw: reply.text,
        nativeVersion: 'codex-cli 0.160.0',
        sha256: createHash('sha256').update(reply.text).digest('hex'),
        declaration: {
          type: 'namespace',
          name: 'design_knowledge',
          description: 'Advisory Knowledge',
          tools: [
            {
              type: 'function',
              name: tool,
              description: definition.description,
              inputSchema: definition.inputSchema,
              deferLoading: true
            }
          ]
        }
      }
      const evidence = await runNativeDelivery({ fixture, mode: 'code' })
      expect(evidence.comparison.exact).toBe(true)
      expect(evidence.comparison.truncationMarker).toBe(false)
      expect(evidence.receipt.status).toBe('saved')
      const page = JSON.parse(reply.text).contentDelivery
      assembled += page.text
      if (page.lastPage) break
      input = page.next.arguments
    }
    expect(JSON.parse(assembled).documents[0].text).toBe(advice)
  } finally {
    owner.dispose()
  }
}, 60000)

it('preserves cancellation and rehydrate invalidation without repeating source loads', async () => {
  const load = vi.fn(async () => files)
  const owner = createLocalKnowledgeTools('recovery-pages', load)
  const tool = AiDesignToolIds.READ_KNOWLEDGE
  const read = (args: unknown, signal = new AbortController().signal) =>
    owner.call(tool, args, signal).then(JSON.parse)
  try {
    const first = await read({ ids: ['test.advice'] })
    const next = first.contentDelivery.next.arguments
    const cancelled = new AbortController()
    cancelled.abort()
    await expect(read(next, cancelled.signal)).rejects.toThrow()
    expect(await read(next)).toEqual(await read(next))
    const reset = await read({ ids: ['test.advice'], rehydrate: true })
    expect(reset.contentDelivery.revision).not.toBe(
      first.contentDelivery.revision
    )
    await expect(read(next)).rejects.toThrow(/stale/)
    expect(reset.contentDelivery.next.arguments.rehydrate).toBeUndefined()
    expect(
      (await read(reset.contentDelivery.next.arguments)).contentDelivery
        .startByte
    ).toBe(reset.contentDelivery.endByte)
    expect(load).toHaveBeenCalledTimes(1)
  } finally {
    owner.dispose()
  }
})

import type {
  LocalToolOwner,
  LocalToolDefinition
} from '../local-tool-invocation'
async function verifyNativePage(
  owner: LocalToolOwner,
  definition: LocalToolDefinition,
  input: Record<string, unknown>,
  namespace: string
) {
  const nativeModule = new URL(
    '../../test-data/knowledge-evaluation/native-delivery.mjs',
    import.meta.url
  ).href
  const { runNativeDelivery } = await import(/* @vite-ignore */ nativeModule)
  const reply = await invokeLocalTool(
    owner,
    definition,
    input,
    new AbortController().signal
  )
  expect(reply.success, reply.text.slice(0, 1200)).toBe(true)
  const evidence = await runNativeDelivery({
    mode: 'code',
    fixture: {
      tool: definition.name,
      namespace,
      input,
      raw: reply.text,
      nativeVersion: 'codex-cli 0.160.0',
      sha256: createHash('sha256').update(reply.text).digest('hex'),
      declaration: {
        type: 'namespace',
        name: namespace,
        description: 'Canonical read owner',
        tools: [
          {
            type: 'function',
            name: definition.name,
            description: definition.description,
            inputSchema: definition.inputSchema,
            deferLoading: true
          }
        ]
      }
    }
  })
  expect(evidence.comparison.exact).toBe(true)
  expect(evidence.comparison.truncationMarker).toBe(false)
  expect(evidence.receipt.status).toBe('saved')
  return evidence.directory as string
}

import { runInNewContext } from 'node:vm'

const advertisedExample = (description: string) => {
  const code =
    /Information forwarding example[^\n]*\n```javascript\n([\s\S]*?)\n```/.exec(
      description
    )?.[1]
  expect(
    code,
    'Actual discovery description must deliver executable forwarding'
  ).toBeTruthy()
  if (!code) throw new Error('Missing advertised information example')
  return code
}

const forwardingOwner = () => {
  const native = {
    name: 'choose',
    namespace: 'example_tools',
    description: 'Choose a permitted value.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['choice'],
      properties: {
        choice: {
          enum: Array.from({ length: 700 }, (_, i) =>
            `${i}: declared constraint 材質🌲 "quoted". `.repeat(3)
          )
        }
      }
    },
    ...toolSemantics({ type: 'object' }, 'read', [])
  }
  const dispatch = vi.fn()
  const owner = createLocalOperationTools(
    basicApiContracts,
    { modelActions: (a) => a, resolveBatch: (v) => v },
    dispatch,
    { getNativeTools: () => [native] }
  )
  const definition = owner.definitions.find(
    (d) => d.name === 'describe_design_apis'
  )
  if (!definition) throw new Error('Missing discovery definition')
  const code = advertisedExample(definition.description)
  const values = new Map<string, unknown>()
  const output: string[] = []
  const forward = (result: string, deliveryKey = 'contract') =>
    runInNewContext(code, {
      result,
      deliveryKey,
      load: (key: string) => structuredClone(values.get(key)),
      store: (key: string, value: unknown) =>
        values.set(key, structuredClone(value)),
      text: (text: string) => output.push(text)
    })
  const read = async (input: Record<string, unknown>) =>
    invokeLocalTool(owner, definition, input, new AbortController().signal)
  return {
    owner,
    definition,
    native,
    code,
    values,
    output,
    forward,
    read,
    dispatch
  }
}

it('executes actual advertised information forwarding and replays retained pages without reads', async () => {
  const h = forwardingOwner()
  let input: Record<string, unknown> = { names: ['example_tools.choose'] }
  const pages: string[] = []
  for (let i = 0; i < 20; i++) {
    const reply = await h.read(input)
    expect(reply.success).toBe(true)
    pages.push(reply.text)
    h.forward(reply.text)
    expect(h.output.at(-1)).toBe(reply.text)
    const page = JSON.parse(reply.text).contentDelivery
    if (page.lastPage) break
    input = page.next.arguments
    expect(h.values.get('contract')).toMatchObject({ complete: false })
  }
  const state = h.values.get('contract') as {
    value: { tools: { inputSchema: unknown }[] }
    pages: string[]
    complete: boolean
  }
  expect(state.complete).toBe(true)
  expect(state.value.tools[0].inputSchema).toEqual(h.native.inputSchema)
  expect(state.pages).toEqual(pages)
  for (const page of state.pages) h.forward(page)
  expect(h.values.get('contract')).toEqual(state)
  expect(h.output).toEqual([...pages, ...pages])
  expect(h.dispatch).not.toHaveBeenCalled()
})

const collectForwardingPages = async (
  h: ReturnType<typeof forwardingOwner>,
  query: Record<string, unknown> = { names: ['example_tools.choose'] }
) => {
  let input = query
  const pages: { input: Record<string, unknown>; raw: string }[] = []
  for (let i = 0; i < 20; i++) {
    const reply = await h.read(input)
    expect(reply.success).toBe(true)
    pages.push({ input, raw: reply.text })
    const page = JSON.parse(reply.text).contentDelivery
    if (!page || page.lastPage) return pages
    input = page.next.arguments
  }
  throw new Error('Information did not terminate')
}

it('rejects incomplete or incoherent advertised-example input while preserving retained content', async () => {
  const h = forwardingOwner()
  const pages = await collectForwardingPages(h)
  expect(pages.length).toBeGreaterThan(2)
  expect(() => h.forward(pages[pages.length - 1].raw)).toThrow(/Missing/)
  expect(h.values.size).toBe(0)
  h.forward(pages[0].raw)
  const before = structuredClone(h.values.get('contract'))
  expect(() => h.forward(pages[2].raw)).toThrow(/Missing/)
  for (const change of [
    { revision: '0'.repeat(64) },
    { endByte: 1 },
    { totalBytes: 1 },
    { text: 'changed' },
    { lastPage: true },
    { next: null }
  ]) {
    const value = JSON.parse(pages[1].raw)
    Object.assign(value.contentDelivery, change)
    if ('revision' in change)
      value.contentDelivery.next.arguments.contentPage.revision =
        change.revision
    expect(() => h.forward(JSON.stringify(value))).toThrow()
    expect(h.values.get('contract')).toEqual(before)
  }
  expect(() => h.forward(JSON.stringify({ text: 'x'.repeat(25000) }))).toThrow(
    /bounded/
  )
  expect(h.values.get('contract')).toEqual(before)
  const failed = await h.read({
    names: ['example_tools.choose'],
    contentPage: { revision: '0'.repeat(64), offset: 0 }
  })
  expect(failed.success).toBe(false)
  h.forward(failed.text)
  expect(h.output.at(-1)).toBe(failed.text)
  expect(h.values.get('contract')).toEqual(before)
  const abort = new AbortController()
  abort.abort()
  await expect(
    invokeLocalTool(
      h.owner,
      h.definition,
      { names: ['example_tools.choose'] },
      abort.signal
    )
  ).rejects.toThrow(/aborted/)
  expect(h.values.get('contract')).toEqual(before)
  h.values.clear()
  expect(() => h.forward(pages[1].raw)).toThrow(/Missing/)
  const refreshed = await collectForwardingPages(h, {
    names: ['example_tools.choose'],
    refresh: true,
    refreshReason: 'delivery-failure'
  })
  for (const page of refreshed) h.forward(page.raw, 'refreshed-contract')
  expect(h.values.get('refreshed-contract')).toMatchObject({ complete: true })
  expect(h.dispatch).not.toHaveBeenCalled()
})

it('preserves small and partial contracts through the actual advertised example', async () => {
  const h = forwardingOwner()
  for (const [key, query] of Object.entries({
    usage: { names: ['example_tools.choose'], view: 'usage' },
    partial: {
      names: ['example_tools.choose'],
      schemaPaths: ['/properties/choice']
    }
  })) {
    const pages = await collectForwardingPages(h, query)
    for (const page of pages) h.forward(page.raw, key)
    const retained = h.values.get(key) as { complete: boolean; value: unknown }
    expect(retained.complete).toBe(true)
    const canonical = pages
      .map((page) => JSON.parse(page.raw).contentDelivery?.text ?? page.raw)
      .join('')
    expect(retained.value).toEqual(JSON.parse(canonical))
    if (key === 'partial') {
      const tool = (
        retained.value as {
          tools: {
            schemaContext: unknown
            schemaFragments: { schema: unknown }[]
          }[]
        }
      ).tools[0]
      expect(tool.schemaContext).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            schema: expect.objectContaining({
              required: ['choice'],
              additionalProperties: false
            })
          })
        ])
      )
      expect(tool.schemaFragments[0].schema).toEqual(
        h.native.inputSchema.properties.choice
      )
    }
  }
})

it('executes the delivered forwarding example in native Code Mode without cutting required contracts', async () => {
  const h = forwardingOwner()
  const pages = await collectForwardingPages(h)
  const namespace = 'design_operations'
  const executions = pages.map((page, index) => ({
    input: page.input,
    reply: page.raw,
    code: `const deliveryKey = "contract"; const result = await tools.${namespace}__${h.definition.name}(${index ? 'load(deliveryKey).next.arguments' : JSON.stringify(page.input)});\n${h.code}`,
    expected: page.raw
  }))
  const summary = {
    complete: true,
    required: ['choice'],
    additionalProperties: false,
    count: h.native.inputSchema.properties.choice.enum.length
  }
  executions.push({
    input: {},
    reply: '',
    code: 'const s = load("contract"); const schema = s.value.tools[0].inputSchema; text(JSON.stringify({complete:s.complete,required:schema.required,additionalProperties:schema.additionalProperties,count:schema.properties.choice.enum.length}));',
    expected: JSON.stringify(summary)
  })
  executions.push({
    input: {},
    reply: '',
    code: `const deliveryKey = "contract"; const result = load(deliveryKey).pages[0];\n${h.code}`,
    expected: pages[0].raw
  })
  const canonical = pages
    .map((page) => JSON.parse(page.raw).contentDelivery.text)
    .join('')
  const oversizedIndex = executions.length
  executions.push({
    input: {},
    reply: '',
    code: 'text(JSON.stringify(load("contract").value));',
    expected: canonical
  })
  executions.push({
    input: {},
    reply: '',
    code: 'text(load("contract").pages.join("\\n"));',
    expected: pages.map((p) => p.raw).join('\n')
  })
  executions.push({
    input: {},
    reply: '',
    code: `const deliveryKey = "contract"; const result = load(deliveryKey).pages.at(-1);\n${h.code}`,
    expected: pages[pages.length - 1].raw
  })
  const nativeModule = new URL(
    '../../test-data/knowledge-evaluation/native-delivery.mjs',
    import.meta.url
  ).href
  const { runNativeDelivery } = await import(/* @vite-ignore */ nativeModule)
  const result = await runNativeDelivery({
    mode: 'code',
    executions,
    fixture: {
      tool: h.definition.name,
      namespace,
      input: pages[0].input,
      raw: pages[0].raw,
      sha256: createHash('sha256').update(pages[0].raw).digest('hex'),
      nativeVersion: 'codex-cli 0.160.0',
      kind: 'advertised-information-forwarding',
      declaration: {
        type: 'namespace',
        name: namespace,
        description: 'Actual information owner',
        tools: [
          {
            type: 'function',
            name: h.definition.name,
            description: h.definition.description,
            inputSchema: h.definition.inputSchema,
            deferLoading: true
          }
        ]
      }
    }
  })
  expect(result.nativeReplies).toBe(pages.length)
  expect(result.cleanup.errors).toEqual([])
  expect(result.receipt.status).toBe('saved')
  result.comparisons.forEach(
    (
      comparison: {
        exact: boolean
        truncationMarker: boolean
        omission?: { bytes: number }
      },
      index: number
    ) => {
      if (index === oversizedIndex || index === oversizedIndex + 1) {
        expect(comparison.exact).toBe(false)
        expect(comparison.truncationMarker).toBe(true)
        expect(comparison.omission?.bytes).toBeGreaterThan(0)
      } else
        expect(
          comparison.exact,
          `Execution ${index}; ${result.directory}`
        ).toBe(true)
    }
  )
  expect(h.dispatch).not.toHaveBeenCalled()
  console.log(
    JSON.stringify({
      evidence: result.directory,
      pages: pages.length,
      executions: executions.length
    })
  )
}, 60000)

it('forwards complete selected Knowledge topics through the published example into native successor requests', async () => {
  const { default: recorded } =
    await import('./fixtures/recorded-101/knowledge-topic-selection-20261021.json')
  const nativeModule = new URL(
    '../../test-data/knowledge-evaluation/native-delivery.mjs',
    import.meta.url
  ).href
  const { runNativeDelivery } = await import(/* @vite-ignore */ nativeModule)
  const owner = createLocalKnowledgeTools('native-complete-topics')
  try {
    const definition = owner.definitions.find(
      (tool) => tool.name === AiDesignToolIds.READ_KNOWLEDGE
    )
    if (!definition) throw new Error('Missing Knowledge read definition')
    const code = advertisedExample(localToolResultInstructions)
    const executions = []
    for (const entry of recorded.cases) {
      const reply = await invokeLocalTool(
        owner,
        definition,
        entry.input,
        new AbortController().signal
      )
      expect(reply.success).toBe(true)
      const value = JSON.parse(reply.text)
      expect(value.contentDelivery).toBeUndefined()
      expect(
        value.documents.some(
          (doc: { target: string }) => doc.target === entry.input.ids[0]
        )
      ).toBe(true)
      executions.push({
        input: entry.input,
        reply: reply.text,
        code: `const deliveryKey = ${JSON.stringify(entry.topic)}; const result = await tools.design_knowledge__read_knowledge(${JSON.stringify(entry.input)});\n${code}`,
        expected: reply.text
      })
    }
    const first = executions[0]
    const result = await runNativeDelivery({
      mode: 'code',
      executions,
      fixture: {
        tool: definition.name,
        namespace: 'design_knowledge',
        input: first.input,
        raw: first.reply,
        sha256: createHash('sha256').update(first.reply).digest('hex'),
        nativeVersion: 'codex-cli 0.160.0',
        declaration: {
          type: 'namespace',
          name: 'design_knowledge',
          description: 'Selected advisory topics',
          tools: [
            {
              type: 'function',
              name: definition.name,
              description: definition.description,
              inputSchema: definition.inputSchema,
              deferLoading: true
            }
          ]
        }
      }
    })
    expect(result.nativeReplies).toBe(recorded.cases.length)
    expect(result.comparisons).toHaveLength(recorded.cases.length)
    for (const comparison of result.comparisons) {
      expect(comparison.exact, result.directory).toBe(true)
      expect(comparison.truncationMarker).toBe(false)
    }
    expect(result.cleanup.errors).toEqual([])
    expect(result.receipt.status).toBe('saved')
  } finally {
    owner.dispose()
  }
}, 60000)

it('rehydrates paged reuse after lost context and executes only the returned read continuation', async () => {
  const load = vi.fn(async () => [
    {
      id: 'base',
      revision: 1,
      markdown:
        '---\n{"description":"Base","provenance":["Test"]}\n---\nBase constraint.'
    },
    {
      id: 'child',
      revision: 1,
      markdown:
        '---\n{"description":"Child","provenance":["Test"],"references":["base"]}\n---\n' +
        'Constraint 🌲. '.repeat(3000)
    }
  ])
  const owner = createLocalKnowledgeTools('paged-reuse', load)
  const definition = owner.definitions.find(
    (d) => d.name === AiDesignToolIds.READ_KNOWLEDGE
  )

  if (!definition) throw new Error('Missing Knowledge read definition')
  const read = async (input: Record<string, unknown>) => {
    const reply = await invokeLocalTool(
      owner,
      definition,
      input,
      new AbortController().signal
    )
    expect(reply.success, reply.text).toBe(true)
    return JSON.parse(reply.text)
  }
  try {
    const base = await read({ ids: ['base'] })
    const first = await read({
      ids: ['child'],
      reuseFrom: [base.contextKey],
      rehydrate: true
    })
    let current = first,
      text = '',
      pages = 0
    while (current.contentDelivery) {
      const page = current.contentDelivery
      text += page.text
      pages++
      if (!page.next) break
      expect(page.next.tool).toBe(AiDesignToolIds.READ_KNOWLEDGE)
      expect(page.next.arguments.reuseFrom).toBeUndefined()
      current = await read(page.next.arguments)
      expect(pages).toBeLessThan(12)
    }
    expect(pages).toBeGreaterThan(1)
    const restored = JSON.parse(text)
    expect(
      restored.documents.every(
        (doc: { text?: string }) => typeof doc.text === 'string'
      )
    ).toBe(true)
    expect(load).toHaveBeenCalledTimes(1)
  } finally {
    owner.dispose()
  }
})

it('recovers unavailable retained advice by executing the returned same-read example', async () => {
  const owner = createLocalKnowledgeTools('recover-reuse', async () => files)
  const definition = owner.definitions.find(
    (d) => d.name === AiDesignToolIds.READ_KNOWLEDGE
  )

  if (!definition) throw new Error('Missing Knowledge read definition')
  try {
    const invalid = await invokeLocalTool(
      owner,
      definition,
      { ids: ['test.advice'], reuseFrom: ['foreign-result'] },
      new AbortController().signal
    )
    expect(invalid.success).toBe(false)
    expect(JSON.parse(invalid.text)).toMatchObject({
      code: 'KNOWLEDGE_REUSE_UNAVAILABLE',
      settlement: 'not-started'
    })
    const expression = JSON.parse(invalid.text).message.match(
      /`(read_knowledge\([^`]+\))`/
    )?.[1]
    expect(expression).toBeDefined()
    let calls = 0
    const invoke = async (input: Record<string, unknown>) => {
      calls++
      expect(input.reuseFrom).toBeUndefined()
      return invokeLocalTool(
        owner,
        definition,
        JSON.parse(JSON.stringify(input)),
        new AbortController().signal
      )
    }
    const restored = await new Function(
      'read_knowledge',
      'ids',
      'contexts',
      `return ${expression}`
    )(invoke, ['test.advice'], undefined)
    expect(restored.success).toBe(true)
    expect(JSON.parse(restored.text).contentDelivery.startByte).toBe(0)
    expect(calls).toBe(1)
  } finally {
    owner.dispose()
  }
})

it('keeps cross-query pages byte-stable and rejects stale continuation without writes', async () => {
  const owner = createLocalKnowledgeTools('reuse-pages', async () => [
    {
      id: 'base',
      revision: 1,
      markdown:
        '---\n{"description":"Base","provenance":["Test"]}\n---\n' +
        'Base restriction. '.repeat(200)
    },
    {
      id: 'child',
      revision: 1,
      markdown:
        '---\n{"description":"Child","provenance":["Test"],"references":["base"]}\n---\n' +
        'Child condition 🌲. '.repeat(2000)
    }
  ])
  const definition = owner.definitions.find(
    (d) => d.name === AiDesignToolIds.READ_KNOWLEDGE
  )

  if (!definition) throw new Error('Missing Knowledge read definition')
  const read = (input: Record<string, unknown>) =>
    invokeLocalTool(owner, definition, input, new AbortController().signal)
  try {
    const base = JSON.parse((await read({ ids: ['base'] })).text)
    const input = { ids: ['child'], reuseFrom: [base.contextKey] }
    let args: Record<string, unknown> = input,
      joined = '',
      firstPage: Record<string, unknown> | undefined
    for (let count = 0; count < 10; count++) {
      const a = await read(args),
        b = await read(args)
      expect(a.success, a.text).toBe(true)
      expect(a.text).toBe(b.text)
      expect(Buffer.byteLength(a.text)).toBeLessThanOrEqual(24000)
      const page = JSON.parse(a.text).contentDelivery
      firstPage ??= page.next.arguments
      joined += page.text
      if (page.lastPage) break
      args = page.next.arguments
    }
    const complete = JSON.parse(joined)
    expect(complete.documents[0]).toMatchObject({
      retainedFrom: base.contextKey
    })
    expect(complete.documents[1].text).toBe('Child condition 🌲. '.repeat(2000))
    owner.invalidateContext()
    if (!firstPage) throw new Error('Missing expected continuation')
    const stale = await read(firstPage)
    expect(stale.success).toBe(false)
    expect(stale.text).toContain('KNOWLEDGE_REUSE_UNAVAILABLE')
  } finally {
    owner.dispose()
  }
})

it('forwards cross-query held advice and the actual reuse example through native Code Mode', async () => {
  const { default: recorded } =
    await import('./fixtures/recorded-101/knowledge-dependency-reuse-20261024.json')
  const nativeModule = new URL(
    '../../test-data/knowledge-evaluation/native-delivery.mjs',
    import.meta.url
  ).href
  const { runNativeDelivery } = await import(/* @vite-ignore */ nativeModule)
  const owner = createLocalKnowledgeTools('native-cross-query')
  const definition = owner.definitions.find(
    (d) => d.name === AiDesignToolIds.READ_KNOWLEDGE
  )

  if (!definition) throw new Error('Missing Knowledge read definition')
  const signal = new AbortController().signal
  try {
    const first = await invokeLocalTool(
      owner,
      definition,
      recorded.reads[0],
      signal
    )
    expect(first.success).toBe(true)
    const previous = JSON.parse(first.text)
    const expression = definition.description.match(
      /`(read_knowledge\([^`]+\))`/
    )?.[1]
    expect(expression).toBeDefined()
    const args = { ...recorded.reads[1], reuseFrom: [previous.contextKey] }
    const second = await invokeLocalTool(owner, definition, args, signal)
    expect(second.success, second.text).toBe(true)
    const forward = advertisedExample(localToolResultInstructions)
    const executions = [
      {
        input: recorded.reads[0],
        reply: first.text,
        expected: first.text,
        code: `const deliveryKey = "prior-advice"; const result = await tools.design_knowledge__read_knowledge(${JSON.stringify(recorded.reads[0])});\n${forward}`
      },
      {
        input: args,
        reply: second.text,
        expected: second.text,
        code: `const previous = load("prior-advice").value; const ids = ${JSON.stringify(args.ids)}; const contexts = ${JSON.stringify(args.contexts)}; const read_knowledge = input => tools.design_knowledge__read_knowledge(input); const deliveryKey = "selected-advice"; const result = await ${expression};\n${forward}`
      }
    ]
    const result = await runNativeDelivery({
      mode: 'code',
      executions,
      fixture: {
        tool: definition.name,
        namespace: 'design_knowledge',
        input: recorded.reads[0],
        raw: first.text,
        sha256: createHash('sha256').update(first.text).digest('hex'),
        nativeVersion: 'codex-cli 0.160.0',
        declaration: {
          type: 'namespace',
          name: 'design_knowledge',
          description: 'Advisory Knowledge',
          tools: [
            {
              type: 'function',
              name: definition.name,
              description: definition.description,
              inputSchema: definition.inputSchema,
              deferLoading: true
            }
          ]
        }
      }
    })
    expect(result.nativeReplies).toBe(2)
    expect(result.comparisons).toHaveLength(2)
    for (const comparison of result.comparisons) {
      expect(comparison.exact, result.directory).toBe(true)
      expect(comparison.truncationMarker).toBe(false)
    }
    expect(JSON.parse(second.text).documents[0]).toMatchObject({
      retainedFrom: previous.contextKey
    })
    expect(result.cleanup.errors).toEqual([])
    expect(result.receipt.status).toBe('saved')
  } finally {
    owner.dispose()
  }
}, 60000)

// Rejected programs are immutable experiment evidence, never production helpers.
it('rejects the withdrawn consumer prototype under the unchanged total-cost DoD', async () => {
  const { readFile } = await import('node:fs/promises')
  const { default: experiment } =
    await import('./fixtures/recorded-101/rejected-knowledge-consumer-20261025.json')
  const raw = await readFile(
    new URL(
      './fixtures/recorded-101/knowledge-source-delivery-20261025.json',
      import.meta.url
    )
  )
  expect(createHash('sha256').update(raw).digest('hex')).toBe(
    experiment.knowledgeFixtureSha256
  )
  const recorded: {
    ordinaryQueries: Record<string, unknown>[]
    files: {
      id: string
      revision: number
      markdownBase64: string
      sha256: string
    }[]
  } = JSON.parse(raw.toString())
  const replayFiles = recorded.files.map((file) => {
    const markdown = Buffer.from(file.markdownBase64, 'base64')
    expect(createHash('sha256').update(markdown).digest('hex')).toBe(
      file.sha256
    )
    return {
      id: file.id,
      revision: file.revision,
      markdown: markdown.toString()
    }
  })
  const replay = async (kind: 'baseline' | 'candidate') => {
    const script = experiment[kind]
    const body = `${script.prelude}\n${script.forward}`
    expect(createHash('sha256').update(body).digest('hex')).toBe(
      script.programSha256
    )
    const owner = createLocalKnowledgeTools(
      `cost-${kind}`,
      async () => replayFiles
    )
    const definition = owner.definitions.find(
      (d) => d.name === AiDesignToolIds.READ_KNOWLEDGE
    )
    if (!definition) throw new Error('Missing Knowledge read definition')
    const memory = new Map<string, ReturnType<typeof JSON.parse>>()
    const calls: { input: Record<string, unknown>; text: string }[] = []
    const outputs: string[] = []
    const documents: unknown[] = []
    const sources: unknown[] = []
    let programBytes = 0
    let completeProgramBytes = 0
    try {
      for (const [index, query] of recorded.ordinaryQueries.entries()) {
        // Ordinary forwarding requires a query-specific key. The rejected program
        // explicitly required one stable key across different queries.
        const deliveryKey =
          kind === 'baseline' ? `knowledge-${index}` : 'knowledge'
        const code = `const query = ${JSON.stringify(query)}; const deliveryKey = ${JSON.stringify(deliveryKey)}; const read_knowledge = input => tools.design_knowledge__read_knowledge(input);\n${body}`
        programBytes += Buffer.byteLength(body)
        completeProgramBytes += Buffer.byteLength(code)
        await runInNewContext(`(async () => { ${code} })()`, {
          load: (key: string) => memory.get(key),
          store: (key: string, value: unknown) =>
            memory.set(key, structuredClone(value)),
          text: (value: string) => outputs.push(value),
          tools: {
            design_knowledge__read_knowledge: async (
              input: Record<string, unknown>
            ) => {
              const reply = await invokeLocalTool(
                owner,
                definition,
                input,
                new AbortController().signal
              )
              expect(reply.success, reply.text).toBe(true)
              expect(JSON.parse(reply.text).contentDelivery).toBeUndefined()
              calls.push({ input: structuredClone(input), text: reply.text })
              return reply.text
            }
          }
        })
        const saved = memory.get(deliveryKey)
        expect(saved.complete).toBe(true)
        expect(saved.next).toBeNull()
        expect(
          saved.value.documents.every(
            (doc: { text?: string }) => typeof doc.text === 'string'
          )
        ).toBe(true)
        documents.push(structuredClone(saved.value.documents))
        sources.push(structuredClone(saved.value.sources))
      }
      expect(outputs).toEqual(calls.map((call) => call.text))
      return {
        calls,
        documents,
        sources,
        programBytes,
        completeProgramBytes,
        guideBytes:
          Buffer.byteLength(script.description) +
          Buffer.byteLength(script.forward),
        exchangeBytes: calls.reduce(
          (total, call) =>
            total +
            Buffer.byteLength(JSON.stringify(call.input)) +
            Buffer.byteLength(call.text),
          0
        )
      }
    } finally {
      owner.dispose()
    }
  }
  const baseline = await replay('baseline')
  const candidate = await replay('candidate')
  expect(candidate.documents).toEqual(baseline.documents)
  expect(candidate.sources).toEqual(baseline.sources)
  expect(baseline.calls).toHaveLength(recorded.ordinaryQueries.length)
  expect(candidate.calls).toHaveLength(baseline.calls.length)
  expect(baseline.calls.every((call) => !call.input.reuseFrom)).toBe(true)
  expect(candidate.calls[1].input.reuseFrom).toEqual([
    JSON.parse(candidate.calls[0].text).contextKey
  ])
  expect(candidate.exchangeBytes).toBeLessThan(baseline.exchangeBytes)
  const guideDelta = candidate.guideBytes - baseline.guideBytes
  const before = baseline.exchangeBytes + baseline.programBytes
  const after = candidate.exchangeBytes + candidate.programBytes + guideDelta
  // Keep the optimization decision separate from successful rejection replay.
  // The original strict reduction criterion remains unchanged and is NOT met.
  const meetsFixedDoD =
    after < before && candidate.calls.length <= baseline.calls.length
  expect({ decision: meetsFixedDoD ? 'accepted' : 'rejected' }).toEqual({
    decision: experiment.decision
  })
  const beforeComplete =
    baseline.exchangeBytes + baseline.completeProgramBytes + baseline.guideBytes
  const afterComplete =
    candidate.exchangeBytes +
    candidate.completeProgramBytes +
    candidate.guideBytes
  expect(afterComplete).toBeGreaterThan(beforeComplete)
  process.stdout.write(
    JSON.stringify({
      measurement: 'rejected-consumer-cost',
      before,
      after,
      baselineExchange: baseline.exchangeBytes,
      candidateExchange: candidate.exchangeBytes,
      guideDelta,
      baselinePrograms: baseline.programBytes,
      candidatePrograms: candidate.programBytes,
      beforeComplete,
      afterComplete,
      meetsFixedDoD
    }) + '\n'
  )
})

it.each([
  { label: 'registered guide', explanation: '' },
  {
    label: 'additional explanation',
    explanation:
      '\nRetain required advice until the dependent operation is complete.'
  }
])(
  'keeps published forwarding independent from incidental consumer adapter bindings with $label',
  async ({ explanation }) => {
    const owner = createLocalKnowledgeTools(
      'independent-forwarding',
      async () => files
    )
    const definition = owner.definitions.find(
      (d) => d.name === AiDesignToolIds.READ_KNOWLEDGE
    )
    if (!definition) throw new Error('Missing Knowledge read definition')
    // A description can gain valid advice without changing its executable contract.
    const description = definition.description + explanation
    const memory = new Map<string, ReturnType<typeof JSON.parse>>()
    const incidentalSave = vi.fn(() => {
      throw new Error('Unrelated state must not intercept forwarding')
    })
    const forward = advertisedExample(localToolResultInstructions)
    let input: Record<string, unknown> = { ids: ['test.advice'] }
    try {
      for (let pages = 0; pages < 20; pages++) {
        const reply = await invokeLocalTool(
          owner,
          definition,
          input,
          new AbortController().signal
        )
        expect(reply.success).toBe(true)
        const output: string[] = []
        runInNewContext(forward, {
          result: reply.text,
          deliveryKey: 'independent-advice',
          informationState: { previous: undefined, save: incidentalSave },
          load: (key: string) => memory.get(key),
          store: (key: string, value: unknown) =>
            memory.set(key, structuredClone(value)),
          text: (value: string) => output.push(value)
        })
        expect(output).toEqual([reply.text])
        const saved = memory.get('independent-advice')
        if (saved.complete) break
        input = saved.next.arguments
      }
      expect(incidentalSave).not.toHaveBeenCalled()
      expect(memory.get('independent-advice').value.documents[0].text).toBe(
        advice
      )
      const previous = memory.get('independent-advice').value
      const expression = description.match(/`(read_knowledge\([^`]+\))`/)?.[1]
      if (!expression)
        throw new Error('Missing published explicit reuse example')
      const read = vi.fn(async (args: Record<string, unknown>) => {
        const reply = await invokeLocalTool(
          owner,
          definition,
          JSON.parse(JSON.stringify(args)),
          new AbortController().signal
        )
        expect(reply.success, reply.text).toBe(true)
        return reply.text
      })
      const reused = JSON.parse(
        await runInNewContext(expression, {
          read_knowledge: read,
          ids: ['test.advice'],
          contexts: undefined,
          previous
        })
      )
      expect(read).toHaveBeenCalledTimes(1)
      expect(read.mock.calls[0][0].reuseFrom).toEqual([previous.contextKey])
      expect(reused.documents).toHaveLength(previous.documents.length)
      const { retainedFrom, ...document } = reused.documents[0]
      expect(retainedFrom).toBe(previous.contextKey)
      expect(document).not.toHaveProperty('text')
      expect({ ...document, text: previous.documents[0].text }).toEqual(
        previous.documents[0]
      )
      expect(reused.sources).toEqual(previous.sources)
      expect(description).toContain('rehydrate')
    } finally {
      owner.dispose()
    }
  }
)
