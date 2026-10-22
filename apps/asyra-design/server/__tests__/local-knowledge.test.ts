import { expect, it } from 'vitest'
import {
  createLocalKnowledgeTools,
  createDesignKnowledge,
  parseKnowledgeFile
} from '../local-knowledge'
import { AiDesignToolIds } from '../../src/constants/ai-design'
import { withToolContractAssertions } from './tool-contract-assertions'
const signal = () => new AbortController().signal

it('delivers parent and detail selection conditions before reading and preserves both direct routes', async () => {
  const { readCompleteInformation } = await import('./tool-contract-assertions')
  const owner = withToolContractAssertions(
    createLocalKnowledgeTools('selection-conditions')
  )
  const detailOwner = withToolContractAssertions(
    createLocalKnowledgeTools('direct-detail-conditions')
  )
  const contexts = ['architectural-illustration']
  const calls: string[] = []
  const call = async (tool: string, input: Record<string, unknown>) => {
    calls.push(tool)
    return owner.call(tool, input, signal())
  }
  try {
    const catalog = JSON.parse(
      await call(AiDesignToolIds.DISCOVER_KNOWLEDGE, { contexts })
    )
    const method = catalog.entries.find(
      (entry: { id: string }) =>
        entry.id === 'design.architectural-illustration.materials.method'
    )
    const detail = catalog.entries.find(
      (entry: { id: string }) => entry.id === method.children[0]
    )
    // Inspect only metadata available before any body read, not model reasoning.
    expect(calls).toEqual([AiDesignToolIds.DISCOVER_KNOWLEDGE])
    expect(JSON.stringify(catalog)).not.toContain('## How')
    expect(method.description).toMatch(/ordinary.*representation.*lighting/i)
    expect(method.description).toMatch(/without.*parameter walkthrough/i)
    expect(detail.description).toMatch(
      /only when.*local-coordinate conversion.*worked example/i
    )
    expect(detail.description).toMatch(
      /known supported representation.*does not require/i
    )
    for (const definition of owner.definitions)
      expect(definition.description).toContain('parent or child')
    const normal = JSON.parse(
      await call(AiDesignToolIds.READ_KNOWLEDGE, { ids: [method.id], contexts })
    )
    expect(calls).toEqual([
      AiDesignToolIds.DISCOVER_KNOWLEDGE,
      AiDesignToolIds.READ_KNOWLEDGE
    ])
    expect(normal.contentDelivery).toBeUndefined()
    const targets = normal.documents.map(
      (doc: { target: string }) => doc.target
    )
    expect(targets).toContain(method.id)
    expect(targets).not.toContain(detail.id)
    expect(
      targets.some((id: string) => /\.(review|correction|operations)$/.test(id))
    ).toBe(false)
    for (const restriction of [
      'Do not quantize them merely to reduce bytes',
      'Never retry a settled drawing',
      'nonzero',
      'cannot encode different per-owner coordinates'
    ])
      expect(JSON.stringify(normal)).toContain(restriction)
    const detailed = JSON.parse(
      await readCompleteInformation(
        (input) => {
          expect(input).toMatchObject({ ids: [detail.id] })
          return detailOwner.call(
            AiDesignToolIds.READ_KNOWLEDGE,
            input,
            signal()
          )
        },
        { ids: [detail.id], contexts }
      )
    )
    const detailedTargets = detailed.documents.map(
      (doc: { target: string }) => doc.target
    )
    expect(detailedTargets).toEqual([...targets, detail.id])
    expect(new Set(detailedTargets).size).toBe(detailedTargets.length)
    expect(JSON.stringify(detailed)).toContain('Continuous material join')
    for (const doc of normal.documents)
      expect(
        detailed.documents.find(
          (item: { target: string }) => item.target === doc.target
        )
      ).toEqual(doc)
    const repeated = JSON.parse(
      await call(AiDesignToolIds.READ_KNOWLEDGE, { ids: [method.id], contexts })
    )
    const recovered = JSON.parse(
      await call(AiDesignToolIds.READ_KNOWLEDGE, {
        ids: [method.id],
        contexts,
        rehydrate: true
      })
    )
    expect(repeated.documents).toEqual(normal.documents)
    expect(recovered.documents).toEqual(normal.documents)
    expect(
      owner.definitions.every((definition) => definition.effect === 'read')
    ).toBe(true)
  } finally {
    detailOwner.dispose()
    owner.dispose()
  }
})
const fixtureFile = (text = 'Button advice', revision = 1) => ({
  id: 'button',
  revision,
  markdown: `---\n{"description":"A practical button","provenance":["App"]}\n---\n${text}`
})

it('supports docs button refinement and explicit landing CTA comparison through contextual metadata', async () => {
  const owner = withToolContractAssertions(createLocalKnowledgeTools('task'))
  const discovery = JSON.parse(
    await owner.call(
      AiDesignToolIds.DISCOVER_KNOWLEDGE,
      { contexts: ['docs-page'] },
      signal()
    )
  )
  expect(discovery.entries.map((entry: { id: string }) => entry.id)).toContain(
    'design.docs-page'
  )
  expect(
    discovery.entries.map((entry: { id: string }) => entry.id)
  ).not.toContain('design.landing-page')
  expect(
    discovery.entries.find(
      (entry: { id: string }) => entry.id === 'components.button'
    )
  ).toBeDefined()
  expect(
    discovery.entries.find(
      (entry: { id: string }) => entry.id === 'design.docs-page'
    ).extends
  ).toContain('components.button')
  expect(JSON.stringify(discovery)).not.toContain('## How')
  const docs = JSON.parse(
    await owner.call(
      AiDesignToolIds.READ_KNOWLEDGE,
      { ids: ['design.docs-page'], contexts: ['docs-page'] },
      signal()
    )
  )
  expect(
    docs.documents.some(
      (doc: { target: string }) => doc.target === 'components.button'
    )
  ).toBe(true)
  expect(JSON.stringify(docs)).toContain('copy actions near their examples')
  const crossContext = JSON.parse(
    await owner.call(
      AiDesignToolIds.DISCOVER_KNOWLEDGE,
      { contexts: ['landing-page'] },
      signal()
    )
  )
  expect(
    crossContext.entries.some(
      (entry: { id: string }) => entry.id === 'design.landing-page'
    )
  ).toBe(true)
  const landing = JSON.parse(
    await owner.call(
      AiDesignToolIds.READ_KNOWLEDGE,
      { ids: ['design.landing-page'], contexts: ['landing-page'] },
      signal()
    )
  )
  expect(JSON.stringify(landing)).toContain('Identify the audience')
  expect(JSON.stringify(landing)).not.toContain(
    'copy actions near their examples'
  )
  expect(owner.definitions.every((item) => item.effect === 'read')).toBe(true)
})

it('loads each request catalog once and reuses delivery without injecting all documents', async () => {
  let loads = 0
  const owner = createLocalKnowledgeTools('task', async () => {
    loads++
    return [fixtureFile()]
  })
  await owner.call(AiDesignToolIds.DISCOVER_KNOWLEDGE, {}, signal())
  await owner.call(
    AiDesignToolIds.READ_KNOWLEDGE,
    { ids: ['button'] },
    signal()
  )
  const reused = JSON.parse(
    await owner.call(
      AiDesignToolIds.READ_KNOWLEDGE,
      { ids: ['button'] },
      signal()
    )
  )
  expect(loads).toBe(1)
  expect(reused.alreadyDelivered).toBe(false)
  expect(reused.documents[0].text).toBe('Button advice')
  owner.dispose()
  await expect(
    owner.call(AiDesignToolIds.READ_KNOWLEDGE, { ids: ['button'] }, signal())
  ).rejects.toThrow('closed')
})

it('accepts trusted App replacements and invalidates the existing session', async () => {
  const owner = createDesignKnowledge('task')
  owner.install(fixtureFile())
  expect(
    (await owner.session.retrieve({ ids: ['button'] }, signal())).documents[0]
      .text
  ).toBe('Button advice')
  owner.install(fixtureFile('New advice', 2), 1)
  expect(
    (await owner.session.retrieve({ ids: ['button'] }, signal())).documents[0]
      .text
  ).toBe('New advice')
  expect(() => owner.install(fixtureFile('Stale', 3), 1)).toThrow(
    'KNOWLEDGE_REVISION_CONFLICT'
  )
  owner.remove('button', 2)
  expect(owner.session.discover()).toEqual([])
  owner.dispose()
})

it('rejects model-selected paths, credentials and update operations before file loading', async () => {
  let loads = 0
  const owner = createLocalKnowledgeTools('task', async () => {
    loads++
    return [fixtureFile()]
  })
  await expect(
    owner.call(AiDesignToolIds.READ_KNOWLEDGE, { ids: ['../secret'] }, signal())
  ).rejects.toThrow()
  await expect(
    owner.call(
      AiDesignToolIds.READ_KNOWLEDGE,
      { ids: ['button'], principal: 'admin' },
      signal()
    )
  ).rejects.toThrow()
  await expect(
    owner.call('update_knowledge', { id: 'button', text: 'poison' }, signal())
  ).rejects.toThrow('Unknown knowledge operation')
  expect(loads).toBe(0)
  expect(owner.definitions).toHaveLength(2)
})

it('rejects forged file identities and malformed frontmatter without replacing admitted content', async () => {
  expect(() =>
    parseKnowledgeFile({
      ...fixtureFile(),
      markdown: '---\n{"id":"other"}\n---\ntext'
    })
  ).toThrow('identity')
  expect(() =>
    parseKnowledgeFile({
      ...fixtureFile(),
      markdown: '---\n{"tools":["write"]}\n---\ntext'
    })
  ).toThrow('Unsupported')
  expect(() =>
    parseKnowledgeFile({ ...fixtureFile(), markdown: 'x'.repeat(65537) })
  ).toThrow('limit')
  const owner = createDesignKnowledge('task')
  owner.install(fixtureFile())
  expect(() =>
    owner.install(
      { ...fixtureFile('poison', 2), markdown: 'not frontmatter' },
      1
    )
  ).toThrow()
  expect(
    (await owner.session.retrieve({ ids: ['button'] }, signal())).documents[0]
      .text
  ).toBe('Button advice')
})

it('disposal during admission prevents late file contents from becoming readable', async () => {
  let finish!: (files: ReturnType<typeof fixtureFile>[]) => void
  const owner = createLocalKnowledgeTools(
    'task',
    () =>
      new Promise((resolve) => {
        finish = resolve
      })
  )
  const pending = owner.call(AiDesignToolIds.DISCOVER_KNOWLEDGE, {}, signal())
  owner.dispose()
  finish([fixtureFile()])
  await expect(pending).rejects.toThrow('closed')
})

it('keeps App mixed guidance separate from targeted content and metadata discovery', async () => {
  const owner = createDesignKnowledge('mixed')
  owner.install(fixtureFile())
  owner.install({
    id: 'page',
    revision: 1,
    markdown: `---\n${JSON.stringify({
      description: 'Page guidance',
      provenance: ['App'],
      references: ['button'],
      extends: ['button'],
      overrides: [
        { target: 'button', priority: 1, text: 'Targeted button replacement' }
      ]
    })}\n---\nIndependent page advice`
  })
  expect(JSON.stringify(owner.session.discover())).not.toContain(
    'Targeted button replacement'
  )
  const result = await owner.session.retrieve({ ids: ['page'] }, signal())
  expect(result.documents.map((doc) => doc.text)).toEqual([
    'Targeted button replacement',
    'Independent page advice'
  ])
})

it('rehydrates reconstructed tool context without reloading provider files', async () => {
  let loads = 0
  const owner = createLocalKnowledgeTools('task', async () => {
    loads++
    return [fixtureFile()]
  })
  const read = (rehydrate = false) =>
    owner
      .call(
        AiDesignToolIds.READ_KNOWLEDGE,
        { ids: ['button'], rehydrate },
        signal()
      )
      .then(JSON.parse)
  expect((await read()).documents[0].text).toBe('Button advice')
  expect((await read()).alreadyDelivered).toBe(false)
  expect((await read(true)).documents[0].text).toBe('Button advice')
  owner.invalidateContext()
  expect((await read()).documents[0].text).toBe('Button advice')
  expect((await read()).alreadyDelivered).toBe(false)
  expect(loads).toBe(1)
  owner.dispose()
  const reconstructed = createLocalKnowledgeTools('task', async () => [
    fixtureFile()
  ])
  expect(
    JSON.parse(
      await reconstructed.call(
        AiDesignToolIds.READ_KNOWLEDGE,
        { ids: ['button'] },
        signal()
      )
    ).documents[0].text
  ).toBe('Button advice')
})

it('rejects missing override bodies before changing App registration or content', async () => {
  const owner = createDesignKnowledge('task')
  owner.install(fixtureFile())
  expect(() =>
    owner.install(
      {
        id: 'button',
        revision: 2,
        markdown: `---\n${JSON.stringify({
          description: 'Invalid update',
          provenance: ['App'],
          overrides: [{ target: 'colors', priority: 1 }]
        })}\n---\nReplacement`
      },
      1
    )
  ).toThrow('Targeted override text')
  expect(owner.session.discover()[0].revision).toBe(1)
  expect(
    (await owner.session.retrieve({ ids: ['button'] }, signal())).documents[0]
      .text
  ).toBe('Button advice')
})

it('delivers general architectural advice through the real catalog without imposing it on flat design', async () => {
  const tools = withToolContractAssertions(
    createLocalKnowledgeTools('architecture-admission')
  )
  const found = JSON.parse(
    await tools.call(
      AiDesignToolIds.DISCOVER_KNOWLEDGE,
      { contexts: ['architectural-illustration'] },
      signal()
    )
  )
  expect(JSON.stringify(found)).toContain('design.architectural-illustration')
  const args = {
    ids: [
      'design.architectural-illustration.spatial',
      'design.architectural-illustration.materials.correction'
    ],
    contexts: ['architectural-illustration']
  }
  const readComplete = async (initial: Record<string, unknown>) => {
    let query = initial,
      text = ''
    for (let page = 0; page < 32; page++) {
      const value = JSON.parse(
        await tools.call(AiDesignToolIds.READ_KNOWLEDGE, query, signal())
      )
      if (!value.contentDelivery) return value
      text += value.contentDelivery.text
      if (value.contentDelivery.lastPage) return JSON.parse(text)
      query = value.contentDelivery.next.arguments
    }
    throw new Error('Incomplete advice delivery')
  }
  const read = await readComplete(args)
  const body = JSON.stringify(read)
  expect(body).toContain('illustration.architecture')
  expect(body).toContain('front-to-back')
  expect(body).toContain('select_design_references')
  expect(body).toContain('contracts.operations')
  expect(body).not.toContain('use `fill.detachFillsAtIndex` on the intended')
  expect(body).not.toContain(
    'a shared Fill can affect owners outside the selected targets'
  )
  expect(body).toContain('edits create local overrides')
  expect(body).toContain('core.updateSharedPropertySources')

  expect(body).not.toMatch(/Taipei|50800|101/)
  const again = await readComplete(args)
  expect(again).toEqual(read)
  const restored = await readComplete({ ...args, rehydrate: true })
  expect(JSON.stringify(restored)).toContain('front-to-back')
  const flat = JSON.parse(
    await tools.call(
      AiDesignToolIds.DISCOVER_KNOWLEDGE,
      { contexts: ['docs-page'] },
      signal()
    )
  )
  expect(JSON.stringify(flat)).not.toContain(
    'design.architectural-illustration'
  )
  expect(JSON.stringify(flat)).not.toContain('illustration.architecture')
})

it('advertises every declared specialized context through the current discovery description', () => {
  const owner = createLocalKnowledgeTools('declared-contexts')
  const definition = owner.definitions.find(
    (tool) => tool.name === AiDesignToolIds.DISCOVER_KNOWLEDGE
  )
  if (!definition) throw new Error('Missing knowledge discovery contract')
  const schema = definition.inputSchema as {
    properties: { contexts: { items: { enum: string[] } } }
  }
  for (const context of schema.properties.contexts.items.enum)
    expect(definition.description).toContain(context)
  owner.dispose()
})

it('retries failed catalog loading and corrects missing IDs without losing delivery or repeating file reads', async () => {
  let loads = 0
  const owner = createLocalKnowledgeTools('retry-advice', async () => {
    if (++loads === 1) throw new Error('Knowledge file unavailable')
    return [fixtureFile()]
  })
  try {
    await expect(
      owner.call(AiDesignToolIds.READ_KNOWLEDGE, { ids: ['button'] }, signal())
    ).rejects.toThrow('Knowledge file unavailable')
    await expect(
      owner.call(AiDesignToolIds.READ_KNOWLEDGE, { ids: ['missing'] }, signal())
    ).rejects.toThrow('KNOWLEDGE_NOT_FOUND')
    const result = JSON.parse(
      await owner.call(
        AiDesignToolIds.READ_KNOWLEDGE,
        { ids: ['button'] },
        signal()
      )
    )
    expect(result.alreadyDelivered).toBe(false)
    expect(result.documents[0].text).toBe('Button advice')
    const repeated = JSON.parse(
      await owner.call(
        AiDesignToolIds.READ_KNOWLEDGE,
        { ids: ['button'] },
        signal()
      )
    )
    expect(repeated.alreadyDelivered).toBe(false)
    expect(repeated.documents[0].text).toBe('Button advice')
    expect(loads).toBe(2)
  } finally {
    owner.dispose()
  }
})

it('does not let a cancelled loader waiter poison peer discovery or consume its delivery', async () => {
  let release!: (files: ReturnType<typeof fixtureFile>[]) => void
  let loads = 0
  const files = new Promise<ReturnType<typeof fixtureFile>[]>((resolve) => {
    release = resolve
  })
  const owner = createLocalKnowledgeTools('parallel-advice', () => {
    loads++
    return files
  })
  const cancelled = new AbortController()
  const read = owner.call(
    AiDesignToolIds.READ_KNOWLEDGE,
    { ids: ['button'] },
    cancelled.signal
  )
  const failed = expect(read).rejects.toThrow('cancelled read')
  const peer = owner.call(AiDesignToolIds.DISCOVER_KNOWLEDGE, {}, signal())
  cancelled.abort(new Error('cancelled read'))
  release([fixtureFile()])
  try {
    await failed
    expect(JSON.parse(await peer).entries[0].id).toBe('button')
    const delivered = JSON.parse(
      await owner.call(
        AiDesignToolIds.READ_KNOWLEDGE,
        { ids: ['button'] },
        signal()
      )
    )
    expect(delivered.alreadyDelivered).toBe(false)
    expect(delivered.documents[0].text).toBe('Button advice')
    expect(loads).toBe(1)
  } finally {
    owner.dispose()
  }
})

it('maps owner-local and explicit shared-source edits without requiring detachment for a local correction', async () => {
  const { readFile } = await import('node:fs/promises')
  const guide = await readFile(
    new URL(
      '../../knowledge/design.architectural-illustration.materials.correction.md',
      import.meta.url
    ),
    'utf8'
  )
  expect(guide).toContain('core.updateSharedPropertySources')
  expect(guide).toContain('core.resetElementPropertyOverrides')
  expect(guide).toContain('local overrides')
  expect(guide).not.toContain(
    'detach and requery only when independent edits are intended'
  )
  expect(guide).not.toContain(
    'Conflicting patches for one shared Fill cannot represent two different outcomes'
  )
})

it('selects real nested catalog leaves without eagerly loading siblings and preserves material limits', async () => {
  const { readCompleteInformation } = await import('./tool-contract-assertions')
  const owner = withToolContractAssertions(
    createLocalKnowledgeTools('selective-catalog')
  )
  try {
    const contexts = ['architectural-illustration']
    const discovery = JSON.parse(
      await owner.call(
        AiDesignToolIds.DISCOVER_KNOWLEDGE,
        { contexts },
        signal()
      )
    )
    const root = discovery.entries.find(
      (entry: { id: string }) =>
        entry.id === 'design.architectural-illustration'
    )
    expect(root.children).toContain(
      'design.architectural-illustration.materials'
    )
    const branch = discovery.entries.find(
      (entry: { id: string }) =>
        entry.id ===
        root.children.find((id: string) => id.endsWith('.materials'))
    )
    const id = branch.children.find((child: string) =>
      child.endsWith('.correction')
    )
    expect(
      discovery.entries.find((entry: { id: string }) => entry.id === id)
        .description
    ).toMatch(/existing material/i)
    const read = async (ids: string[], rehydrate = false) =>
      JSON.parse(
        await readCompleteInformation(
          (input) =>
            owner.call(AiDesignToolIds.READ_KNOWLEDGE, input, signal()),
          { ids, contexts, ...(rehydrate ? { rehydrate: true } : {}) }
        )
      )
    const parent = await read([root.id])
    expect(
      parent.documents.map((doc: { target: string }) => doc.target)
    ).toEqual([root.id])
    const leaf = await read([id])
    const targets = leaf.documents.map((doc: { target: string }) => doc.target)
    expect(targets).toContain(id)
    expect(targets).not.toContain(
      'design.architectural-illustration.repetition'
    )
    expect(targets).not.toContain(
      'design.architectural-illustration.materials.method'
    )
    expect(targets).not.toContain('illustration.architecture.projection')
    expect(JSON.stringify(leaf)).toContain('edits create local overrides')
    expect(JSON.stringify(leaf)).toContain('core.updateSharedPropertySources')
    expect(JSON.stringify(leaf)).toContain('Never retry a settled drawing')
    expect(JSON.stringify(leaf)).not.toContain(
      '## Represent a repeated multi-face component once'
    )
    expect(await read([id])).toEqual(leaf)
    expect((await read([id], true)).documents).toEqual(leaf.documents)
    expect(
      owner.definitions.find(
        (tool) => tool.name === AiDesignToolIds.READ_KNOWLEDGE
      )?.description
    ).toMatch(/children are optional choices/i)
  } finally {
    owner.dispose()
  }
})

it.each([
  ['spatial', ['spatial'], 'An entrance-detail pass does not complete'],
  [
    'materials.method',
    ['materials', 'materials.method'],
    'Do not quantize them merely to reduce bytes'
  ],
  ['materials.review', ['materials'], 'representative-capture'],
  ['repetition', ['projection', 'repetition'], 'This does not depth-sort']
] as const)(
  'reads only the necessary closure for the %s topic',
  async (topic, shared, restriction) => {
    const { readCompleteInformation } =
      await import('./tool-contract-assertions')
    const owner = createLocalKnowledgeTools(`topic-${topic}`)
    try {
      const contexts = ['architectural-illustration']
      const found = JSON.parse(
        await owner.call(
          AiDesignToolIds.DISCOVER_KNOWLEDGE,
          { contexts },
          signal()
        )
      )
      const id = `design.architectural-illustration.${topic}`
      expect(
        found.entries.some((entry: { id: string }) => entry.id === id)
      ).toBe(true)
      const read = JSON.parse(
        await readCompleteInformation(
          (input) =>
            owner.call(AiDesignToolIds.READ_KNOWLEDGE, input, signal()),
          { ids: [id], contexts }
        )
      )
      expect(read.sources.map((source: { id: string }) => source.id)).toEqual([
        'design.architectural-illustration',
        'design.architectural-illustration.contracts',
        'illustration.architecture',
        ...shared.map((name) => `illustration.architecture.${name}`),
        id
      ])
      const selected = read.documents.find(
        (doc: { target: string }) => doc.target === id
      )
      expect(selected.text).toContain(restriction)
      expect(
        new Set(read.sources.map((source: { id: string }) => source.id)).size
      ).toBe(read.sources.length)
    } finally {
      owner.dispose()
    }
  }
)

it('delivers recorded material decision topics in one complete reply without optional bodies', async () => {
  const { default: recorded } =
    await import('./fixtures/recorded-101/knowledge-topic-selection-20261021.json')
  const { invokeLocalTool } = await import('../local-tool-invocation')
  const { informationDeliveryBytes } =
    await import('../local-information-delivery')
  const owner = createLocalKnowledgeTools('complete-topics')
  try {
    const catalog = JSON.parse(
      await owner.call(
        AiDesignToolIds.DISCOVER_KNOWLEDGE,
        { contexts: ['architectural-illustration'] },
        signal()
      )
    )
    const definition = owner.definitions.find(
      (tool) => tool.name === AiDesignToolIds.READ_KNOWLEDGE
    )
    if (!definition) throw new Error('Missing Knowledge read definition')
    for (const entry of recorded.cases) {
      expect(
        catalog.entries.some(
          (item: { id: string }) => item.id === entry.input.ids[0]
        )
      ).toBe(true)
      const reply = await invokeLocalTool(
        owner,
        definition,
        entry.input,
        signal()
      )
      expect(reply.success).toBe(true)
      const value = JSON.parse(reply.text)
      expect(
        value.contentDelivery,
        `${entry.topic}: formerly ${entry.observed.bytes} bytes in ${entry.observed.pages} pages`
      ).toBeUndefined()
      expect(Buffer.byteLength(reply.text)).toBeLessThanOrEqual(
        informationDeliveryBytes + 1000
      )
      expect(value.trust).toBe('untrusted-advice')
      const text = value.documents
        .map((doc: { text: string }) => doc.text)
        .join('\n')
      expect(text).toContain('Never retry a settled drawing')
      const ids = value.documents.map((doc: { target: string }) => doc.target)
      expect(new Set(ids).size).toBe(ids.length)
      for (const absent of [
        'contracts.operations',
        'materials.method.parameters',
        'materials.correction',
        'repetition'
      ])
        expect(ids).not.toContain(`design.architectural-illustration.${absent}`)
      if (entry.topic === 'method') {
        expect(text).toContain('Do not quantize them merely to reduce bytes')
        expect(text).toContain('not per-cell gradient endpoints')
        expect(text).toContain('Do not infer a role')
        expect(text).toContain('part dimensions must be nonzero')
        expect(text).toContain('partition different parent bases')
        expect(text).toContain(
          'one value; it cannot encode different per-owner coordinates'
        )
        expect(text).not.toContain('"name": "Continuous material join"')
      } else {
        expect(text).toContain('Capture/bind with no `recordedChecks`')
        expect(text.replace(/\s+/g, ' ')).toContain(
          'broad evidence carries broad invalidation'
        )
        expect(text).toContain('Do not claim the entire request passed')
      }
      expect(
        (await invokeLocalTool(owner, definition, entry.input, signal())).text
      ).toBe(reply.text)
      const restored = await invokeLocalTool(
        owner,
        definition,
        { ...entry.input, rehydrate: true },
        signal()
      )
      expect(JSON.parse(restored.text).documents).toEqual(value.documents)
    }
  } finally {
    owner.dispose()
  }
})

it('selects optional Knowledge walkthroughs explicitly and deduplicates their mandatory closure', async () => {
  const { readCompleteInformation } = await import('./tool-contract-assertions')
  const owner = createLocalKnowledgeTools('optional-topic-details')
  try {
    const contexts = ['architectural-illustration']
    const catalog = JSON.parse(
      await owner.call(
        AiDesignToolIds.DISCOVER_KNOWLEDGE,
        { contexts },
        signal()
      )
    )
    const ids: string[] = []
    for (const [parent, suffix] of [
      ['materials.method', '.parameters'],
      ['contracts', '.operations']
    ]) {
      const entry = catalog.entries.find(
        (item: { id: string }) =>
          item.id === `design.architectural-illustration.${parent}`
      )
      const id = entry.children.find((child: string) => child.endsWith(suffix))
      expect(
        catalog.entries.some((item: { id: string }) => item.id === id)
      ).toBe(true)
      expect(entry.references).not.toContain(id)
      ids.push(id)
    }
    let calls = 0
    const value = JSON.parse(
      await readCompleteInformation(
        (input) => {
          calls++
          return owner.call(AiDesignToolIds.READ_KNOWLEDGE, input, signal())
        },
        { ids, contexts }
      )
    )
    expect(calls).toBeGreaterThan(1)
    const targets = value.documents.map((doc: { target: string }) => doc.target)
    expect(new Set(targets).size).toBe(targets.length)
    expect(targets).toEqual(expect.arrayContaining(ids))
    expect(targets).not.toContain(
      'design.architectural-illustration.materials.review'
    )
    expect(targets).not.toContain(
      'design.architectural-illustration.materials.correction'
    )
    const text = value.documents
      .map((doc: { text: string }) => doc.text)
      .join('\n')
    expect(text).toContain('(point - partOrigin) / partSize')
    expect(text).toContain('Nonzero size is required')
    expect(text).toContain('"name": "Continuous material join"')
    expect(text).toContain('"name": "api_element_deleteElements"')
    expect(text).toContain('Never retry a settled drawing')
  } finally {
    owner.dispose()
  }
})
