import path from 'node:path'
import process from 'node:process'
import { JsonReporter } from 'vitest/reporters'
import localization from './localization.cjs'

// Add alongside the normal reporter. This observes the same invocation and
// never spawns tests, changes assertions or assigns a passing verdict.
export default class LocalizationReporter extends JsonReporter {
  onInit(ctx) {
    super.onInit(ctx)
    this.root = path.resolve(
      process.env.FLOW_LOCALIZATION_ROOT ??
        path.join(import.meta.dirname, '../../..')
    )
    this.options = {
      manifestPaths: process.env.FLOW_LOCALIZATION_MANIFESTS
        ? JSON.parse(process.env.FLOW_LOCALIZATION_MANIFESTS)
        : undefined,
      command: {
        cwd: path.relative(this.root, process.cwd()) || '.',
        argv: [...process.argv],
        environment: Object.fromEntries(
          [
            'FLOW_LOCALIZATION_ROOT',
            'FLOW_LOCALIZATION_MANIFESTS',
            'FLOW_PROOF_SOURCE',
            'FLOW_PROOF_SCENARIO'
          ]
            .filter((name) => process.env[name] !== undefined)
            .map((name) => [name, process.env[name]])
        )
      }
    }
    this.context = localization.beginObservation(this.root, this.options)
  }

  onTestRunStart() {
    if (this.completed) {
      this.context = localization.beginObservation(this.root, this.options)
      this.completed = false
    }
  }

  async onFinished(files = this.ctx.state.getFiles(), errors = [], coverage) {
    this.projects = files.map((file) => file.projectName ?? '')
    this.errors = errors.map((error) =>
      String(error?.stack ?? error?.message ?? error)
    )
    const retainSuiteErrors = (suite, file) => {
      if (suite.type === 'test') return
      for (const error of suite.result?.errors ?? [])
        this.errors.push(
          file.filepath +
            ': ' +
            suite.name +
            '\n' +
            String(error?.stack ?? error?.message ?? error)
        )
      for (const child of suite.tasks ?? []) retainSuiteErrors(child, file)
    }
    for (const file of files) retainSuiteErrors(file, file)
    await super.onFinished(files, errors, coverage)
  }

  async writeReport(bytes) {
    const record = localization.completeObservation(
      this.root,
      this.context,
      JSON.parse(bytes),
      { projects: this.projects, errors: this.errors }
    )
    this.completed = true
    this.ctx.logger.log('Flow Inspector observation: ' + record.id)
    this.ctx.logger.log(
      'Failure context: ' +
        path.join(
          localization.observationDirectory(this.root),
          record.id + '.json'
        )
    )
  }
}
