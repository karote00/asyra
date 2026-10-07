import type { RenderEngineMeshMaterial } from '@asyra/render-engine'

const gradientModes = { linear: 1, radial: 2, angular: 3, diamond: 4 } as const
const finite = (values: readonly number[]) => {
  if (
    !values.every(
      (value) => Number.isFinite(value) && Number.isFinite(Math.fround(value))
    )
  )
    throw new Error('Mesh material requires finite parameters')
}

const color = (channels: readonly number[]) => {
  finite(channels)
  if (
    channels.length !== 4 ||
    channels.some((channel) => channel < 0 || channel > 1)
  )
    throw new Error('Mesh material color must contain four normalized channels')
}

/** Parameter records only: one header, three records per layer, two per stop. */
export const encodeMeshMaterial = (material: RenderEngineMeshMaterial) => {
  const values: number[] = [material.fills.length, 0, 0, 0]
  for (const fill of material.fills) {
    const header = values.length
    if (fill.kind === 'solid') {
      color(fill.color)
      values.push(0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, ...fill.color)
    } else {
      finite([fill.start.x, fill.start.y, fill.end.x, fill.end.y])
      if (fill.side) finite([fill.side.x, fill.side.y])
      const stops = [...fill.stops].sort((a, b) => a.position - b.position)
      values.push(
        gradientModes[fill.type],
        stops.length,
        0,
        0,
        fill.start.x,
        fill.start.y,
        fill.end.x,
        fill.end.y,
        fill.side?.x ?? 0,
        fill.side?.y ?? 0,
        fill.side ? 1 : 0,
        0
      )
      for (const stop of stops) {
        finite([stop.position])
        color(stop.color)
        values.push(stop.position, 0, 0, 0, ...stop.color)
      }
    }
    values[header + 2] = values.length / 4
  }
  const texels = values.length / 4
  const width = Math.min(1024, Math.max(2, 2 ** Math.ceil(Math.log2(texels))))
  const height = Math.ceil(texels / width)
  const data = new Float32Array(width * height * 4)
  data.set(values)
  return { data, width, height, texels }
}

/** RGBA8 stores IEEE-754 bytes, not sampled colors; no float-texture extension. */
export const encodeMeshMaterialBytes = (material: RenderEngineMeshMaterial) => {
  const encoded = encodeMeshMaterial(material)
  const bytes = new Uint8Array(encoded.data.length * 4)
  const view = new DataView(bytes.buffer)
  encoded.data.forEach((value, index) =>
    view.setFloat32(index * 4, value, true)
  )
  return { data: bytes, width: encoded.width * 4, height: encoded.height }
}
