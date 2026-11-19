import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const {
  digest
} = require('../../../tools/flow-inspector/flow-files/policy.cjs')

const {
  capture
} = require('../../../tools/flow-inspector/flow-files/adapters.cjs')

// Receipt creation delegates to the formal publication owner.
export function captureConversationGroup(project, group) {
  return capture(project, {
    producer: group.producer,
    cwd: group.cwd,
    file: group.files
  })
}

const walk = (root, directory) =>
  readdirSync(resolve(root, directory), { withFileTypes: true }).flatMap(
    (entry) => {
      if (
        ['node_modules', 'dist', 'tmp', '.git', 'test-results'].includes(
          entry.name
        )
      ) {
        return []
      }

      const file = directory + '/' + entry.name

      return entry.isDirectory() ? walk(root, file) : [file]
    }
  )

// Selection is based on maintained owner roots, independently of the reviewed
// Flow-file's required semantic cases. Neither inventory is inferred from results.
export function conversationGroups(root) {
  const app = 'apps/asyra-design'
  const groups = [
    {
      id: 'server',
      producer: 'vitest',
      cwd: app,
      config: app + '/vite.config.ts',
      environment: 'node',
      files: [
        ...walk(root, app + '/server'),
        ...walk(root, app + '/test-data/ai-drawing')
      ].filter((file) => /\.test\.tsx?$/.test(file))
    },
    {
      id: 'app',
      producer: 'vitest',
      cwd: app,
      config: app + '/vite.config.ts',
      environment: 'jsdom',
      files: walk(root, app + '/src').filter((file) =>
        /\.test\.tsx?$/.test(file)
      )
    },
    {
      id: 'runtime',
      producer: 'vitest',
      cwd: 'packages/ai-agent-runtime',
      config:
        app + '/test-data/conversation-verification/runtime.vitest.config.mjs',
      environment: 'node',
      files: walk(root, 'packages/ai-agent-runtime/src').filter((file) =>
        /\.test\.tsx?$/.test(file)
      )
    },
    {
      id: 'node',
      producer: 'node',
      cwd: '.',
      config: app + '/scripts/verify-conversation.mjs',
      files: [
        ...walk(root, app + '/__tests__'),
        ...walk(root, app + '/scripts'),
        ...walk(root, app + '/src'),
        ...walk(root, app + '/test-data/knowledge-evaluation'),
        ...walk(root, app + '/test-data/ai-drawing'),
        ...[
          'evidence',
          'localization',
          'node-results',
          'runner-report',
          'runner-inventory',
          'runner',
          'snapshot',
          'workspace-sources',
          'contracts',
          'playwright-results',
          'store',
          'observation-lifecycle'
        ].map(
          (name) =>
            'tools/flow-inspector/control-plane/__tests__/' + name + '.test.cjs'
        ),
        ...[
          'adapters',
          'policy',
          'store',
          'producers',
          'gate',
          'bundles',
          'project'
        ].map(
          (name) =>
            'tools/flow-inspector/flow-files/__tests__/' + name + '.test.cjs'
        ),
        'scripts/__tests__/domain-knowledge.test.mjs',
        'tools/flow-inspector/inspectors/__tests__/ai-execution-flow-inspector.contract.test.cjs',
        'tools/flow-inspector/inspectors/__tests__/ai-conversational-drawing-performance-flow-inspector.contract.test.cjs'
      ].filter((file) => /\.test\.[cm]js$/.test(file))
    },
    {
      id: 'browser',
      producer: 'playwright',
      cwd: app,
      config: app + '/playwright.conversation.config.ts',
      files: walk(root, app + '/e2e').filter(
        (file) =>
          /\/(?:ai-[^/]+|conversational-ai|conversation-provider-handoff|local-ai-provider)\.spec\.ts$/.test(
            file
          ) ||
          [
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
          ].some((name) => file === `${app}/e2e/${name}.spec.ts`)
      )
    }
  ]

  return groups.map((group) => ({
    ...group,
    files: [...new Set(group.files)].sort()
  }))
}

// This reconciles independently authored semantic expectations only. Shared
// runner admission remains responsible for execution status and report validity.
export function validateRequiredHandoffs(expected, records) {
  const issues = []

  for (const item of expected) {
    const matches = records.filter(
      (record) => digest(record.selector) === digest(item)
    )

    if (!matches.length) {
      issues.push('Missing required handoff: ' + item.file + ': ' + item.title)
    } else if (matches.length !== 1) {
      issues.push(
        'Duplicate required handoff: ' + item.file + ': ' + item.title
      )
    } else if (matches[0].status !== 'passed') {
      issues.push(
        'Unsuccessful required handoff: ' + item.file + ': ' + item.title
      )
    }
  }

  return issues
}

// Consume the formal evaluator's evidence state; manual acceptance stays separate.
export function validateConversationEvidence(evaluation) {
  const issues = []

  for (const flow of evaluation.flows) {
    for (const node of [...flow.nodes, flow.integration]) {
      for (const criterion of node.criteria) {
        if (criterion.kind === 'automated' && !criterion.satisfied) {
          issues.push(
            'Incomplete automated evidence: ' +
              flow.id +
              '/' +
              node.id +
              '/' +
              criterion.id +
              ': ' +
              criterion.status
          )
        }
      }

      for (const warning of node.context.warnings) {
        issues.push(
          'Unresolved evidence warning: ' +
            flow.id +
            '/' +
            node.id +
            ': ' +
            warning.summary
        )
      }
    }
  }

  return issues
}

// Minimum areas mandated by ai-conversation-verification.md, independently of
// the selected Flow. This checks omission, not exhaustive clause interpretation.
export function validateConversationProofDefinition(definitions) {
  const issues = []

  for (const definition of definitions) {
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
      const node = definition.nodes.find((candidate) => candidate.id === id)

      if (!node || !node.required || !node.applicable) {
        issues.push('Missing required handoff area: ' + id)
      }
    }

    if (
      !definition.criteria.some(
        (criterion) =>
          criterion.id === 'spec-coverage-review' && criterion.kind === 'manual'
      )
    ) {
      issues.push('Missing independent spec-coverage review')
    }
  }

  if (!definitions.length) {
    issues.push('Missing conversation verification definition')
  }

  return issues
}
