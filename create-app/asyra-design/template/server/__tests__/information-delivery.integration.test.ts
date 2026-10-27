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

import { createLocalOperationTools } from '../local-operation-tools'
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
  const saved = JSON.parse(text)
  for (let i = 0; i < 63; i++)
    await owner.call(
      AiDesignToolIds.DESCRIBE_DESIGN_APIS,
      { names: ['unrelated-' + i] },
      new AbortController().signal
    )
  let selectedInput: Record<string, unknown> = {
    names: ['test_tools.choose'],
    fromResult: saved.resultKey
  }
  let selectedText = ''
  for (;;) {
    const raw = await owner.call(
      AiDesignToolIds.DESCRIBE_DESIGN_APIS,
      selectedInput,
      new AbortController().signal
    )
    expect(
      await owner.call(
        AiDesignToolIds.DESCRIBE_DESIGN_APIS,
        selectedInput,
        new AbortController().signal
      )
    ).toBe(raw)
    const page = JSON.parse(raw).contentDelivery
    selectedText += page.text
    if (page.lastPage) break
    selectedInput = page.next.arguments
  }
  expect(JSON.parse(selectedText).tools).toEqual(saved.tools)
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

it('retains every current Knowledge page in real native direct successor requests', async () => {
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
      const evidence = await runNativeDelivery({ fixture })
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

it('forwards complete selected Knowledge topics through direct owner delivery into native successor requests', async () => {
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
        expected: reply.text
      })
    }
    const first = executions[0]
    const result = await runNativeDelivery({
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

it('forwards cross-query held advice and the actual reuse example through native direct calls', async () => {
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
    const executions = [
      {
        input: recorded.reads[0],
        reply: first.text,
        expected: first.text
      },
      {
        input: args,
        reply: second.text,
        expected: second.text
      }
    ]
    const result = await runNativeDelivery({
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
it('redisplays selected retained tool contracts without rebuilding schemas or replaying execution', async () => {
  let projections = 0
  let revision = 0
  const schema = {
    type: 'object',
    required: ['value'],
    properties: {
      value: {
        type: 'string',
        get description() {
          projections++
          return 'Required source constraint. '.repeat(20)
        }
      }
    },
    additionalProperties: false
  }
  const tools = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((name) => ({
    name,
    namespace: 'retained_test',
    description: 'Original operation',
    inputSchema: schema,
    ...toolSemantics({ type: 'object' }, 'read', [])
  }))
  const dispatch = vi.fn()
  const owner = createLocalOperationTools(
    basicApiContracts,
    { modelActions: (a) => a, resolveBatch: (v) => v },
    dispatch,
    { getNativeTools: () => tools, getNativeToolsRevision: () => revision }
  )
  const name = AiDesignToolIds.DESCRIBE_DESIGN_APIS
  const definition = requiredInformationTool(owner, name)
  const read = async (args: Record<string, unknown>) => {
    const reply = await invokeLocalTool(
      owner,
      definition,
      args,
      new AbortController().signal
    )
    expect(reply.success, reply.text).toBe(true)
    return JSON.parse(reply.text)
  }
  const original = await read({
    names: tools.map((t) => 'retained_test.' + t.name)
  })
  expect(original.resultKey).toEqual(expect.any(String))
  const count = projections
  const expression = definition.description
    .split('`')
    .find((part) =>
      part.startsWith('describe_design_apis({ names, fromResult:')
    )
  expect(expression).toBeDefined()
  const selected = await new Function(
    'describe_design_apis',
    'names',
    'previous',
    'return ' + expression
  )(read, ['retained_test.a', 'retained_test.c'], original)
  expect(projections).toBe(count)
  const { resultKey: _key, ...withoutHandle } = original
  const coldBytes = Buffer.byteLength(JSON.stringify(original))
  const selectedBytes = Buffer.byteLength(JSON.stringify(selected))
  const baselineBytes = 2 * Buffer.byteLength(JSON.stringify(withoutHandle))
  expect(coldBytes + selectedBytes).toBeLessThan(baselineBytes)
  process.stdout.write(
    JSON.stringify({
      measurement: 'retained-tool-selection',
      coldBytes,
      selectedBytes,
      baselineBytes,
      repeatedProjectionReads: projections - count
    }) + '\n'
  )
  expect(selected.tools).toEqual(
    original.tools.filter((t: { name: string }) => ['a', 'c'].includes(t.name))
  )
  expect(
    JSON.stringify(original).length + JSON.stringify(selected).length
  ).toBeLessThan(2 * JSON.stringify(original).length)
  expect(
    await read({
      names: ['retained_test.a', 'retained_test.c'],
      fromResult: original.resultKey
    })
  ).toEqual(selected)
  expect(dispatch).not.toHaveBeenCalled()
  revision++
  tools[0].description = 'Changed operation'
  const stale = await invokeLocalTool(
    owner,
    definition,
    { names: ['retained_test.a'], fromResult: original.resultKey },
    new AbortController().signal
  )
  expect(stale.success).toBe(false)
  expect(stale.text).toContain('fromResult')
  const fresh = await read({ names: ['retained_test.a'] })
  expect(fresh.tools[0].description).toBe('Changed operation')
  expect(dispatch).not.toHaveBeenCalled()
})

it('executes published retained Knowledge selection with dependencies and read-only recovery', async () => {
  const load = vi.fn(async () =>
    ['a.1', 'a.2', 'a.3', 'b', 'b.1', 'c.3', 'd.5'].map((id) => ({
      id,
      revision: 1,
      markdown:
        '---\n' +
        JSON.stringify({
          description: id,
          provenance: ['Formal selection fixture'],
          ...(id === 'a.3' || id === 'c.3' ? { references: ['b'] } : {})
        }) +
        '\n---\n' +
        (id + ' required advice. ').repeat(15)
    }))
  )
  const owner = createLocalKnowledgeTools('selected-wire', load)
  const definition = requiredInformationTool(
    owner,
    AiDesignToolIds.READ_KNOWLEDGE
  )
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
    const original = await read({
      ids: ['a.1', 'a.2', 'a.3', 'b', 'b.1', 'c.3', 'd.5']
    })
    const expression = definition.description
      .split('`')
      .find((part) => part.startsWith('read_knowledge({ ids, fromResult:'))
    expect(expression).toBeDefined()
    const selected = await new Function(
      'read_knowledge',
      'ids',
      'previous',
      'return ' + expression
    )(read, ['a.3', 'c.3'], original)
    expect(selected.documents.map((d: { target: string }) => d.target)).toEqual(
      ['b', 'a.3', 'c.3']
    )
    expect(
      selected.documents.every((d: { text?: string }) => Boolean(d.text))
    ).toBe(true)
    expect(selected.contextKey).not.toBe(original.contextKey)
    expect(Buffer.byteLength(JSON.stringify(selected))).toBeLessThan(
      Buffer.byteLength(JSON.stringify(original))
    )
    owner.invalidateContext()
    const failed = await invokeLocalTool(
      owner,
      definition,
      { ids: ['a.3', 'c.3'], fromResult: original.contextKey },
      new AbortController().signal
    )
    expect(failed.success).toBe(false)
    expect(failed.text).toContain('without fromResult/reuseFrom')
    const recovery = definition.description.includes(
      'ordinary ids/contexts reads'
    )
    expect(recovery).toBe(true)
    expect(
      (await read({ ids: ['a.3', 'c.3'] })).documents.map(
        (d: { target: string }) => d.target
      )
    ).toEqual(['b', 'a.3', 'c.3'])
    expect(load).toHaveBeenCalledTimes(1)
  } finally {
    owner.dispose()
  }
})

it('preserves saved discovery scope, partial results, ambiguity and foreign-key isolation', async () => {
  const native = ['left', 'right'].map((namespace) => ({
    namespace,
    name: 'choose',
    description: 'Choose a permitted value',
    inputSchema: {
      type: 'object',
      required: ['choice'],
      additionalProperties: false,
      properties: { choice: { enum: ['one', 'two'] } }
    },
    ...toolSemantics({ type: 'object' }, 'read', [])
  }))
  const make = () =>
    createLocalOperationTools(
      basicApiContracts,
      { modelActions: (a) => a, resolveBatch: (v) => v },
      vi.fn(),
      { getNativeTools: () => native, getNativeToolsRevision: () => 0 }
    )
  const owner = make()
  const name = AiDesignToolIds.DESCRIBE_DESIGN_APIS
  const definition = requiredInformationTool(owner, name)
  const read = async (input: Record<string, unknown>) =>
    JSON.parse(
      (
        await invokeLocalTool(
          owner,
          definition,
          input,
          new AbortController().signal
        )
      ).text
    )
  for (const scope of [
    { view: 'usage' },
    { view: 'full' },
    { schemaPaths: ['/properties/choice'] }
  ]) {
    const saved = await read({
      names: ['left.choose', 'right.choose'],
      ...scope
    })
    const selected = await read({
      names: ['left.choose'],
      fromResult: saved.resultKey
    })
    expect(selected.tools).toEqual([saved.tools[0]])
    expect(selected.tools[0].definition).toEqual(saved.tools[0].definition)
    const partial = await read({
      names: ['left.choose', 'absent'],
      fromResult: saved.resultKey
    })
    expect(partial.tools).toEqual([saved.tools[0]])
    expect(partial.missingNames).toEqual(['absent'])
    expect(partial.toolOutcome.status).toBe('partial')
    const ambiguous = await read({
      names: ['choose'],
      fromResult: saved.resultKey
    })
    expect(ambiguous.tools).toEqual([])
    expect(ambiguous.ambiguousNames[0].candidates).toEqual([
      'left.choose',
      'right.choose'
    ])
    const foreign = make()
    expect(
      (
        await invokeLocalTool(
          foreign,
          requiredInformationTool(foreign, name),
          { names: ['left.choose'], fromResult: saved.resultKey },
          new AbortController().signal
        )
      ).success
    ).toBe(false)
    for (const extra of [
      { refresh: true },
      { view: 'full' },
      { schemaPaths: ['/properties'] },
      { inputScope: {} }
    ]) {
      expect(
        (
          await invokeLocalTool(
            owner,
            definition,
            { names: ['left.choose'], fromResult: saved.resultKey, ...extra },
            new AbortController().signal
          )
        ).success
      ).toBe(false)
    }
    const abort = new AbortController()
    abort.abort()
    await expect(
      owner.call(
        name,
        { names: ['left.choose'], fromResult: saved.resultKey },
        abort.signal
      )
    ).rejects.toThrow()
  }
  const menu = await read({ query: 'left.choose' })
  const selectedMenu = await read({
    names: ['left.choose'],
    fromResult: menu.resultKey
  })
  expect(selectedMenu.tools).toEqual(menu.tools)
  expect(selectedMenu.tools[0].inputSchema).toBeUndefined()
  const old = await read({ names: ['left.choose'] })
  for (let i = 0; i < 65; i++) await read({ names: ['missing' + i] })
  expect(
    (await read({ names: ['left.choose'], fromResult: old.resultKey }))
      .toolOutcome.status
  ).toBe('failed')
  expect((await read({ names: ['left.choose'] })).tools[0].inputSchema).toEqual(
    native[0].inputSchema
  )
})

it('keeps selected retained information page bytes stable at capacity without another source read', async () => {
  const fillers = Array.from({ length: 63 }, (_, i) => ({
    id: 'filler-' + i,
    revision: 1,
    markdown:
      '---\n{"description":"Unrelated","provenance":["Test"]}\n---\nUnrelated advice.'
  }))
  const load = vi.fn(async () => [...files, ...fillers])
  const owner = createLocalKnowledgeTools('selected-pages', load)
  const tool = AiDesignToolIds.READ_KNOWLEDGE
  const assemble = async (input: Record<string, unknown>) => {
    let query = input,
      text = ''
    for (;;) {
      const raw = await owner.call(tool, query, new AbortController().signal)
      const page = JSON.parse(raw).contentDelivery
      if (!page) return JSON.parse(raw)
      text += page.text
      if (page.lastPage) return JSON.parse(text)
      query = page.next.arguments
    }
  }
  try {
    const original = await assemble({ ids: ['test.advice'] })
    for (const filler of fillers) await assemble({ ids: [filler.id] })
    const query = { ids: ['test.advice'], fromResult: original.contextKey }
    const raw = await owner.call(tool, query, new AbortController().signal)
    expect(await owner.call(tool, query, new AbortController().signal)).toBe(
      raw
    )
    const selected = await assemble(query)
    expect(selected.documents).toEqual(original.documents)
    expect(load).toHaveBeenCalledTimes(1)
    owner.invalidateContext()
    await expect(
      owner.call(
        tool,
        JSON.parse(raw).contentDelivery.next.arguments,
        new AbortController().signal
      )
    ).rejects.toThrow('unavailable')
  } finally {
    owner.dispose()
  }
})

function requiredInformationTool(owner: LocalToolOwner, name: string) {
  const definition = owner.definitions.find((entry) => entry.name === name)
  if (!definition) throw new Error('Missing information tool: ' + name)
  return definition
}

it('delivers native Knowledge search and complete owner content without a forwarding program', async () => {
  const { runNativeDelivery } = await import(
    /* @vite-ignore */ new URL(
      '../../test-data/knowledge-evaluation/native-delivery.mjs',
      import.meta.url
    ).href
  )
  const owner = createLocalKnowledgeTools(
    'direct-context-feasibility',
    async () => [
      {
        id: 'test.constraints',
        revision: 1,
        markdown:
          '---\n' +
          JSON.stringify({
            description: 'Required advice',
            provenance: ['Formal fixture']
          }) +
          '\n---\n' +
          'Preserve material order. Never replay completed writes. Advisory text does not authorize operations.'
      }
    ]
  )
  const definition = requiredInformationTool(
    owner,
    AiDesignToolIds.READ_KNOWLEDGE
  )
  const input = { ids: ['test.constraints'] }
  try {
    const reply = await invokeLocalTool(
      owner,
      definition,
      input,
      new AbortController().signal
    )
    expect(reply.success).toBe(true)
    const evidence = await runNativeDelivery({
      fixture: {
        tool: definition.name,
        namespace: 'design_knowledge',
        input,
        raw: reply.text,
        nativeVersion: 'codex-cli 0.160.0',
        sha256: createHash('sha256').update(reply.text).digest('hex'),
        declaration: {
          type: 'namespace',
          name: 'design_knowledge',
          description: 'Knowledge',
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
      },
      searches: [
        {
          type: 'tool_search_call',
          id: 'knowledge-search',
          call_id: 'knowledge-search-call',
          execution: 'client',
          status: 'completed',
          arguments: { query: definition.name, limit: 1 }
        }
      ]
    })
    expect(evidence.requests).toBe(3)
    expect(evidence.searchResults[0][0].type).toBe('tool_search_output')
    expect(evidence.nativeReplyExact).toBe(true)
    expect(evidence.comparison.exact).toBe(true)
    expect(evidence.comparison.truncationMarker).toBe(false)
    expect(evidence.cleanup.errors).toEqual([])
  } finally {
    owner.dispose()
  }
}, 60000)
