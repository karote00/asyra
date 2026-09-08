import type { Trajectory } from './workcell'

/** Executable timing semantics, separate from finite authored endpoints. */
export function trajectoryIntervalError(
  interval: readonly [number, number],
  trajectory: Trajectory
): string {
  if (interval[0] > interval[1]) return 'Start time must not exceed end time.'
  const first = trajectory.keyframes[0]
  const last = trajectory.keyframes.at(-1)
  if (!first || !last || interval[0] < first.time || interval[1] > last.time)
    return 'The trajectory does not cover the full analysis interval.'
  return ''
}
