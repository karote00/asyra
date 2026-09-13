import type { MeshNode } from '../mesh-index'

/** Test-owned comparison policy. Receives actual already-paid traversal nodes. */
export function terminalNodeGap(
  a: MeshNode | undefined,
  b: MeshNode | undefined,
  gap: number,
  original: () => number
): number {
  if (
    a &&
    !a.children &&
    a.triangles.length === 1 &&
    b &&
    !b.children &&
    b.triangles.length === 1
  )
    return gap
  return original()
}
