/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('node:path')
const { resolveProject } = require('../project.cjs')
const { capture, publish } = require('../adapters.cjs')
class FlowReporter {
  constructor(options = {}) {
    this.options = options
    this.records = []
    this.errors = []
  }
  onBegin(config, suite) {
    this.project = resolveProject(this.options.project)
    const relative = (file) =>
      path.relative(this.project.root, file).split(path.sep).join('/')
    this.scope = {
      producer: 'playwright',
      config: this.options.config ?? relative(config.configFile),
      cwd: this.options.cwd ?? '.'
    }
    this.receipt = capture(this.project, {
      ...this.scope,
      ...(suite.allTests().length
        ? {
            file: [
              ...new Set(suite.allTests().map((t) => relative(t.location.file)))
            ]
          }
        : {})
    })
  }
  onTestEnd(test, result) {
    this.records.push({
      selector: {
        ...this.scope,
        file: path
          .relative(this.project.root, test.location.file)
          .split(path.sep)
          .join('/'),
        title: test.titlePath().slice(3).join(' '),
        project: test.parent.project().name
      },
      status: result.status === 'timedOut' ? 'failed' : result.status,
      details: result.errors.map((e) => e.stack || e.message || String(e))
    })
  }
  onError(error) {
    this.errors.push(error.message || String(error))
  }
  onEnd(result) {
    // Retries never turn a failing attempt into passing current evidence.
    const records = new Map()
    for (const record of this.records) {
      const key = JSON.stringify(record.selector),
        old = records.get(key)
      if (!old || old.status !== 'failed') records.set(key, record)
    }
    publish(
      this.project,
      this.receipt,
      [...records.values()],
      this.errors.join('\n').slice(0, 1200) ||
        (['interrupted', 'timedout'].includes(result.status)
          ? 'Execution ' + result.status
          : '')
    )
  }
}
module.exports = FlowReporter
