/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs'),
  path = require('node:path')
const { safePath } = require('../control-plane/snapshot.cjs')
const { admitProject } = require('./schema.cjs')
const CONFIG = 'flow-inspector.config.json'
function readJson(file, limit = 4 * 1024 * 1024) {
  const stat = fs.lstatSync(file)
  if (!stat.isFile() || stat.size > limit) {
    throw new Error(file + ': Invalid file or size')
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    throw new Error(file + ': ' + error.message)
  }
}
function dataPath(root, relative) {
  if (
    typeof relative !== 'string' ||
    !relative ||
    path.isAbsolute(relative) ||
    relative.includes('\\') ||
    relative.includes('\0') ||
    relative
      .split('/')
      .some((p) => !p || p === '.' || p === '..' || p === 'node_modules')
  ) {
    throw new Error('Expected project-relative data path outside node_modules')
  }
  return safePath(root, relative)
}
function resolveProject(selected, cwd = process.cwd()) {
  let config
  if (selected) {
    const file = path.resolve(cwd, selected)
    config = fs.statSync(file).isDirectory() ? path.join(file, CONFIG) : file
  } else {
    let dir = path.resolve(cwd)
    while (true) {
      const file = path.join(dir, CONFIG)
      if (fs.existsSync(file)) {
        config = file
        break
      }
      const parent = path.dirname(dir)
      if (parent === dir) {
        throw new Error(
          'No ' + CONFIG + '; run flow-inspector init or use --project'
        )
      }
      dir = parent
    }
  }
  const root = fs.realpathSync(path.dirname(config))
  if (root.split(path.sep).includes('node_modules')) {
    throw new Error('Project cannot be inside node_modules')
  }
  const value = readJson(config, 16384)
  if (
    value.schemaVersion !== 1 ||
    Object.keys(value).sort().join(',') !== 'flows,projectId,schemaVersion' ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(value.projectId ?? '')
  ) {
    throw new Error(config + ': Invalid project configuration')
  }
  const directory = dataPath(root, value.flows)
  if (!fs.statSync(directory).isDirectory()) {
    throw new Error('Flow directory is unavailable')
  }
  return Object.freeze({
    root,
    config: path.join(root, path.basename(config)),
    directory,
    ...value
  })
}
function initialize(root, template = 'manual', projectId = 'project') {
  root = fs.realpathSync(root)
  if (root.split(path.sep).includes('node_modules')) {
    throw new Error('Project cannot be inside node_modules')
  }
  if (
    !['manual', 'mixed', 'custom', 'vitest', 'playwright'].includes(template)
  ) {
    throw new Error('Unknown template')
  }
  const flow = structuredClone(require('./examples/manual.flow.json'))
  flow.projectId = projectId
  const node = flow.definition.nodes[0]
  node.id = 'review'
  flow.flowId = 'checkout'
  const files = new Map()
  const config = { schemaVersion: 1, projectId, flows: 'flows' }
  files.set(CONFIG, JSON.stringify(config, null, 2) + '\n')
  if (template !== 'manual') {
    node.criteria = [
      {
        id: 'check',
        title: 'Addition satisfies its contract',
        kind: 'automated'
      }
    ]
    if (template === 'mixed') {
      node.criteria.push({
        id: 'accepted',
        title: 'Human review accepted',
        kind: 'manual'
      })
    }
    node.specRefs = ['flow-example/README.md']
    node.implementationRefs = ['flow-example/feature.cjs']
    files.set('flow-example/feature.cjs', 'exports.add = (a, b) => a + b\n')
    files.set(
      'flow-example/README.md',
      '# Addition contract\n\nAdding two numbers returns their sum.\n'
    )
    let argv = ['node', 'flow-example/check.cjs']
    if (template === 'vitest' || template === 'playwright') {
      const isVitest = template === 'vitest'
      const file = isVitest
        ? 'flow-example/feature.test.mjs'
        : 'flow-example/feature.spec.cjs'
      const runnerConfig = 'flow-example/' + template + '.config.mjs'
      const title = 'adds [two] + values'
      node.criteria[0].selector = {
        producer: template,
        identity: JSON.stringify({
          file,
          title,
          project: 'example',
          config: runnerConfig,
          cwd: '.'
        })
      }
      argv = [
        'node',
        'node_modules/@asyra/flow-inspector/bin/flow-inspector.cjs',
        'run',
        flow.flowId,
        node.id,
        'check'
      ]
      files.set(
        file,
        isVitest
          ? "import { test, expect } from 'vitest'\nimport feature from './feature.cjs'\ntest('adds [two] + values', () => expect(feature.add(2, 3)).toBe(5))\n"
          : "const { test, expect } = require('@playwright/test')\nconst feature = require('./feature.cjs')\ntest('adds [two] + values', () => expect(feature.add(2, 3)).toBe(5))\n"
      )
      files.set(
        runnerConfig,
        isVitest
          ? "export default { test: { name: 'example', include: ['flow-example/*.test.mjs'] } }\n"
          : "export default { testDir: '.', testMatch: '*.spec.cjs', projects: [{ name: 'example', use: { channel: 'chrome' } }] }\n"
      )
    } else {
      files.set(
        'flow-example/check.cjs',
        `const { openProject, resolveProject, admitProject, nodeBinding } = require('@asyra/flow-inspector')
const env = process.env
const project = resolveProject()
const store = openProject(project.directory)
const snapshot = store.snapshot()
const flowId = env.FLOW_ID || 'checkout', nodeId = env.FLOW_NODE_ID || 'review'
const doc = snapshot.documents.find(d => d.flowId === flowId)
const binding = nodeBinding(admitProject(snapshot.documents), flowId, nodeId)
const { add } = require('./feature.cjs')
const passed = add(2, 3) === 5
store.update(flowId, {
  expectedRevision: env.FLOW_EXPECTED_REVISION ? Number(env.FLOW_EXPECTED_REVISION) : doc.revision, kind: 'observation',
  value: { nodeId, criterionId: 'check', kind: 'automated',
    status: passed ? 'passed' : 'failed', binding: env.FLOW_BINDING || binding,
    actor: 'custom', executionId: env.FLOW_EXECUTION_ID || require('node:crypto').randomUUID(), caseId: 'addition',
    summary: passed ? 'Addition verified' : 'Expected add(2, 3) to equal 5', at: new Date().toISOString() }
})
process.exitCode = passed ? 0 : 1
`
      )
    }
    node.actions = [
      {
        id: 'check',
        label: 'Verify addition',
        kind: 'command',
        argv,
        cwd: '.',
        criterionIds: ['check'],
        inputs: ['flow-example']
      }
    ]
  }
  admitProject([flow])
  files.set('flows/checkout.flow.json', JSON.stringify(flow, null, 2) + '\n')
  for (const name of files.keys()) {
    if (fs.existsSync(dataPath(root, name))) {
      throw new Error('Initialization would overwrite ' + name)
    }
  }
  // Do not mix example output into an existing flow directory.
  if (fs.existsSync(dataPath(root, 'flows'))) {
    throw new Error('Initialization requires an unoccupied flows directory')
  }
  const written = []
  try {
    for (const [name, bytes] of files) {
      const file = dataPath(root, name)
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, bytes, { flag: 'wx' })
      written.push(file)
    }
  } catch (error) {
    for (const file of written) {
      fs.unlinkSync(file)
    }
    throw error
  }
  return resolveProject(root)
}
module.exports = { CONFIG, readJson, dataPath, resolveProject, initialize }
