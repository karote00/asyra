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
            'FLOW_PROOF_SCENARIO',
            'FLOW_RESULT_REPOSITORY',
            'FLOW_RESULT_BASE',
            'FLOW_RESULT_HEAD',
            'FLOW_RESULT_INTEGRATION',
            'FLOW_RESULT_RUN',
            'FLOW_RESULT_ATTEMPT'
          ]
            .filter((name) => process.env[name] !== undefined)
            .map((name) => [name, process.env[name]])
        )
      }
    }
    this.context = localization.beginObservation(this.root, this.options)
  }

  onTestRunStart(specifications) {
    this.executedFiles = specifications
      ? new Set(
          specifications.map((spec) =>
            JSON.stringify([spec.moduleId, spec.project.name ?? ''])
          )
        )
      : null
    if (this.completed) {
      this.context = localization.beginObservation(this.root, this.options)
      this.completed = false
    }
  }

  async onFinished(files = this.ctx.state.getFiles(), errors = [], coverage) {
    if (this.executedFiles)
      files = files.filter((file) =>
        this.executedFiles.has(
          JSON.stringify([file.filepath, file.projectName ?? ''])
        )
      )
    this.projects = files.map((file) => file.projectName ?? '')
    this.errors = errors.map((error) =>
      String(error?.stack ?? error?.message ?? error)
    )
    const captureError = (error) =>
      Object.fromEntries(
        localization.FAILURE_DETAIL_FIELDS.filter(
          (key) => typeof error?.[key] === 'string'
        ).map((key) => [key, error[key]])
      )
    this.executionFailureDetails = errors.map(captureError)
    this.failureDetails = []
    const retainErrors = (suite, file, cases) => {
      if (suite.type === 'test') {
        cases.push((suite.result?.errors ?? []).map(captureError))
        return
      }
      for (const error of suite.result?.errors ?? []) {
        this.errors.push(
          file.filepath +
            ': ' +
            suite.name +
            '\n' +
            String(error?.stack ?? error?.message ?? error)
        )
        this.executionFailureDetails.push({
          ...captureError(error),
          file: file.filepath,
          projectName: file.projectName ?? '',
          suiteName: suite.name
        })
      }
      for (const child of suite.tasks ?? []) retainErrors(child, file, cases)
    }
    // Preserve file and depth-first test order used by JsonReporter. Names may collide.
    for (const file of files) {
      const cases = []
      retainErrors(file, file, cases)
      this.failureDetails.push(cases)
    }
    await super.onFinished(files, errors, coverage)
  }

  async writeReport(bytes) {
    const record = localization.completeObservation(
      this.root,
      this.context,
      JSON.parse(bytes),
      {
        projects: this.projects,
        errors: this.errors,
        failureDetails: this.failureDetails,
        executionFailureDetails: this.executionFailureDetails
      }
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
