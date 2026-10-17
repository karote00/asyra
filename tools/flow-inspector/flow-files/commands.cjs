/* global AbortController */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const {
  resolveProject,
  initialize,
  readJson,
  dataPath
} = require('./project.cjs')
const { openProject } = require('./store.cjs')
const { gateSummary } = require('./policy.cjs')
function parse(args) {
  const positional = [],
    options = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const name = args[i].slice(2)
      if (
        ![
          'project',
          'template',
          'id',
          'manual',
          'url',
          'output',
          'receipt',
          'report',
          'runner',
          'config',
          'cwd',
          'runner-project'
        ].includes(name) ||
        name in options ||
        !args[i + 1] ||
        args[i + 1].startsWith('--')
      )
        throw new Error('Invalid option ' + args[i])
      options[name] = args[++i]
    } else positional.push(args[i])
  }
  return { positional, options }
}
async function main(
  args,
  write = (value) => console.log(JSON.stringify(value, null, 2))
) {
  const {
    positional: [command, flowId, nodeId, criterionId],
    options
  } = parse(args)
  if (command === 'init') {
    write(
      initialize(options.project ?? process.cwd(), options.template, options.id)
    )
    return 0
  }
  const project = resolveProject(options.project),
    store = openProject(project.directory)
  const snapshot = () => {
    const value = store.snapshot()
    if (value.evaluation.projectId !== project.projectId)
      throw new Error('Wrong project identity')
    return value
  }
  const output = (value) => {
    if (options.output)
      fs.writeFileSync(
        dataPath(project.root, options.output),
        JSON.stringify(value, null, 2) + '\n',
        { flag: 'wx' }
      )
    else write(value)
  }
  if (command === 'validate') {
    write({ status: 'valid', projectId: snapshot().evaluation.projectId })
    return 0
  }
  if (['evaluate', 'ci'].includes(command)) {
    const value = gateSummary(snapshot(), options.manual)
    write(value)
    return value.exitCode
  }
  if (command === 'context') {
    const { compactContext } = require('./context.cjs')
    const value = snapshot(),
      flow = value.evaluation.flows.find((f) => f.id === flowId)
    const node =
      nodeId === 'integration'
        ? flow?.integration
        : flow?.nodes.find((n) => n.id === nodeId)
    if (!node) throw new Error('Unknown flow or node')
    write({ ...compactContext(node.context), flowFile: value.files[flowId] })
    return 0
  }
  if (command === 'update') {
    snapshot()
    write(store.update(flowId, readJson(dataPath(project.root, nodeId))))
    return 0
  }
  if (command === 'export') {
    output(require('./bundles.cjs').exportCurrent(project))
    return 0
  }
  if (command === 'import') {
    write(
      require('./bundles.cjs').importCurrent(
        project,
        readJson(dataPath(project.root, flowId), 400 * 1024 * 1024)
      ).evaluation
    )
    return 0
  }
  if (command === 'begin') {
    const filter = Object.fromEntries(
      Object.entries({ flowId, nodeId, criterionId }).filter(
        ([, v]) => v !== undefined
      )
    )
    output(require('./adapters.cjs').capture(project, filter))
    return 0
  }
  if (command === 'ingest') {
    const { normalize, publish, reportDiagnostic } = require('./adapters.cjs')
    const receipt = readJson(dataPath(project.root, options.receipt))
    const scope = {
      producer: options.runner,
      config: options.config,
      cwd: options.cwd ?? '.',
      project: options['runner-project'] ?? ''
    }
    let records = [],
      diagnostic = ''
    try {
      const report = readJson(
        dataPath(project.root, options.report),
        32 * 1024 * 1024
      )
      records = normalize(project, report, scope)
      diagnostic = reportDiagnostic(report, records)
    } catch (error) {
      diagnostic = ('Invalid report: ' + error.message).slice(0, 1200)
    }
    const documents = publish(project, receipt, records, diagnostic)
    write({
      status: diagnostic ? 'invalid' : 'imported',
      documents,
      diagnostic
    })
    return diagnostic ? 2 : 0
  }
  if (command === 'run') {
    if (!flowId || !nodeId || !criterionId)
      throw new Error('run requires flow, node and criterion identities')
    const controller = new AbortController()
    const cancel = () => controller.abort()
    process.once('SIGINT', cancel)
    process.once('SIGTERM', cancel)
    try {
      const result = await require('./portable-runner.cjs').runSelected(
        project,
        { flowId, nodeId, criterionId },
        { signal: controller.signal }
      )
      write(result)
      return result.code
    } finally {
      process.removeListener('SIGINT', cancel)
      process.removeListener('SIGTERM', cancel)
    }
  }
  if (command === 'serve') {
    snapshot()
    const server = await require('./server.cjs').startFlowServer(project.root, {
      directory: project.directory,
      url: options.url,
      projectId: project.projectId
    })
    write({
      url: server.origin,
      pid: process.pid,
      projectId: project.projectId
    })
    let closing = false
    const close = async () => {
      if (!closing) {
        closing = true
        await server.close()
      }
    }
    process.once('SIGINT', close)
    process.once('SIGTERM', close)
    return 0
  }
  throw new Error(
    'Expected init, validate, evaluate, ci, context, update, begin, ingest, run, export, import or serve'
  )
}
module.exports = { main }
