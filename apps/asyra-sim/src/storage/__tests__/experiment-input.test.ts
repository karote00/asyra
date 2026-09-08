import { expect, it, vi } from 'vitest'
import { createSyntheticExample } from '../../../samples/synthetic-workcell'
import {
  canonicalCsvMapping,
  createDefaultExperimentDraft,
  trajectoryToCsv
} from '../../ui/experiments/experiment-draft'
import * as importer from '../trajectory-import'
import { ExperimentInputReader } from '../experiment-input'
import type { TrajectoryInput } from '../../domain/trajectory-input'

it('shares parsing and conversion across typing, review, acknowledgements and execution, with bounded dependency invalidation', () => {
  const example = createSyntheticExample()
  const input: TrajectoryInput = {
    version: 1,
    kind: 'csv',
    text: trajectoryToCsv(example.workcell, example.trajectory),
    mapping: canonicalCsvMapping(example.workcell)
  }
  const reader = new ExperimentInputReader()
  const parse = vi.spyOn(importer, 'prepareTrajectoryCsv')
  const convert = vi.spyOn(importer, 'previewTrajectoryCsv')
  try {
    const result = reader.previewTrajectory(input, example.workcell)
    expect(result.value).not.toBeNull()
    const definition = {
      ...createDefaultExperimentDraft(example.workcell),
      revision: 1,
      rule: { version: 1 as const, revision: 1, minimumClearance: 0.02 },
      trajectoryInput: structuredClone(input)
    }
    const resolved = reader.resolve(definition, example.workcell)
    expect(resolved.trajectory).toBe(result.value?.trajectory)
    expect(
      reader.previewTrajectory(
        structuredClone(input),
        structuredClone(example.workcell)
      )
    ).toBe(result)
    expect(parse).toHaveBeenCalledOnce()
    expect(convert).toHaveBeenCalledOnce()
    const next = structuredClone(input)
    next.mapping.time.unit = 'ms'
    reader.previewTrajectory(next, example.workcell)
    expect(parse).toHaveBeenCalledOnce()
    expect(convert).toHaveBeenCalledTimes(2)
    const changed = structuredClone(example.workcell)
    const joint = changed.bodies.find((body) => body.joint.kind !== 'fixed')
    if (!joint) throw new Error('Missing actuated joint')
    joint.joint.max = 0.1
    expect(reader.previewTrajectory(next, changed).value).toBeNull()
    expect(convert).toHaveBeenCalledTimes(3)
    expect(parse).toHaveBeenCalledOnce()
    expect(() =>
      reader.resolve({ ...definition, trajectoryInput: next }, changed)
    ).toThrow()
    expect(convert).toHaveBeenCalledTimes(3)
    reader.dispose()
    expect(() => reader.previewTrajectory(input, example.workcell)).toThrow(
      'closed'
    )
  } finally {
    parse.mockRestore()
    convert.mockRestore()
  }
})

it('keeps authored exclusion errors separate from other persisted settings and refuses executable fallback', () => {
  const example = createSyntheticExample()
  const definition = {
    ...createDefaultExperimentDraft(example.workcell),
    revision: 1,
    rule: { version: 1 as const, revision: 1, minimumClearance: 0.02 },
    exclusionsInput: 'unfinished'
  }
  const reader = new ExperimentInputReader()
  expect(() => reader.resolve(definition, example.workcell)).toThrow(
    'Invalid exclusion'
  )
  const resolved = reader.resolve(
    { ...definition, exclusionsInput: '' },
    example.workcell
  )
  expect(resolved).not.toHaveProperty('exclusionsInput')
  expect(resolved.scope.excludedPairs).toEqual([])
})
