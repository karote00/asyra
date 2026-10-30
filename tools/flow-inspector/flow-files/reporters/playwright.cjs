/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('node:path')
const { resolveProject } = require('../project.cjs')
const { capture, publish } = require('../adapters.cjs')
class FlowReporter {
  constructor(options = {}) {
    this.options = options
    this.records = new Map()
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
    this.receipt = capture(
      this.project,
      {
        ...this.scope,
        ...(suite.allTests().length
          ? {
              file: [
                ...new Set(
                  suite.allTests().map((t) => relative(t.location.file))
                )
              ]
            }
          : {})
      },
      this.scope
    )
  }
  onTestEnd(test, result) {
    const old = this.records.get(test)
    if (old?.status === 'failed') {
      return
    }
    this.records.set(test, {
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
    // Retry attempts share one TestCase; distinct repeated cases remain ambiguous.
    publish(
      this.project,
      this.receipt,
      [...this.records.values()],
      this.errors.join('\n').slice(0, 1200) ||
        (['interrupted', 'timedout'].includes(result.status)
          ? 'Execution ' + result.status
          : ''),
      { executedOnly: true }
    )
  }
}
module.exports = FlowReporter
