import type { SpatialCamera } from './spatial-layer.js'
import { readSpatialCamera } from './camera-controls.js'

/** One presentation target; the caller owns time, scheduling and follow policy. */
export class SpatialCameraPresentation {
  private target: SpatialCamera | null = null
  private disposed = false
  get active(): boolean {
    return this.target !== null
  }
  retarget(target: SpatialCamera): void {
    this.assertLive()
    const admitted = readSpatialCamera(target)
    this.target = admitted
  }
  cancel(): void {
    this.assertLive()
    this.target = null
  }
  advance(
    current: SpatialCamera,
    fraction: number,
    policy: { tolerance: number; reducedMotion: boolean }
  ): SpatialCamera {
    this.assertLive()
    const original = current
    current = readSpatialCamera(current)
    if (
      !Number.isFinite(fraction) ||
      fraction < 0 ||
      fraction > 1 ||
      !Number.isFinite(policy.tolerance) ||
      policy.tolerance < 0 ||
      typeof policy.reducedMotion !== 'boolean'
    ) {
      throw new Error('Invalid camera interpolation')
    }
    const target = this.target
    if (!target) {
      return original
    }
    const t = policy.reducedMotion ? 1 : fraction
    const mix = (a: number, b: number) => a + (b - a) * t
    const next =
      t === 1
        ? target
        : readSpatialCamera({
            ...current,
            position: current.position.map((v, i) =>
              mix(v, target.position[i])
            ),
            target: current.target.map((v, i) => mix(v, target.target[i])),
            fov: mix(current.fov, target.fov),
            near: mix(current.near, target.near),
            far: mix(current.far, target.far)
          })
    const moving =
      next.position.some(
        (v, i) => Math.abs(v - target.position[i]) > policy.tolerance
      ) ||
      next.target.some(
        (v, i) => Math.abs(v - target.target[i]) > policy.tolerance
      ) ||
      (['fov', 'near', 'far'] as const).some(
        (key) => Math.abs(next[key] - target[key]) > policy.tolerance
      )
    if (!moving) {
      this.target = null
    }
    return next
  }
  dispose(): void {
    this.target = null
    this.disposed = true
  }
  private assertLive(): void {
    if (this.disposed) {
      throw new Error('Camera presentation is disposed')
    }
  }
}
