import spec from '../../../../assets/asyra-office/models/street/tree-construction-spec.json'
import { add, mul, type Vec } from './geometry'
export interface TreeCurve {
  at: (t: number) => Vec
  radius: (t: number) => number
}
export interface TreeBranch {
  id: string
  parent: string
  level: number
  attachment: number
}
function random(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return (state + 0.5) / 2 ** 32
  }
}
/** Extend a construction-local graph; never add a third branch level. */
export function growTreeBranches(
  seed: number,
  curves: Map<string, TreeCurve>
): TreeBranch[] {
  const config = spec.growth.additions,
    next = random(seed + config.seedOffset)
  const between = (range: readonly number[]) =>
    range[0] + (range[1] - range[0]) * next()
  const integer = (range: readonly number[]) =>
    range[0] + Math.floor(next() * (range[1] - range[0] + 1))
  const added: TreeBranch[] = []
  const grow = (
    id: string,
    parentId: string,
    level: number,
    attachment: number,
    angle: number,
    reach: number,
    rise: number
  ) => {
    const parent = curves.get(parentId)
    if (!parent) throw new Error('Missing branch growth parent')
    const start = parent.at(attachment),
      end = add(start, [
        Math.cos(angle) * reach,
        Math.sin(angle) * reach,
        rise
      ]),
      control = add(mul(add(start, end), 0.5), [
        0,
        0,
        between(config.controlLift)
      ]),
      root = Math.min(
        level === 1 ? 0.055 : 0.032,
        parent.radius(attachment) * (level === 1 ? 0.82 : 0.58)
      ),
      tip = Math.min(level === 1 ? 0.007 : 0.004, root * 0.22)
    curves.set(id, {
      at: (t) =>
        add(
          add(mul(start, (1 - t) ** 2), mul(control, 2 * t * (1 - t))),
          mul(end, t * t)
        ),
      radius: (t) => tip + (root - tip) * (1 - t) ** 1.2
    })
    added.push({ id, parent: parentId, level, attachment })
  }
  const count = integer(config.primaryCount)
  for (let i = 0; i < count; i++) {
    const z =
      config.attachmentHeight[0] +
      ((i + next()) / count) *
        (config.attachmentHeight[1] - config.attachmentHeight[0])
    grow(
      `primary-${i}`,
      'trunk',
      1,
      z / 2.55,
      next() * Math.PI * 2,
      between(config.primaryReach),
      between(config.primaryRise)
    )
  }
  const primary = [
    ...spec.branches.entries.filter((b) => b.level === 1).map((b) => b.id),
    ...added.map((b) => b.id)
  ]
  for (const id of primary) {
    const parent = curves.get(id)
    if (!parent) throw new Error('Missing primary branch')
    const n = integer(config.secondaryPerPrimary)
    for (let j = 0; j < n; j++) {
      const t =
          config.childAttachment[0] +
          ((j + next()) / n) *
            (config.childAttachment[1] - config.childAttachment[0]),
        start = parent.at(t),
        tip = parent.at(1),
        angle =
          Math.atan2(tip[1] - start[1], tip[0] - start[0]) +
          ((next() < 0.5 ? -1 : 1) *
            between(config.childAngleDegrees) *
            Math.PI) /
            180
      grow(
        `secondary-${id}-${j}`,
        id,
        2,
        t,
        angle,
        between(config.childReach),
        between(config.childRise)
      )
    }
  }
  return added
}

/** Distribute the fixed leaf budget over true branch interiors and ends. */
export function distributeTreeFoliage(
  seed: number,
  added: readonly TreeBranch[]
) {
  const config = spec.foliage.distribution,
    next = random(seed + config.seedOffset)
  const sample = (range: readonly number[]) =>
    range[0] + (range[1] - range[0]) * next()
  const clusters = spec.foliage.clusters.map((c) => ({
    ...c,
    radii: [...c.radii],
    weight: c.count * config.coreWeight
  }))
  const insert = (branch: string, t: number, radii: number[], weight: number) =>
    clusters.push({
      id: `growth-${clusters.length}`,
      branch,
      branchT: t,
      localOffset: [0, 0, 0.025],
      radii,
      count: 0,
      weight
    })
  const primary = [
    ...spec.branches.entries.filter((b) => b.level === 1).map((b) => b.id),
    ...added.filter((b) => b.level === 1).map((b) => b.id)
  ]
  for (const branch of primary)
    insert(
      branch,
      sample(config.interiorAttachment),
      config.interiorRadii,
      config.interiorWeight
    )
  for (const branch of added)
    insert(
      branch.id,
      sample(config.terminalAttachment),
      branch.level === 1 ? config.primaryRadii : config.secondaryRadii,
      branch.level === 1 ? config.primaryWeight : config.secondaryWeight
    )
  const total = clusters.reduce((n, c) => n + c.weight, 0)
  const allocation = clusters.map((c, index) => ({
    index,
    exact: (c.weight / total) * spec.foliage.totalInstances
  }))
  allocation.forEach(({ index, exact }) => {
    clusters[index].count = Math.floor(exact)
  })
  const remainder =
    spec.foliage.totalInstances - clusters.reduce((n, c) => n + c.count, 0)
  allocation
    .sort((a, b) => (b.exact % 1) - (a.exact % 1) || a.index - b.index)
    .slice(0, remainder)
    .forEach(({ index }) => clusters[index].count++)
  spec.foliage.clusters.forEach((source, index) => {
    const factor = Math.sqrt(
      clusters[index].count / source.count / config.coreProjectedDensityRatio
    )
    clusters[index].radii = source.radii.map((r) => r * factor)
  })
  return clusters
}
