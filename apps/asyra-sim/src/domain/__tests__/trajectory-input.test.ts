import { expect, it } from 'vitest'
import { validTrajectoryInput } from '../trajectory-input'

const input = {
  version: 1,
  kind: 'csv',
  text: 'unfinished syntax',
  mapping: {
    time: { column: '', unit: '' },
    joints: { joint: { column: '', unit: '' } }
  }
}

it('admits incomplete authored data without declaring executable validity', () => {
  expect(validTrajectoryInput(input)).toBe(true)
  expect(validTrajectoryInput({ ...input, text: '' })).toBe(true)
  expect(validTrajectoryInput({ ...input, kind: 'json' })).toBe(true)
})

it('rejects unsupported shapes, declarations and excessive authored payloads', () => {
  for (const invalid of [
    null,
    { ...input, version: 2 },
    { ...input, extra: true },
    { ...input, text: 3 },
    { ...input, kind: 'yaml' },
    {
      ...input,
      mapping: { ...input.mapping, time: { column: 'time', unit: 'minutes' } }
    },
    {
      ...input,
      mapping: {
        ...input.mapping,
        joints: { joint: { column: 'joint', unit: 'radians' } }
      }
    },
    { ...input, kind: 'json', text: 'x'.repeat(1024 * 1024 + 1) },
    { ...input, text: 'x'.repeat(8 * 1024 * 1024 + 1) }
  ])
    expect(validTrajectoryInput(invalid)).toBe(false)
})
