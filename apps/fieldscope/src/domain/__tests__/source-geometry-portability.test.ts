import { readFileSync, writeFileSync } from 'node:fs'
import { gunzipSync, gzipSync } from 'node:zlib'
import { expect, it } from 'vitest'
import { createCropModels } from '../crop-models'
import { DEFAULT_ROBOT } from '../robot-configuration'
import { createRobotModel, type RobotPart } from '../robot-model'
import {
  digest,
  exactSourceStructure,
  renderHandoff
} from './source-geometry-oracle'

interface SourceSeries {
  readonly path: string
  readonly values: readonly string[]
}

const reference = new URL(
  './fixtures/source-float64.darwin-node-24.13.json.gz',
  import.meta.url
)
const historicalCropDigests = new URL(
  './fixtures/source-float64-digests.crop.darwin-node-24.13.txt',
  import.meta.url
)
const historicalRobotDigests = new URL(
  './fixtures/source-float64-digests.robot.darwin-node-24.13.txt',
  import.meta.url
)
const sign = 1n << 63n
const mask = (1n << 64n) - 1n
const float64Bits = (value: number) => {
  const view = new DataView(new ArrayBuffer(8))
  view.setFloat64(0, value)
  return view.getBigUint64(0).toString(16).padStart(16, '0')
}
const ordered = (value: string) => {
  const bits = BigInt(`0x${value}`)
  return bits & sign ? ~bits & mask : bits | sign
}
const ulps = (left: string, right: string) => {
  const delta = ordered(left) - ordered(right)
  return delta < 0 ? -delta : delta
}
const fromBits = (value: string) => {
  const view = new DataView(new ArrayBuffer(8))
  view.setBigUint64(0, BigInt(`0x${value}`))
  return view.getFloat64(0)
}
const series = (path: string, values: readonly number[]): SourceSeries => ({
  path,
  values: values.map(float64Bits)
})

function shapeSeries(path: string, shape: RobotPart['shape']) {
  return [
    series(`${path}.positions`, shape.positions),
    ...(shape.colors ? [series(`${path}.colors`, shape.colors)] : []),
    ...(shape.uvs ? [series(`${path}.uvs`, shape.uvs)] : [])
  ]
}

function captureRepresentativeSourceValues() {
  const robot = createRobotModel(DEFAULT_ROBOT)
  const crop = createCropModels({ netTop: 3, netBottom: 0.45 })[0]
  if (!crop) throw new Error('Missing representative crop model')
  return [
    ...robot.flatMap((part) => shapeSeries(`robot.${part.id}`, part.shape)),
    ...crop.parts.flatMap((part) => [
      ...shapeSeries(`crop.${part.id}.near`, part.shape),
      ...(part.distantShape
        ? shapeSeries(`crop.${part.id}.distant`, part.distantShape)
        : [])
    ])
  ]
}

it('keeps historical whole-buffer digests as evidence without using them as portable acceptance', () => {
  expect(readFileSync(historicalCropDigests, 'utf8')).toContain(
    'd748ad0da95f25d5fa40bf841fea5740234873904bd784aae3e3a8b6e11da6ab'
  )
  expect(readFileSync(historicalRobotDigests, 'utf8')).toContain(
    '13d0e7150f0d6081f22c0cd40db3756955bc781822614503ac6519703bcab649'
  )
})

it('detects exact topology and render-visible source mutations independently', () => {
  const source = {
    kind: 'triangles' as const,
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    indices: [0, 1, 2]
  }
  const structure = digest(exactSourceStructure(source))
  const presentation = digest(renderHandoff(source))
  expect(
    digest(exactSourceStructure({ ...source, indices: [0, 2, 1] }))
  ).not.toBe(structure)
  expect(
    digest(renderHandoff({ ...source, positions: [0, 0, 0, 2, 0, 0, 0, 1, 0] }))
  ).not.toBe(presentation)
  expect(
    digest(
      exactSourceStructure({
        ...source,
        positions: [0, 0, 0, 2, 0, 0, 0, 1, 0]
      })
    )
  ).toBe(structure)
})

it('reports rerunnable per-value source portability diagnostics without setting acceptance', () => {
  const actual = captureRepresentativeSourceValues()
  if (process.env.FIELDSCOPE_WRITE_SOURCE_TRACE === '1') {
    writeFileSync(reference, gzipSync(`${JSON.stringify(actual)}\n`))
    expect(actual.length).toBeGreaterThan(0)
    return
  }
  const expected = JSON.parse(
    gunzipSync(readFileSync(reference)).toString('utf8')
  ) as SourceSeries[]
  expect(actual).toHaveLength(expected.length)
  const differences = []
  let compared = 0
  let changed = 0
  let maxUlps = 0n
  let maxAbsoluteDifference = 0
  for (let seriesIndex = 0; seriesIndex < expected.length; seriesIndex++) {
    const before = expected[seriesIndex]
    const after = actual[seriesIndex]
    expect(after.path).toBe(before.path)
    expect(after.values).toHaveLength(before.values.length)
    for (let valueIndex = 0; valueIndex < before.values.length; valueIndex++) {
      compared++
      const distance = ulps(after.values[valueIndex], before.values[valueIndex])
      if (!distance) continue
      changed++
      const absoluteDifference = Math.abs(
        fromBits(after.values[valueIndex]) - fromBits(before.values[valueIndex])
      )
      if (distance > maxUlps) maxUlps = distance
      if (absoluteDifference > maxAbsoluteDifference)
        maxAbsoluteDifference = absoluteDifference
      if (differences.length < 32)
        differences.push({
          path: after.path,
          index: valueIndex,
          expected: before.values[valueIndex],
          actual: after.values[valueIndex],
          absoluteDifference,
          ulps: distance.toString()
        })
    }
  }
  const report = {
    runtime: `${process.platform} ${process.version}`,
    series: actual.length,
    compared,
    changed,
    maxAbsoluteDifference,
    maxUlps: maxUlps.toString(),
    firstDifferences: differences
  }
  if (changed || process.env.FIELDSCOPE_REPORT_SOURCE_TRACE === '1')
    console.info('source Float64 portability', JSON.stringify(report))
  expect(report).toMatchObject({ series: 135, compared: 179390 })
})
