export interface InspectionRegion {
  x: number
  y: number
  width: number
  height: number
}
export interface InspectionDependencyChange {
  /** Actual visual changes; includes old members that were removed. */
  elementIds: readonly string[]
  /** Membership notifications and old parents, not ancestor visual changes. */
  parentIds?: readonly string[]
  /** Editable-container changes that do not affect rendered pixels. */
  attachmentIds?: readonly string[]
}
interface Receipt {
  revision: number
  target: string
  region?: InspectionRegion
  members: string[]
  dependencies: Set<string>
  ancestors: Set<string>
  pending: boolean
  attachment?: string
}

/** Capture-owned dependency metadata. Canonical content stays with Core. */
export const createInspectionDependencies = (source: {
  parent(id: string): string | undefined
  attachment?(target: string): string
  region(target: string, region: InspectionRegion): string[]
}) => {
  const receipts = new Map<string, Receipt>()
  const roots = new Map<string, Set<string>>()
  const dependencies = new Map<string, Set<string>>()
  const ancestors = new Map<string, Set<string>>()
  let disposed = false
  let generation = 0
  const chain = (id: string, reads = new Map<string, string | undefined>()) => {
    const result: string[] = []
    const seen = new Set<string>()
    while (id) {
      if (seen.has(id)) throw new Error('Cyclic inspection dependency')
      seen.add(id)
      result.push(id)
      if (!reads.has(id)) reads.set(id, source.parent(id))
      id = reads.get(id) ?? ''
    }
    return result
  }
  const link = (index: Map<string, Set<string>>, key: string, id: string) => {
    const ids = index.get(key) ?? new Set<string>()
    ids.add(id)
    index.set(key, ids)
  }
  const unlink = (index: Map<string, Set<string>>, key: string, id: string) => {
    const ids = index.get(key)
    ids?.delete(id)
    if (!ids?.size) index.delete(key)
  }
  const retire = (id: string) => {
    const receipt = receipts.get(id)
    if (!receipt) return
    unlink(roots, receipt.target, id)
    for (const key of receipt.dependencies) unlink(dependencies, key, id)
    for (const key of receipt.ancestors) unlink(ancestors, key, id)
    receipts.delete(id)
  }
  const clear = () => {
    receipts.clear()
    roots.clear()
    dependencies.clear()
    ancestors.clear()
  }
  const owner = {
    capture(
      target: string,
      region: InspectionRegion | undefined,
      revision: number,
      attachment?: { signature: string; chain: readonly string[] }
    ) {
      if (disposed) throw new Error('Inspection dependencies are disposed')
      if (attachment && !source.attachment)
        throw new Error('Attachment signature source is unavailable')
      const start = generation
      const signature = attachment?.signature
      const reads = new Map<string, string | undefined>()
      const targetChain = attachment
        ? [...attachment.chain]
        : chain(target, reads)
      if (
        !targetChain.length ||
        targetChain[0] !== target ||
        new Set(targetChain).size !== targetChain.length
      )
        throw new Error('Invalid attachment dependency chain')
      const members = region ? source.region(target, region) : []
      const memberDependencies = new Set<string>([target])
      for (const member of members) {
        const path = chain(member, reads)
        const position = path.indexOf(target)
        if (position < 0) throw new Error('Foreign inspection region member')
        path.slice(0, position + 1).forEach((id) => memberDependencies.add(id))
      }
      if (start !== generation)
        throw new Error('Inspection dependencies changed during capture')
      const receiptId = crypto.randomUUID()
      const receipt: Receipt = {
        revision,
        target,
        ...(signature === undefined ? {} : { attachment: signature }),
        region: region && { ...region },
        members,
        dependencies: memberDependencies,
        ancestors: new Set(targetChain.slice(1)),
        pending: false
      }
      receipts.set(receiptId, receipt)
      link(roots, target, receiptId)
      for (const id of memberDependencies) link(dependencies, id, receiptId)
      for (const id of receipt.ancestors) link(ancestors, id, receiptId)
      return { receiptId, revision }
    },
    currentAttachment(
      stamp: { receiptId?: string; revision: number },
      parentId: string
    ): boolean {
      const receipt = stamp.receiptId
        ? receipts.get(stamp.receiptId)
        : undefined
      return (
        !!receipt &&
        receipt.target === parentId &&
        receipt.attachment !== undefined &&
        owner.current(stamp)
      )
    },
    current(stamp: { receiptId?: string; revision: number }) {
      const receiptId = stamp.receiptId
      if (!receiptId) return false
      const receipt = receipts.get(receiptId)
      if (!receipt || receipt.revision !== stamp.revision) return false
      if (!receipt.pending) return true
      if (receipt.attachment !== undefined) {
        try {
          const start = generation
          if (
            source.attachment?.(receipt.target) !== receipt.attachment ||
            start !== generation ||
            !receipts.has(receiptId)
          ) {
            retire(receiptId)
            return false
          }
          receipt.pending = false
          return true
        } catch {
          retire(receiptId)
          return false
        }
      }
      if (!receipt.region) {
        retire(receiptId)
        return false
      }
      try {
        const start = generation
        const members = source.region(receipt.target, receipt.region)
        if (
          start !== generation ||
          !receipts.has(receiptId) ||
          members.length !== receipt.members.length ||
          members.some((id, i) => id !== receipt.members[i])
        ) {
          retire(receiptId)
          return false
        }
        receipt.pending = false
        return true
      } catch {
        retire(receiptId)
        return false
      }
    },
    release(stamp: { receiptId?: string }) {
      if (stamp.receiptId) retire(stamp.receiptId)
    },
    change(change?: InspectionDependencyChange) {
      generation++
      if (!change) {
        clear()
        return
      }
      if (!receipts.size) return
      const affected = new Set<string>()
      const reads = new Map<string, string | undefined>()
      try {
        for (const id of new Set(change.attachmentIds ?? [])) {
          for (const key of [
            ...(dependencies.get(id) ?? []),
            ...(ancestors.get(id) ?? [])
          ]) {
            const receipt = receipts.get(key)
            if (receipt?.attachment !== undefined) receipt.pending = true
          }
        }
        for (const id of new Set(change.elementIds)) {
          // Old membership and ancestor effects are known even after removal.
          for (const receipt of [
            ...(dependencies.get(id) ?? []),
            ...(ancestors.get(id) ?? [])
          ]) {
            const retained = receipts.get(receipt)
            if (retained?.attachment !== undefined) retained.pending = true
            else retire(receipt)
          }
          try {
            for (const parent of chain(id, reads))
              for (const receipt of roots.get(parent) ?? [])
                affected.add(receipt)
          } catch {
            // Removal requires an explicit old-parent notification.
            if (!change.parentIds?.length)
              throw new Error('Unknown removed dependency')
          }
        }
        for (const id of new Set(change.parentIds ?? [])) {
          for (const parent of chain(id, reads))
            for (const receipt of roots.get(parent) ?? []) affected.add(receipt)
        }
        for (const id of affected) {
          const receipt = receipts.get(id)
          if (!receipt) continue
          if (!receipt.region && receipt.attachment === undefined) retire(id)
          else receipt.pending = true
        }
      } catch {
        clear()
      }
    },
    dispose() {
      disposed = true
      clear()
    }
  }
  return owner
}
