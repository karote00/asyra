import { mkdtempSync, writeFileSync, rmSync, appendFileSync } from 'node:fs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname, basename, relative } from 'node:path'
import ts from 'typescript'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const {
  normalize,
  capture,
  publish
} = require('../../../../tools/flow-inspector/flow-files/adapters.cjs')

import {
  conversationGroups,
  captureConversationGroup,
  validateConversationEvidence,
  validateConversationProofDefinition,
  validateRequiredHandoffs
} from '../conversation-scope.mjs'

const root = resolve(import.meta.dirname, '../../../..')

const {
  resolveProject,
  initialize
} = require('../../../../tools/flow-inspector/flow-files/project.cjs')

test('required conversation cases are admitted by the formal evidence capture path', () => {
  const project = resolveProject(
    resolve(root, 'conversation-flow-inspector.config.json'),
    root
  )
  const captured = capture(project)

  assert.ok(captured.cases.length > 0)
  assert.ok(
    captured.cases.some(
      (item) =>
        item.selector.title ===
        'repairs a current canonical target through a real host iteration without a model round trip'
    )
  )
})

test('execution selection includes each independently required handoff file', () => {
  const groups = conversationGroups(root)
  const files = groups.flatMap((group) => group.files)
  const flow = JSON.parse(
    readFileSync(
      resolve(
        root,
        'apps/asyra-design/test-data/conversation-verification/flow/conversation.flow.json'
      ),
      'utf8'
    )
  )
  const required = flow.definition.nodes.flatMap((node) =>
    node.criteria
      .filter((c) => c.selector)
      .map((c) => JSON.parse(c.selector.identity).file)
  )

  // Mandatory areas are a minimum. Additional reviewed areas do not invalidate
  // existing proof; this does not establish exhaustive specification coverage.
  assert.deepEqual(validateConversationProofDefinition([flow.definition]), [])
  assert.ok(required.length > 0)
  for (const file of required) {
    assert.ok(files.includes(file), 'Unselected required handoff: ' + file)
  }

  assert.equal(new Set(files).size, files.length)
  assert.ok(files.includes('scripts/__tests__/domain-knowledge.test.mjs'))
  for (const name of [
    'ai-execution',
    'ai-conversational-drawing-performance'
  ]) {
    assert.ok(
      files.includes(
        'tools/flow-inspector/inspectors/__tests__/' +
          name +
          '-flow-inspector.contract.test.cjs'
      ),
      'Missing referenced architecture tests: ' + name
    )
  }

  assert.ok(
    files.includes(
      'apps/asyra-design/src/ai/__tests__/action-batch-production-bundle.test.mjs'
    ),
    'The frontend provider boundary requires its maintained production-bundle proof'
  )
  assert.ok(
    files.includes(
      'apps/asyra-design/server/__tests__/native-provider-handoff.integration.test.ts'
    )
  )
  assert.ok(
    files.includes(
      'apps/asyra-design/e2e/conversation-provider-handoff.spec.ts'
    )
  )
})

test('selection covers real action consumers and evaluation lifecycle owners regardless of filename prefix', () => {
  const files = new Set(
    conversationGroups(root).flatMap((group) => group.files)
  )
  const app = 'apps/asyra-design'

  // Independently reviewed request/prepare/apply/inspect/settle owner evidence.
  // These files use the real action path; none invokes a live drawing model.
  for (const name of [
    'action-usage',
    'basic-api-actions',
    'design-construction',
    'design-containers',
    'design-organization',
    'editable-design-variants',
    'editable-design',
    'fill-patch',
    'indexed-design-query',
    'recorded-document-reload',
    'drawing-inspection',
    'drawing-framing'
  ]) {
    assert.ok(
      files.has(`${app}/e2e/${name}.spec.ts`),
      `Missing canonical consumer: ${name}`
    )
  }

  for (const name of [
    'browser-snapshot',
    'live-test-deadline',
    'remote-recording',
    'drawing-framing'
  ]) {
    assert.ok(
      files.has(`${app}/test-data/ai-drawing/__tests__/${name}.test.mjs`),
      `Missing evaluation owner: ${name}`
    )
  }

  assert.ok(
    files.has(
      `${app}/test-data/ai-drawing/__tests__/action-batch-interceptor.test.ts`
    )
  )
})

test('new browser consumers cannot disappear solely because their filename lacks the AI prefix', () => {
  const app = 'apps/asyra-design'
  const files = new Set(
    conversationGroups(root).flatMap((group) => group.files)
  )
  const benchmarkOwners = new Set([
    'collaboration-ai-agent-video.spec.ts',
    'collaboration.spec.ts',
    'crdt-7076-render.spec.ts',
    'crdt-endpoint-performance.spec.ts'
  ])
  const directConsumers = readdirSync(resolve(root, app, 'e2e'))
    .filter((name) => name.endsWith('.spec.ts'))
    .filter((name) => {
      const source = readFileSync(resolve(root, app, 'e2e', name), 'utf8')

      return /\/src\/ai\/|\/api\/ai\/|action-batch-interceptor|createAiRuntimeInput|registerAiAgentFeature/.test(
        source
      )
    })
    .filter((name) => !benchmarkOwners.has(name))
    .map((name) => `${app}/e2e/${name}`)

  const assertConsumers = (selected) => {
    for (const file of directConsumers) {
      assert.ok(
        selected.has(file),
        `Unclassified direct conversation consumer: ${file}`
      )
    }
  }

  // This is an independent source-association tripwire, not semantic acceptance.
  // The preceding spec-owned list also covers indirect inspection/framing owners.
  assertConsumers(files)
  const missing = new Set(files)

  missing.delete(`${app}/e2e/action-usage.spec.ts`)
  assert.throws(
    () => assertConsumers(missing),
    /Unclassified direct conversation consumer:.*action-usage/
  )
})

test('formal verifier dependencies retain their existing owner regressions in selection', () => {
  const selected = new Set(
    conversationGroups(root).flatMap((group) => group.files)
  )
  const pending = [
    resolve(root, 'apps/asyra-design/scripts/verify-conversation.mjs')
  ]
  const visited = new Set()
  const required = new Set()

  // Independently inspect literal module dependencies with the declared compiler.
  // This checks verifier-owner selection, not product specification completeness.
  while (pending.length) {
    const file = pending.pop()

    if (visited.has(file)) {
      continue
    }

    visited.add(file)
    const localRequire = createRequire(file)
    const source = ts.createSourceFile(
      file,
      readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true
    )

    const visit = (node) => {
      let specifier

      if (
        ts.isImportDeclaration(node) &&
        ts.isStringLiteralLike(node.moduleSpecifier)
      ) {
        specifier = node.moduleSpecifier.text
      }

      if (
        ts.isCallExpression(node) &&
        node.arguments.length &&
        ts.isStringLiteralLike(node.arguments[0]) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) &&
            node.expression.text === 'require'))
      ) {
        specifier = node.arguments[0].text
      }

      if (specifier?.startsWith('.')) {
        const dependency = localRequire.resolve(specifier)

        if (
          dependency.startsWith(root + '/') &&
          /\.[cm]?js$/.test(dependency)
        ) {
          pending.push(dependency)
        }
      }

      ts.forEachChild(node, visit)
    }

    visit(source)
    if (file.startsWith(resolve(root, 'tools/flow-inspector') + '/')) {
      const testFile = resolve(
        dirname(file),
        '__tests__',
        basename(file).replace(/\.[cm]?js$/, '.test.cjs')
      )

      if (existsSync(testFile)) {
        required.add(relative(root, testFile))
      }
    }
  }

  assert.ok(required.size > 0)
  assert.deepEqual(
    [...required].filter((file) => !selected.has(file)).sort(),
    [],
    'Omitted verifier dependency tests'
  )
})

test('declared handoffs require complete shared producer identity and successful observations', () => {
  const scope = {
    producer: 'vitest',
    cwd: 'apps/asyra-design',
    config: 'apps/asyra-design/package.json',
    project: 'chromium'
  }
  const expected = [
    {
      ...scope,
      file: 'apps/asyra-design/server/__tests__/native-provider-handoff.integration.test.ts',
      title: 'passes the complete value and status'
    }
  ]
  const report = {
    success: true,
    testResults: [
      {
        name: resolve(root, expected[0].file),
        assertionResults: [{ fullName: expected[0].title, status: 'passed' }]
      }
    ]
  }
  const correct = normalize({ root }, report, scope)

  assert.deepEqual(validateRequiredHandoffs(expected, correct), [])
  assert.match(
    validateRequiredHandoffs(expected, []).join('\n'),
    /Missing required handoff/
  )
  for (const key of ['producer', 'config', 'cwd', 'project', 'file', 'title']) {
    const foreign = globalThis.globalThis.structuredClone(correct)

    foreign[0].selector[key] = 'different-' + key
    assert.match(
      validateRequiredHandoffs(expected, foreign).join('\n'),
      /Missing required handoff/
    )
  }

  const skipped = globalThis.globalThis.structuredClone(correct)

  skipped[0].status = 'skipped'
  assert.match(
    validateRequiredHandoffs(expected, skipped).join('\n'),
    /Unsuccessful required handoff/
  )

  const failed = globalThis.globalThis.structuredClone(correct)

  failed[0].status = 'failed'
  assert.match(
    validateRequiredHandoffs(expected, failed).join('\n'),
    /Unsuccessful required handoff/
  )
  assert.match(
    validateRequiredHandoffs(expected, [...correct, ...correct]).join('\n'),
    /Duplicate required handoff/
  )
})

test('execution configuration identity is independent of expected selectors', () => {
  const groups = conversationGroups(root)
  const expectedConfigurations = {
    server: 'apps/asyra-design/vite.config.ts',
    app: 'apps/asyra-design/vite.config.ts',
    runtime:
      'apps/asyra-design/test-data/conversation-verification/runtime.vitest.config.mjs',
    node: 'apps/asyra-design/scripts/verify-conversation.mjs',
    browser: 'apps/asyra-design/playwright.conversation.config.ts'
  }

  for (const group of groups) {
    assert.equal(group.config, expectedConfigurations[group.id], group.id)
    const scope = {
      producer: group.producer,
      cwd: group.cwd,
      config: group.config,
      project: group.producer === 'playwright' ? 'chromium' : ''
    }
    const actual = {
      ...scope,
      file: group.files[0],
      title: 'Independent identity'
    }
    const foreign = { ...actual, config: 'unrelated/package.json' }
    const observed = [{ selector: actual, status: 'passed' }]

    assert.deepEqual(validateRequiredHandoffs([actual], observed), [])
    assert.match(
      validateRequiredHandoffs([foreign], observed).join('\n'),
      /Missing required/
    )
    assert.deepEqual(
      validateRequiredHandoffs([actual, foreign], observed),
      validateRequiredHandoffs([foreign, actual], observed)
    )
  }
})

test('current execution architecture references only existing implementation owners', () => {
  const { existsSync } = require('node:fs')
  const architecture = require('../../../../tools/flow-inspector/inspectors/ai-execution-flow-inspector.data.cjs')
  const missing = architecture.steps.flatMap((step) =>
    step.implementationBoundary
      .filter((file) => !existsSync(resolve(root, file)))
      .map((file) => ({ step: step.id, file }))
  )

  assert.deepEqual(missing, [])
})

test('separate runner groups publish only their owned files and preserve missing duplicate and stale rejection', async (t) => {
  const directory = mkdtempSync(resolve(root, 'tmp/conversation-publication-'))

  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const project = initialize(directory, 'vitest')
  const flowPath = resolve(project.directory, 'checkout.flow.json')
  const flow = JSON.parse(readFileSync(flowPath, 'utf8'))
  const firstFile = 'flow-example/feature.test.mjs'
  const secondFile = 'flow-example/retained.test.mjs'
  const config = 'flow-example/vitest.config.mjs'

  writeFileSync(
    resolve(directory, secondFile),
    `import { test, expect } from 'vitest'
 test('retains the computed value', () => expect({ value: 7 }.value).toBe(7))
`
  )
  flow.definition.nodes[0].criteria.push({
    id: 'retained',
    title: 'Retained value is available',
    kind: 'automated',
    selector: {
      producer: 'vitest',
      identity: JSON.stringify({
        file: secondFile,
        title: 'retains the computed value',
        project: 'example',
        config,
        cwd: '.'
      })
    }
  })
  flow.definition.criteria = [
    {
      id: 'semantic-review',
      title: 'Independent semantic review',
      kind: 'manual'
    }
  ]
  writeFileSync(flowPath, JSON.stringify(flow))
  const {
    openProject
  } = require('../../../../tools/flow-inspector/flow-files/store.cjs')
  const store = openProject(project.directory)
  const groups = [firstFile, secondFile].map((file) => ({
    producer: 'vitest',
    cwd: '.',
    config,
    files: [file]
  }))
  const records = []

  assert.equal(
    validateConversationEvidence(store.snapshot().evaluation).length,
    2
  )
  for (const [index, group] of groups.entries()) {
    const receipt = captureConversationGroup(project, group)
    const reportPath = resolve(directory, `report-${index}.json`)
    const {
      runProcess
    } = require('../../../../tools/flow-inspector/control-plane/runner.cjs')
    const result = await runProcess({
      executable: resolve(root, 'node_modules/.bin/vitest'),
      args: [
        'run',
        '--config',
        config,
        '--reporter=json',
        '--outputFile=' + reportPath,
        ...group.files
      ],
      cwd: directory,
      timeoutMs: 30000,
      maxOutputBytes: 1024 * 1024
    })

    assert.equal(result.code, 0, result.output)
    assert.equal(result.reason, null)
    assert.equal(result.exitSignal, null)
    const report = JSON.parse(readFileSync(reportPath, 'utf8'))
    const values = normalize(project, report, {
      producer: group.producer,
      cwd: group.cwd,
      config,
      project: 'example'
    })

    assert.equal(values.length, 1)
    assert.equal(values[0].status, 'passed')
    records.push(values)
    publish(project, receipt, values)
  }

  assert.deepEqual(store.snapshot().documents[0].current.warnings, [])
  assert.equal(store.snapshot().evaluation.flows[0].nodes[0].status, 'done')
  assert.deepEqual(
    validateConversationEvidence(store.snapshot().evaluation),
    []
  )
  assert.equal(
    store.snapshot().evaluation.flows[0].integration.criteria[0].satisfied,
    false
  )
  for (const group of groups) {
    assert.deepEqual(
      captureConversationGroup(project, group).cases.map(
        (item) => item.selector.file
      ),
      group.files
    )
  }

  publish(project, captureConversationGroup(project, groups[0]), [])
  assert.notEqual(store.snapshot().evaluation.flows[0].nodes[0].status, 'done')
  assert.ok(
    validateConversationEvidence(store.snapshot().evaluation).length > 0
  )
  assert.match(
    store.snapshot().documents[0].current.warnings[0].summary,
    /No completed test result/
  )
  publish(project, captureConversationGroup(project, groups[0]), records[0])
  assert.equal(store.snapshot().evaluation.flows[0].nodes[0].status, 'done')

  publish(project, captureConversationGroup(project, groups[0]), [
    ...records[0],
    ...records[0]
  ])
  assert.notEqual(store.snapshot().evaluation.flows[0].nodes[0].status, 'done')
  assert.ok(
    validateConversationEvidence(store.snapshot().evaluation).length > 0
  )
  assert.match(
    store.snapshot().documents[0].current.warnings[0].summary,
    /Ambiguous/
  )
  publish(project, captureConversationGroup(project, groups[0]), records[0])

  const stale = captureConversationGroup(project, groups[0])

  appendFileSync(resolve(directory, firstFile), '\n// Changed after capture.\n')
  publish(project, stale, records[0])
  assert.notEqual(store.snapshot().evaluation.flows[0].nodes[0].status, 'done')
  assert.ok(
    validateConversationEvidence(store.snapshot().evaluation).length > 0
  )
  assert.match(
    store.snapshot().documents[0].current.warnings[0].summary,
    /Source changed/
  )
})

test('required review areas cannot disappear or be excluded while additional obligations remain allowed', () => {
  const definition = JSON.parse(
    readFileSync(
      resolve(
        root,
        'apps/asyra-design/test-data/conversation-verification/flow/conversation.flow.json'
      ),
      'utf8'
    )
  ).definition

  for (const id of [
    'request',
    'instructions',
    'discovery',
    'knowledge',
    'admission',
    'composition',
    'canonical',
    'results',
    'retention',
    'media',
    'lifecycle',
    'evidence'
  ]) {
    for (const mode of ['missing', 'optional', 'excluded']) {
      const candidate = globalThis.structuredClone(definition)

      if (mode === 'missing') {
        candidate.nodes = candidate.nodes.filter((node) => node.id !== id)
      } else {
        const node = candidate.nodes.find((node) => node.id === id)

        if (mode === 'optional') {
          node.required = false
        } else {
          node.applicable = false
        }
      }

      assert.ok(
        validateConversationProofDefinition([candidate]).includes(
          'Missing required handoff area: ' + id
        )
      )
    }
  }

  const extended = globalThis.structuredClone(definition)

  extended.nodes.push({
    ...globalThis.structuredClone(extended.nodes[0]),
    id: 'future-required-owner'
  })
  assert.deepEqual(validateConversationProofDefinition([extended]), [])
  assert.deepEqual(validateConversationProofDefinition([]), [
    'Missing conversation verification definition'
  ])
})
