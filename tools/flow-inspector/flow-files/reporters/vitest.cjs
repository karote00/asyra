/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('node:path')
const { resolveProject } = require('../project.cjs')
const { capture, publish } = require('../adapters.cjs')
class FlowReporter {
  constructor(options = {}) {
    this.options = options
  }
  onInit(context) {
    this.context = context
  }
  onTestRunStart(specifications) {
    this.project = resolveProject(this.options.project)
    const relative = (file) =>
      path.relative(this.project.root, file).split(path.sep).join('/')
    this.scope = {
      producer: 'vitest',
      config:
        this.options.config ?? relative(this.context.vite.config.configFile),
      cwd: this.options.cwd ?? (relative(this.context.config.root) || '.')
    }
    this.receipt = capture(
      this.project,
      {
        ...this.scope,
        ...(specifications.length
          ? { file: specifications.map((s) => relative(s.moduleId)) }
          : {})
      },
      this.scope
    )
    this.records = []
  }
  onTestCaseResult(test) {
    const titles = [test.name]
    let parent = test.parent
    while (parent.type !== 'module') {
      titles.unshift(parent.name)
      parent = parent.parent
    }
    const result = test.result()
    this.records.push({
      selector: {
        ...this.scope,
        file: path
          .relative(this.project.root, test.module.moduleId)
          .split(path.sep)
          .join('/'),
        title: titles.join(' '),
        project: test.project.name ?? ''
      },
      status: result.state,
      details: (result.errors ?? []).map((e) => e.stack || e.message)
    })
  }
  onTestRunEnd(_modules, errors, reason) {
    let diagnostic = reason === 'interrupted' ? 'Execution interrupted' : ''
    if (errors.length)
      diagnostic = errors
        .map((e) => e.message)
        .join('\n')
        .slice(0, 1200)
    publish(this.project, this.receipt, this.records, diagnostic, {
      executedOnly: true
    })
  }
}
module.exports = FlowReporter
