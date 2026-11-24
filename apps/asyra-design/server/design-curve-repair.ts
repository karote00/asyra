import { DesignInputError } from './design-input-error'

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export function unpairedControls(ring: readonly unknown[]) {
  const issues = []

  for (const [start, anchor] of ring.entries()) {
    const end = (start + 1) % ring.length
    const next = ring[end]

    if (!record(anchor) || !record(next)) {
      continue
    }

    const outgoing = anchor.outControl !== undefined

    if (outgoing !== (next.inControl !== undefined)) {
      issues.push({
        start,
        end,
        missing: outgoing ? 'inControl' : 'outControl',
        index: outgoing ? end : start
      })
    }
  }

  return issues
}

export class DesignCurveError extends DesignInputError {}

/** Resolve pointers against the retained authoring source, never expanded scene indices. */
export function authoredCurveCorrections(source: unknown) {
  const paths: { path: string }[] = []

  function visit(node: unknown, path: string) {
    if (!record(node)) {
      return
    }

    if (node.type === 'vector-pattern') {
      visitTemplate(node.template, path + '/template')
    } else if (node.type === 'vector') {
      visitTemplate(node, path)
    }

    if (Array.isArray(node.children)) {
      node.children.forEach((child, i) => visit(child, path + '/children/' + i))
    }
  }

  function visitTemplate(node: unknown, path: string) {
    if (!record(node) || !Array.isArray(node.rings)) {
      return
    }

    for (const [r, ring] of node.rings.entries()) {
      if (!Array.isArray(ring)) {
        continue
      }

      for (const { index, missing } of unpairedControls(ring)) {
        paths.push({ path: path + '/rings/' + r + '/' + index + '/' + missing })
      }
    }
  }

  visit(source, '')

  return paths
}
