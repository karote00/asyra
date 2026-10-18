import { expect, it } from 'vitest'
import {
  createLocalKnowledgeTools,
  createDesignKnowledge,
  parseKnowledgeFile
} from '../local-knowledge'
import { AiDesignToolIds } from '../../src/constants/ai-design'
import { withToolContractAssertions } from './tool-contract-assertions'
const signal = () => new AbortController().signal
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
  expect(reused.alreadyDelivered).toBe(true)
  expect(reused.documents).toEqual([])
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
  expect((await read()).alreadyDelivered).toBe(true)
  expect((await read(true)).documents[0].text).toBe('Button advice')
  owner.invalidateContext()
  expect((await read()).documents[0].text).toBe('Button advice')
  expect((await read()).alreadyDelivered).toBe(true)
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
