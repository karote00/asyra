import { expect, it } from 'vitest'
import { tree } from '../vegetation'
import type { AssetPart } from '../catalog'

// Reference-derived interior windows: foliage must cover the crown in all three
// axes, rather than merely put a handful of leaves at each branch endpoint.
const views = [
  { name: 'front', axes: [0, 2], centre: [0, 2.05], radius: [0.8, 0.75] },
  { name: 'side', axes: [1, 2], centre: [0, 2.05], radius: [0.48, 0.75] },
  { name: 'top', axes: [0, 1], centre: [0, 0], radius: [0.8, 0.48] }
]
function coverage(parts: AssetPart[], view: (typeof views)[number]) {
  const resolution = 96,
    mask = new Uint8Array(resolution * resolution)
  for (const part of parts) {
    for (const leaf of part.instances ?? []) {
      const polygon = Array.from({ length: 32 }, (_, i) =>
        view.axes.map((axis, k) => {
          const vertex = 33 + i
          const world =
            leaf.position[axis] +
            leaf.scale *
              leaf.basis.reduce(
                (sum, basis, j) =>
                  sum + basis[axis] * part.mesh.positions[vertex * 3 + j],
                0
              )
          return (
            (((world - view.centre[k]) / view.radius[k] + 1) * resolution) / 2
          )
        })
      )
      const low = Math.max(
          0,
          Math.floor(Math.min(...polygon.map((p) => p[1])))
        ),
        high = Math.min(
          resolution - 1,
          Math.ceil(Math.max(...polygon.map((p) => p[1])))
        )
      for (let y = low; y <= high; y++) {
        const hits: number[] = []
        polygon.forEach((a, i) => {
          const b = polygon[(i + 1) % polygon.length],
            scan = y + 0.5
          if ((a[1] <= scan && b[1] > scan) || (b[1] <= scan && a[1] > scan)) {
            hits.push(a[0] + ((b[0] - a[0]) * (scan - a[1])) / (b[1] - a[1]))
          }
        })
        hits.sort((a, b) => a - b)
        for (let i = 0; i + 1 < hits.length; i += 2) {
          for (
            let x = Math.max(0, Math.ceil(hits[i] - 0.5));
            x < Math.min(resolution, hits[i + 1] - 0.5);
            x++
          ) {
            mask[y * resolution + x] = 1
          }
        }
      }
    }
  }
  let covered = 0,
    total = 0
  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      if (
        (((x + 0.5) / resolution) * 2 - 1) ** 2 +
          (((y + 0.5) / resolution) * 2 - 1) ** 2 <
        1
      ) {
        total++
        covered += mask[y * resolution + x]
      }
    }
  }
  return covered / total
}
for (const view of views) {
  it(`covers the ${view.name} crown interior with actual leaf surfaces`, () => {
    const parts = tree().filter((p) => p.instances)
    expect(
      coverage(parts, view),
      `${view.name} projected coverage`
    ).toBeGreaterThan(0.78)
    expect(parts.flatMap((p) => p.instances ?? []).length).toBeLessThanOrEqual(
      3600
    )
  })
  it(`retains overlapping leaf surfaces inside a close ${view.name} cluster`, () => {
    const parts = tree()
      .filter((p) => p.instances)
      .map((p) => ({
        ...p,
        instances: p.instances?.filter((i) => i.id.startsWith('cluster-0-'))
      }))
    const instances = parts.flatMap((p) => p.instances ?? [])
    const range = view.axes.map((axis) => {
      const coordinates = instances.map((i) => i.position[axis])
      return [Math.min(...coordinates), Math.max(...coordinates)]
    })
    const close = {
      ...view,
      centre: range.map(([a, b]) => (a + b) / 2),
      radius: range.map(([a, b]) => (b - a) * 0.4)
    }
    expect(
      coverage(parts, close),
      `${view.name} close cluster coverage`
    ).toBeGreaterThan(0.85)
  })
}
