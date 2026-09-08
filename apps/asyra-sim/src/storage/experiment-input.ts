import { trajectoryIntervalError } from '../domain/trajectory-interval'
import type { ExperimentDefinition } from '../analysis/contracts'
import { parseExclusions } from '../domain/scope-input'
import {
  validTrajectoryInput,
  type TrajectoryInput
} from '../domain/trajectory-input'
import type { Workcell } from '../domain/workcell'
import {
  prepareTrajectoryCsv,
  previewTrajectoryCsv,
  previewTrajectoryJson,
  type TrajectoryImportPreview
} from './trajectory-import'

/** One runtime owns the current document/edit pair; no historical input cache. */
export class ExperimentInputReader {
  private closed = false
  private sources: {
    text: string
    csv: ReturnType<typeof prepareTrajectoryCsv>
  }[] = []
  private results: {
    text: string
    kind: string
    signature: string
    result: TrajectoryImportPreview
  }[] = []
  private exclusions: {
    text: string
    value?: ReturnType<typeof parseExclusions>
    error?: Error
  } | null = null

  previewTrajectory(
    input: TrajectoryInput,
    workcell: Workcell
  ): TrajectoryImportPreview {
    if (this.closed) throw new Error('Experiment input reader is closed')
    const signature = JSON.stringify([
      input.mapping,
      workcell.bodies
        .filter((body) => body.joint.kind !== 'fixed')
        .map((body) => [
          body.id,
          body.joint.kind,
          body.joint.min,
          body.joint.max
        ])
    ])
    const found = this.results.find(
      (entry) =>
        entry.text === input.text &&
        entry.kind === input.kind &&
        entry.signature === signature
    )
    if (found) return found.result
    let result: TrajectoryImportPreview
    if (!validTrajectoryInput(input))
      result = {
        value: null,
        conversions: [],
        columns: [],
        previewRows: [],
        diagnostics: [
          {
            code: 'invalid-input',
            severity: 'error',
            message: 'Invalid or oversized authored trajectory input.'
          }
        ]
      }
    else if (input.kind === 'csv')
      result = previewTrajectoryCsv(
        this.readCsv(input.text),
        workcell,
        input.mapping
      )
    else result = previewTrajectoryJson(input.text, workcell)
    this.results = [
      { text: input.text, kind: input.kind, signature, result },
      ...this.results
    ].slice(0, 2)
    return result
  }

  readCsv(text: string) {
    if (this.closed) throw new Error('Experiment input reader is closed')
    let source = this.sources.find((entry) => entry.text === text)
    if (!source) {
      source = { text, csv: prepareTrajectoryCsv(text) }
      this.sources = [source, ...this.sources].slice(0, 2)
    }
    return source.csv
  }

  readExclusions(text: string) {
    if (this.closed) throw new Error('Experiment input reader is closed')
    if (this.exclusions?.text !== text) {
      try {
        this.exclusions = { text, value: parseExclusions(text) }
      } catch (reason) {
        this.exclusions = {
          text,
          error: reason instanceof Error ? reason : new Error(String(reason))
        }
      }
    }
    if (this.exclusions.error) throw this.exclusions.error
    if (!this.exclusions.value) throw new Error('Missing exclusion result')
    return this.exclusions.value
  }

  resolve(
    definition: ExperimentDefinition,
    workcell: Workcell
  ): ExperimentDefinition {
    if (this.closed) throw new Error('Experiment input reader is closed')
    const { trajectoryInput, exclusionsInput, ...resolved } = definition
    if (trajectoryInput) {
      const result = this.previewTrajectory(trajectoryInput, workcell)
      if (!result.value)
        throw new Error(
          result.diagnostics.map((item) => item.message).join('\n')
        )
      resolved.trajectory = result.value.trajectory
      resolved.sourceUnits = result.value.sourceUnits
    }
    if (exclusionsInput !== undefined)
      resolved.scope = {
        ...resolved.scope,
        excludedPairs: this.readExclusions(exclusionsInput)
      }
    const intervalError = trajectoryIntervalError(
      resolved.interval,
      resolved.trajectory
    )
    if (intervalError) throw new Error(intervalError)
    return resolved
  }

  dispose() {
    this.closed = true
    this.sources = []
    this.results = []
    this.exclusions = null
  }
}
