import type { SpatialQuaternion, SpatialVector } from '@asyra/render-engine'
export interface SpatialPose {
  readonly position: SpatialVector
  readonly rotation: SpatialQuaternion
  readonly scale?: SpatialVector
}
function admit(value: SpatialPose): SpatialPose {
  const position = [...value.position],
    rotation = [...value.rotation],
    scale = [...(value.scale ?? [1, 1, 1])]
  if (
    position.length !== 3 ||
    rotation.length !== 4 ||
    scale.length !== 3 ||
    ![...position, ...rotation, ...scale].every(Number.isFinite) ||
    scale.some((n) => n <= 0) ||
    Math.abs(Math.hypot(...rotation) - 1) > 1e-8
  )
    throw new Error('Invalid spatial pose')
  return Object.freeze({
    position: Object.freeze(position) as unknown as SpatialVector,
    rotation: Object.freeze(rotation) as unknown as SpatialQuaternion,
    scale: Object.freeze(scale) as unknown as SpatialVector
  })
}
/** One target, no clock or canonical state. The caller supplies explicit progress. */
export class SpatialPosePresentation {
  private target: SpatialPose | null = null
  private disposed = false
  get active() {
    return this.target !== null
  }
  retarget(target: SpatialPose): void {
    this.assertLive()
    this.target = admit(target)
  }
  cancel(): void {
    this.assertLive()
    this.target = null
  }
  dispose(): void {
    this.target = null
    this.disposed = true
  }
  advance(
    current: SpatialPose,
    fraction: number,
    policy: { tolerance: number; reducedMotion: boolean }
  ): SpatialPose {
    this.assertLive()
    const from = admit(current)
    if (
      !Number.isFinite(fraction) ||
      fraction < 0 ||
      fraction > 1 ||
      !Number.isFinite(policy.tolerance) ||
      policy.tolerance < 0 ||
      typeof policy.reducedMotion !== 'boolean'
    )
      throw new Error('Invalid pose interpolation')
    const target = this.target
    if (!target) return current
    const t = policy.reducedMotion ? 1 : fraction
    let dot = from.rotation.reduce(
      (sum, n, i) => sum + n * target.rotation[i],
      0
    )
    const end = target.rotation.map((n) => (dot < 0 ? -n : n))
    dot = Math.min(1, Math.abs(dot))
    const angle = Math.acos(dot),
      sin = Math.sin(angle)
    const a = sin < 1e-8 ? 1 - t : Math.sin((1 - t) * angle) / sin,
      b = sin < 1e-8 ? t : Math.sin(t * angle) / sin
    const q = from.rotation.map((n, i) => n * a + end[i] * b),
      length = Math.hypot(...q)
    const next =
      t === 1
        ? target
        : admit({
            position: from.position.map(
              (n, i) => n + (target.position[i] - n) * t
            ) as unknown as SpatialVector,
            rotation: q.map((n) => n / length) as unknown as SpatialQuaternion,
            scale: from.scale?.map(
              (n, i) => n + ((target.scale?.[i] ?? 1) - n) * t
            ) as unknown as SpatialVector
          })
    const remaining =
      next.position.some(
        (n, i) => Math.abs(n - target.position[i]) > policy.tolerance
      ) ||
      next.scale?.some(
        (n, i) => Math.abs(n - (target.scale?.[i] ?? 1)) > policy.tolerance
      ) ||
      1 -
        Math.abs(
          next.rotation.reduce((sum, n, i) => sum + n * target.rotation[i], 0)
        ) >
        policy.tolerance
    if (!remaining) this.target = null
    return next
  }
  private assertLive() {
    if (this.disposed) throw new Error('Pose presentation is disposed')
  }
}
