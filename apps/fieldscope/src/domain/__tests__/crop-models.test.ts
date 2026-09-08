import { expect, it } from 'vitest'
import { createCropModels } from '../crop-models'

it('builds 20 distinct botanical models for each cultivar with finite reusable geometry', () => {
  const models = createCropModels({ netTop: 3, netBottom: 0.45 })
  expect(models).toHaveLength(40)
  for (const species of ['cucumber-1914', 'tomato-yu-nu']) {
    const selected = models.filter((m) => m.species === species)
    expect(new Set(selected.map((m) => JSON.stringify(m.parts))).size).toBe(20)
    expect(new Set(selected.map((m) => m.height)).size).toBe(20)
    for (const model of selected) {
      expect(model.height).toBeGreaterThan(1.8)
      expect(model.height).toBeLessThan(3)
      expect(model.parts.length).toBe(7)
      expect(model.fruits.some((f) => f.maturity === 'ripe')).toBe(true)
      expect(model.fruits.some((f) => f.maturity === 'green')).toBe(true)
      for (const part of model.parts) {
        expect(part.shape.positions.every(Number.isFinite)).toBe(true)
        expect(
          part.shape.indices.every(
            (i) => i >= 0 && i < part.shape.positions.length / 3
          )
        ).toBe(true)
      }
      if (species === 'cucumber-1914') {
        expect(model.tendrilCount).toBe(model.leafCount)
        expect(model.leafletCount).toBe(model.leafCount)
        for (const fruit of model.fruits.filter((f) => f.maturity === 'ripe')) {
          expect(fruit.length).toBeGreaterThanOrEqual(0.2)
          expect(fruit.length).toBeLessThanOrEqual(0.24)
          expect(fruit.length / (fruit.radius * 2)).toBeGreaterThan(6)
        }
      } else {
        expect(model.leafletCount).toBe(model.leafCount * 7)
        expect(model.fruits.length).toBeGreaterThanOrEqual(15)
        for (const fruit of model.fruits)
          expect(fruit.length / (fruit.radius * 2)).toBeGreaterThan(1.5)
      }
    }
  }
  expect(createCropModels({ netTop: 3, netBottom: 0.45 })).toEqual(models)
})
it('regenerates the model envelope for a changed net height', () => {
  const short = createCropModels({ netTop: 0.5, netBottom: 0.1 })
  expect(short.every((m) => m.height < 0.5)).toBe(true)
  expect(
    short.every((m) =>
      m.parts.every((p) => p.shape.positions.every(Number.isFinite))
    )
  ).toBe(true)
})

it('creates actual leaf occlusion and places net-side fruit behind a horizontal strand', async () => {
  const {
    BufferGeometry,
    Float32BufferAttribute,
    Mesh,
    MeshBasicMaterial,
    DoubleSide,
    Raycaster,
    Vector3
  } = await import('three')
  const models = createCropModels({ netTop: 3, netBottom: 0.45 })
  for (const species of ['cucumber-1914', 'tomato-yu-nu']) {
    const covered = models.find((m) => m.species === species && m.variant === 0)
    if (!covered) throw new Error('Missing covered model')
    const fruit = covered.fruits.find((f) => f.occlusion === 'leaf')
    if (!fruit) throw new Error('Missing leaf-covered fruit')
    const shape = covered.parts[1].shape
    const geometry = new BufferGeometry()
    geometry.setAttribute(
      'position',
      new Float32BufferAttribute(shape.positions, 3)
    )
    geometry.setIndex(shape.indices)
    const material = new MeshBasicMaterial({ side: DoubleSide })
    const mesh = new Mesh(geometry, material)
    mesh.updateMatrixWorld()
    const ray = new Raycaster(
      new Vector3(fruit.center[0] + 1, fruit.center[1], fruit.center[2]),
      new Vector3(-1, 0, 0)
    )
    expect(
      ray
        .intersectObject(mesh)
        .some((hit) => hit.point.x > fruit.center[0] + fruit.radius)
    ).toBe(true)
    geometry.dispose()
    material.dispose()
    const netFruit = models
      .filter((m) => m.species === species)
      .flatMap((m) => m.fruits)
      .filter((f) => f.occlusion === 'net')
    expect(netFruit.length).toBeGreaterThan(0)
    for (const value of netFruit) {
      expect(value.center[0] + value.radius).toBeLessThan(-0.06)
      expect((value.center[1] - 0.45) / 0.15).toBeCloseTo(
        Math.round((value.center[1] - 0.45) / 0.15)
      )
    }
  }
})

it('retains a bounded distant representation without per-plant geometry expansion', () => {
  for (const model of createCropModels({ netTop: 3, netBottom: 0.45 })) {
    let full = 0,
      distant = 0
    for (const part of model.parts) {
      if (!part.distantShape) throw new Error('Missing distant shape')
      expect(part.distantShape.positions.every(Number.isFinite)).toBe(true)
      full += part.shape.indices.length / 3
      distant += part.distantShape.indices.length / 3
    }
    expect(distant).toBeLessThan(full * 0.4)
  }
})

it('gives Yu-Nu fruit rounded elliptical ends and spatially uneven ripening on one fruit', () => {
  const model = createCropModels({ netTop: 3, netBottom: 0.45 }).find(
    (m) => m.species === 'tomato-yu-nu' && m.variant === 2
  )
  if (!model) throw new Error('Missing tomato')
  const fruit = model.fruits[0],
    shape = model.parts[5].shape
  const colors = new Set<string>()
  let samples = 0
  for (let i = 0; i < shape.positions.length; i += 3) {
    const x = (shape.positions[i] - fruit.center[0]) / fruit.radius
    const y = (shape.positions[i + 1] - fruit.center[1]) / (fruit.length / 2)
    const z = (shape.positions[i + 2] - fruit.center[2]) / fruit.radius
    if (Math.abs(x) > 1.01 || Math.abs(y) > 1.01 || Math.abs(z) > 1.01) continue
    expect(x * x + y * y + z * z).toBeCloseTo(1, 5)
    colors.add(
      shape.colors
        ?.slice(i, i + 3)
        .map((v) => v.toFixed(4))
        .join(',') ?? 'missing'
    )
    samples++
  }
  expect(samples).toBeGreaterThan(20)
  expect(colors.size).toBeGreaterThan(10)
})

it('grows fine pale spines from every cucumber skin', () => {
  const models = createCropModels({ netTop: 3, netBottom: 0.45 }).filter(
    (m) => m.species === 'cucumber-1914'
  )
  for (const model of models) {
    expect(model.fruits.every((f) => f.spineCount === 84)).toBe(true)
    for (const part of model.parts.slice(3, 6)) {
      expect(part.shape.colors?.length).toBe(part.shape.positions.length)
      expect(
        part.shape.colors?.some((value, i) => i % 3 === 0 && value > 0.5)
      ).toBe(true)
    }
  }
})

it('gives every leaf a spatially varying green surface at both detail levels', () => {
  for (const model of createCropModels({ netTop: 3, netBottom: 0.45 })) {
    for (const shape of [model.parts[1].shape, model.parts[1].distantShape]) {
      if (!shape) throw new Error('Missing leaf shape')
      expect(shape.colors?.length).toBe(shape.positions.length)
      const colors = new Set<string>()
      for (let i = 0; i < (shape.colors?.length ?? 0); i += 3) {
        const color = shape.colors?.slice(i, i + 3) ?? []
        expect(color[1]).toBeGreaterThan(color[0])
        expect(color[1]).toBeGreaterThan(color[2])
        colors.add(color.map((v) => v.toFixed(4)).join(','))
      }
      expect(colors.size).toBeGreaterThan(10)
    }
  }
})
