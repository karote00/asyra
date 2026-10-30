import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { createHash } from 'node:crypto'

interface Point {
  x: number
  y: number
  z: number
}
interface Face {
  type: string
  key: string
  name: string
  fill: { template: string }
  vertices: Point[]
}
interface Draft {
  type: string
  name: string
  projection: {
    azimuth: number
    elevation: number
    scale: number
    originX: number
    originY: number
  }
  fillTemplates: Record<string, unknown>
  children: Face[]
}

/** Immutable recorded input. Factoring here is test data, never production inference. */
export const recordedOrnaments = () => {
  const bytes = gunzipSync(
    readFileSync(
      new URL(
        './fixtures/recorded-101/ornament-input-20261019.json.gz',
        import.meta.url
      )
    )
  )
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  if (
    sha256 !==
    '011187034701cd42cee3eb849ddbccae3741704997910bf5934b11ca0d9aa9ed'
  ) {
    throw new Error('Recorded ornament input changed')
  }
  const outputBytes = readFileSync(
    new URL(
      './fixtures/recorded-101/ornament-output-20261019.json',
      import.meta.url
    )
  )
  if (
    createHash('sha256').update(outputBytes).digest('hex') !==
    '893b7e1261c85af28aa35490e8e2eac8681a43a9641da0fc39cfe006d4c319f7'
  ) {
    throw new Error('Recorded ornament output changed')
  }
  const output = JSON.parse(outputBytes.toString()) as {
    elementCount: number
    sourceWork: { projectionCalls: number; pathCommands: number }
  }
  const input = JSON.parse(bytes.toString()) as {
    draft: Draft
    parentId: string
    message: string
    inspection: unknown
    response: unknown
  }
  const faces = input.draft.children
    .slice(0, 44)
    .map(({ type: _type, ...face }) => ({
      ...structuredClone(face),
      key: face.key.replace(/^ruyi0/, '')
    }))
  const compact = {
    ...structuredClone(input.draft),
    children: [
      {
        type: 'pattern',
        key: 'ornaments',
        name: 'Repeated detail',
        origin: { x: 0, y: 0, z: 0 },
        axes: [{ count: 8, step: { x: 0, y: 0, z: 3500 } }],
        faces
      }
    ]
  }
  const correspondence = input.draft.children.map((face, index) => ({
    original: face.key,
    compact: `ornaments-${Math.floor(index / 44)}-${faces[index % 44].key}`
  }))
  return {
    input,
    output,
    compact,
    correspondence,
    inputBytes: bytes.length,
    sha256
  }
}
