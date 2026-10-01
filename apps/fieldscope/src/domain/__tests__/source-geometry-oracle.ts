import { createHash } from 'node:crypto'

interface TriangleSource {
  readonly kind: 'triangles'
  readonly positions: readonly number[]
  readonly indices: readonly number[]
  readonly colors?: readonly number[]
  readonly uvs?: readonly number[]
}

export const digest = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex')

export function exactSourceStructure(shape: TriangleSource) {
  return {
    kind: shape.kind,
    positionValues: shape.positions.length,
    indices: shape.indices,
    colorValues: shape.colors?.length ?? 0,
    uvValues: shape.uvs?.length ?? 0
  }
}

export function renderHandoff(shape: TriangleSource) {
  // Mirrors ThreeEngine's indexed assignment into its final Float32Array and
  // records raw bits so signed zero cannot disappear through JSON numbers.
  const view = new DataView(new ArrayBuffer(4))
  const float32 = (values: readonly number[]) =>
    values.map((value) => {
      view.setFloat32(0, value)
      return view.getUint32(0).toString(16).padStart(8, '0')
    })
  return {
    kind: shape.kind,
    positions: float32(shape.positions),
    indices: shape.indices,
    ...(shape.colors ? { colors: float32(shape.colors) } : {}),
    ...(shape.uvs ? { uvs: float32(shape.uvs) } : {})
  }
}
