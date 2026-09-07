import { describe, expect, it, vi } from 'vitest'
import * as sourceDomain from '../../domain/trajectory-source'
import * as units from '../../domain/math'
import { IDENTITY_POSE } from '../../domain/math'
import type { Body, Workcell } from '../../domain/workcell'
import {
  prepareTrajectoryCsv,
  previewTrajectoryCsv,
  previewTrajectoryJson,
  type TrajectoryCsvMapping
} from '../trajectory-import'

const body = (id: string, parentId: string | null): Body => ({
  id,
  parentId,
  name: id,
  role: 'link',
  pose: IDENTITY_POSE,
  joint: { kind: 'fixed', axis: [0, 0, 1], value: 0, min: 0, max: 0 },
  colliders: [],
  visible: true,
  color: 0
})
const workcell: Workcell = {
  version: 1,
  robotRootId: 'base',
  bodies: [
    body('base', null),
    {
      ...body('turn', 'base'),
      joint: {
        kind: 'revolute',
        axis: [0, 0, 1],
        value: 0,
        min: -10,
        max: 10
      }
    },
    {
      ...body('slide', 'turn'),
      joint: {
        kind: 'prismatic',
        axis: [1, 0, 0],
        value: 0,
        min: -2,
        max: 2
      }
    }
  ]
}
const mapping: TrajectoryCsvMapping = {
  time: { column: 'clock', unit: 'ms' },
  joints: {
    turn: { column: 'axis a', unit: 'deg' },
    slide: { column: 'linear', unit: 'mm' }
  }
}

describe('M2 trajectory import preview', () => {
  it('maps arbitrary CSV columns with explicit units into canonical values', () => {
    const preview = previewTrajectoryCsv(
      'note,clock,"axis a",linear\nstart,0,0,0\nend,2500,450,1250\n',
      workcell,
      mapping
    )
    expect(preview.diagnostics).toEqual([])
    expect(preview.columns).toEqual(['note', 'clock', 'axis a', 'linear'])
    expect(preview.value?.trajectory.keyframes).toEqual([
      { time: 0, joints: { turn: 0, slide: 0 } },
      { time: 2.5, joints: { turn: Math.PI * 2.5, slide: 1.25 } }
    ])
    expect(preview.previewRows).toHaveLength(2)
  })

  it('reports every malformed data row instead of silently discarding it', () => {
    const preview = previewTrajectoryCsv(
      'clock,axis a,linear\n0,nope,0\n1000,0\n2000,0,3000\n',
      workcell,
      mapping
    )
    expect(preview.value).toBeNull()
    expect(preview.diagnostics.map((item) => item.row)).toEqual([2, 3, 4])
    expect(preview.diagnostics.every((item) => item.severity === 'error')).toBe(
      true
    )
  })

  it('attributes duplicate and reversed normalized timestamps to the later row', () => {
    for (const csv of [
      'clock,axis a,linear\n0,0,0\n0,1,1',
      'clock,axis a,linear\n1000,0,0\n500,1,1'
    ]) {
      const preview = previewTrajectoryCsv(csv, workcell, mapping)
      expect(preview.value).toBeNull()
      expect(preview.diagnostics).toContainEqual(
        expect.objectContaining({ row: 3, code: 'time-order' })
      )
    }
  })

  it('rejects missing mappings, reused columns, and missing explicit units', () => {
    const csv = 'clock,axis a,linear\n0,0,0'
    for (const invalid of [
      { ...mapping, joints: { turn: mapping.joints.turn } },
      {
        ...mapping,
        joints: {
          ...mapping.joints,
          slide: { column: 'axis a', unit: 'mm' as const }
        }
      },
      {
        ...mapping,
        time: { column: 'clock', unit: undefined }
      }
    ]) {
      const preview = previewTrajectoryCsv(
        csv,
        workcell,
        invalid as TrajectoryCsvMapping
      )
      expect(preview.value).toBeNull()
      expect(preview.diagnostics[0]?.code).toBe('invalid-mapping')
    }
  })

  it('rejects oversized input and duplicate headers before row allocation', () => {
    expect(
      previewTrajectoryCsv(
        `clock,axis a,linear\n${'0'.repeat(8 * 1024 * 1024)}`,
        workcell,
        mapping
      ).diagnostics[0]?.code
    ).toBe('file-too-large')
    expect(
      previewTrajectoryCsv('clock,axis a,axis a\n0,0,0', workcell, mapping)
        .diagnostics[0]?.code
    ).toBe('duplicate-header')
  })

  it('admits CSV input above 1 MiB within the declared 8 MiB cap', () => {
    const preview = previewTrajectoryCsv(
      `note,clock,axis a,linear\n${'x'.repeat(1024 * 1024)},0,0,0`,
      workcell,
      mapping
    )
    expect(preview.diagnostics).toEqual([])
    expect(preview.value?.trajectory.keyframes).toHaveLength(1)
  })

  it('stops at the row cap before parsing an unbounded or malformed tail', () => {
    const preview = previewTrajectoryCsv(
      `clock,axis a,linear\n${'0,0,0\n'.repeat(2000)}"unterminated`,
      workcell,
      mapping
    )
    expect(preview.value).toBeNull()
    expect(preview.diagnostics[0]?.code).toBe('too-many-rows')
  })

  it('stops at the column cap before parsing a malformed tail', () => {
    const preview = previewTrajectoryCsv(
      `${'column,'.repeat(256)}"unterminated`,
      workcell,
      mapping
    )
    expect(preview.value).toBeNull()
    expect(preview.diagnostics[0]?.code).toBe('too-many-columns')
  })

  it('accepts exactly 2000 rows and 256 columns', () => {
    const headers = [
      'clock',
      'axis a',
      'linear',
      ...Array.from({ length: 253 }, (_, i) => `extra${i}`)
    ]
    const rows = Array.from({ length: 2000 }, (_, i) =>
      [String(i), '0', '0', ...Array<string>(253).fill('')].join(',')
    )
    const preview = previewTrajectoryCsv(
      [headers.join(','), ...rows].join('\n'),
      workcell,
      mapping
    )
    expect(preview.diagnostics).toEqual([])
    expect(preview.value?.trajectory.keyframes).toHaveLength(2000)
    expect(preview.columns).toHaveLength(256)
  })

  it('accepts only the strict versioned JSON trajectory envelope', () => {
    const valid = JSON.stringify({
      format: 'sim-trajectory',
      version: 1,
      source: {
        version: 1,
        timeUnit: 's',
        jointUnits: { turn: 'rad', slide: 'm' },
        keyframes: [{ time: 0, joints: { turn: 0, slide: 0 } }]
      }
    })
    expect(previewTrajectoryJson(valid, workcell).value).not.toBeNull()
    for (const invalid of [
      '{',
      valid.replace('"version":1', '"version":2'),
      valid.replace('"source":', '"unexpected":true,"source":')
    ]) {
      const preview = previewTrajectoryJson(invalid, workcell)
      expect(preview.value).toBeNull()
      expect(preview.diagnostics).toHaveLength(1)
    }
  })
})

describe('M2 conversion review contract', () => {
  it('presents bounded source and canonical values from each once-normalized row', () => {
    const normalize = vi.spyOn(sourceDomain, 'normalizeTrajectorySource')
    const angles = vi.spyOn(units, 'angleInRadians')
    const lengths = vi.spyOn(units, 'lengthInMeters')
    const csv = 'clock,axis a,linear\n0,0,0\n2500,450,1250'
    try {
      const preview = previewTrajectoryCsv(csv, workcell, mapping)
      expect(preview.value).not.toBeNull()
      expect(normalize).toHaveBeenCalledTimes(2)
      expect(angles).toHaveBeenCalledTimes(2)
      expect(lengths).toHaveBeenCalledTimes(2)
      expect(preview.conversions).toContainEqual({
        frameIndex: 1,
        sourceField: 'axis a',
        sourceUnit: 'deg',
        sourceValue: 450,
        canonicalValue: Math.PI * 2.5,
        canonicalUnit: 'rad'
      })
      expect(preview.conversions).toContainEqual({
        frameIndex: 1,
        sourceField: 'linear',
        sourceUnit: 'mm',
        sourceValue: 1250,
        canonicalValue: 1.25,
        canonicalUnit: 'm'
      })
      expect(preview.conversions).toContainEqual({
        frameIndex: 1,
        sourceField: 'clock',
        sourceUnit: 'ms',
        sourceValue: 2500,
        canonicalValue: 2.5,
        canonicalUnit: 's'
      })
    } finally {
      normalize.mockRestore()
      angles.mockRestore()
      lengths.mockRestore()
    }
  })

  it('preserves declared JSON units and matches equivalent canonical CSV', () => {
    const json = previewTrajectoryJson(
      JSON.stringify({
        format: 'sim-trajectory',
        version: 1,
        source: {
          version: 1,
          timeUnit: 'ms',
          jointUnits: { turn: 'deg', slide: 'mm' },
          keyframes: [{ time: 2500, joints: { turn: 180, slide: 1250 } }]
        }
      }),
      workcell
    )
    const csv = previewTrajectoryCsv(
      `time,turn,slide\n2.5,${Math.PI},1.25`,
      workcell,
      {
        time: { column: 'time', unit: 's' },
        joints: {
          turn: { column: 'turn', unit: 'rad' },
          slide: { column: 'slide', unit: 'm' }
        }
      }
    )
    expect(json.value?.trajectory).toEqual(csv.value?.trajectory)
    expect(json.value?.sourceUnits).toEqual({
      time: 'ms',
      joints: { turn: 'deg', slide: 'mm' }
    })
    expect(json.conversions).toContainEqual({
      frameIndex: 0,
      sourceField: 'joints.turn',
      sourceUnit: 'deg',
      sourceValue: 180,
      canonicalValue: Math.PI,
      canonicalUnit: 'rad'
    })
  })

  it('bounds review to first, middle and last frames of large inputs', () => {
    const csv =
      'clock,axis a,linear\n' +
      Array.from({ length: 2000 }, (_, i) => `${i},0,0`).join('\n')
    const preview = previewTrajectoryCsv(csv, workcell, mapping)
    expect(preview.value?.trajectory.keyframes).toHaveLength(2000)
    expect(preview.conversions).toHaveLength(9)
    expect([
      ...new Set(preview.conversions.map((item) => item.frameIndex))
    ]).toEqual([0, 1000, 1999])
  })
})

it('reuses the prepared source across mapping changes without altering its bytes or rows', () => {
  const csv = 'clock,axis a,linear\n0,1,1\n1000,2,2'
  const prepared = prepareTrajectoryCsv(csv)
  const before = structuredClone(prepared)
  const first = previewTrajectoryCsv(prepared, workcell, mapping)
  const nextMapping = {
    ...mapping,
    joints: {
      ...mapping.joints,
      turn: { column: 'axis a', unit: 'rad' as const }
    }
  }
  const next = previewTrajectoryCsv(prepared, workcell, nextMapping)
  expect(next).toEqual(previewTrajectoryCsv(csv, workcell, nextMapping))
  expect(next.value?.trajectory).not.toEqual(first.value?.trajectory)
  expect(prepared).toEqual(before)
  expect(
    previewTrajectoryCsv(prepared, workcell, {
      ...mapping,
      time: { column: 'clock', unit: '' }
    }).value
  ).toBeNull()
})
