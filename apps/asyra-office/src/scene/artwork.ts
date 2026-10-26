export interface ArtworkRegion {
  source: string
  /** Printed image corners only, ordered top-left, top-right, bottom-right, bottom-left. */
  corners: readonly (readonly number[])[]
}
export interface ArtworkPixels {
  width: number
  height: number
  data: Uint8ClampedArray
}

/** Decode each authored source once during scene preparation, never in a camera update. */
export async function prepareArtwork(
  labels: readonly { artwork?: ArtworkRegion }[]
) {
  const result = new Map<string, ArtworkPixels>()
  const sources = new Set(
    labels.flatMap((l) => (l.artwork ? [l.artwork.source] : []))
  )
  for (const source of sources) {
    const image = new Image()
    image.src = source
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext('2d')
    if (!context || !canvas.width || !canvas.height)
      throw new Error('Artwork source cannot be decoded')
    context.drawImage(image, 0, 0)
    result.set(source, {
      width: canvas.width,
      height: canvas.height,
      data: context.getImageData(0, 0, canvas.width, canvas.height).data
    })
  }
  return result
}

/** Rectify only a printed picture interior; the paper and its mounting remain geometry. */
export function sampleArtwork(
  source: ArtworkPixels,
  corners: ArtworkRegion['corners'],
  size = 64
) {
  if (
    corners.length !== 4 ||
    corners.some(
      (p) =>
        p.length !== 2 ||
        p.some((v) => !Number.isFinite(v)) ||
        p[0] < 0 ||
        p[0] > source.width - 1 ||
        p[1] < 0 ||
        p[1] > source.height - 1
    )
  )
    throw new Error('Artwork corners must stay within the source image')
  if (!Number.isInteger(size) || size < 2 || size > 512)
    throw new Error('Invalid artwork resolution')
  const albedo: number[] = [],
    normals: number[] = []
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = x / (size - 1),
        v = y / (size - 1)
      const p = [0, 1].map(
        (axis) =>
          (1 - v) * ((1 - u) * corners[0][axis] + u * corners[1][axis]) +
          v * ((1 - u) * corners[3][axis] + u * corners[2][axis])
      )
      const x0 = Math.floor(p[0]),
        y0 = Math.floor(p[1]),
        x1 = Math.min(x0 + 1, source.width - 1),
        y1 = Math.min(y0 + 1, source.height - 1),
        fx = p[0] - x0,
        fy = p[1] - y0
      for (let channel = 0; channel < 4; channel++) {
        const at = (xx: number, yy: number) =>
          source.data[(yy * source.width + xx) * 4 + channel]
        albedo.push(
          Math.round(
            (1 - fy) * ((1 - fx) * at(x0, y0) + fx * at(x1, y0)) +
              fy * ((1 - fx) * at(x0, y1) + fx * at(x1, y1))
          )
        )
      }
      normals.push(128, 128, 255, 255)
    }
  return { width: size, height: size, albedo, normals }
}
