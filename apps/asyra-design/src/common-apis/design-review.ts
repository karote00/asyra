import core from '../contexts'
import { deriveGroupBounds } from '@asyra/preset'
import type { InspectionEvidenceStamp } from '../ai/inspection-evidence'
import { observeInspectionChanges } from './inspection-evidence'
import type { InspectionDependencyChange } from './inspection-dependencies'
import {
  yieldToCooperativeHost,
  subscribeToFileLoadComplete
} from '@asyra/core'
import { EntityTypes, SharedDataChannelNames } from '@asyra/utils'
export type MechanicalCoverageSelection = readonly string[] | 'descendants'

interface Bounds {
  x: number
  y: number
  width: number
  height: number
}
interface ReviewApis {
  observeChanges?(
    listener: (change?: InspectionDependencyChange) => void
  ): () => void
  read(id: string):
    | {
        type?: string
        children?: readonly string[]
        parentId?: string
        visible?: boolean
      }
    | undefined
  computed(
    id: string,
    fields: readonly string[]
  ): Record<string, unknown> | undefined
  measure(
    ids: readonly string[]
  ): readonly { elementId: string; bounds: Bounds | null }[]
}
interface ReviewFinding {
  parentId?: string
  kind: string
  elementId: string
  left?: number
  top?: number
  right?: number
  bottom?: number
}
export const observeDesignChanges = (listener: () => void): (() => void) => {
  const stops = [
    core.observeSharedDataChannel(SharedDataChannelNames.SCENE_TREE, listener),
    core.observeSharedDataChannel(SharedDataChannelNames.PROPS, listener)
  ]
  const fileLoad = subscribeToFileLoadComplete(listener)
  return () => {
    stops.forEach((stop) => stop())
    fileLoad.unsubscribe()
  }
}
const defaultApis: ReviewApis = {
  observeChanges: observeInspectionChanges,
  read: (id) => {
    const metadata = core.getElementMetadata(id)
    if (!metadata) {
      return undefined
    }
    return {
      ...metadata,
      children: metadata.childCount
        ? core.getElementChildren(id, 0, metadata.childCount).elementIds
        : []
    }
  },
  computed: (id, fields) => core.getElementComputedData(id, fields),
  measure: (ids) => core.measureElementContentBounds(ids)
}
const fields = ['x', 'y', 'width', 'height', 'rotation']
const reviewChunkSize = 200
const mechanicalRuleBasis = 'local-geometry-and-text-v2'
const createReviewObservation = () => ({
  aggregatedNodes: 0,
  evaluatedNodes: 0,
  reusedNodes: 0,
  metadataReads: 0,
  computedReads: 0,
  textMeasurements: 0
})
const overflow = (bounds: Bounds, width: number, height: number) => ({
  left: Math.max(0, -bounds.x),
  top: Math.max(0, -bounds.y),
  right: Math.max(0, bounds.x + bounds.width - width),
  bottom: Math.max(0, bounds.y + bounds.height - height)
})
interface NodeVerdict {
  type?: string
  group: boolean
  constrainsChildren: boolean
  parentId?: string
  rotation?: unknown
  inherited: boolean
  parentWidth?: number
  parentHeight?: number
  children: readonly string[]
  visible: boolean
  bounds?: Bounds
  complete: boolean
  findings: ReviewFinding[]
  text?: {
    layout: Bounds
    content?: Bounds
    measured: boolean
    findings: ReviewFinding[]
  }
}

export const createDesignReviewer = (
  apis: ReviewApis = defaultApis,
  yieldToHost: () => Promise<void> = yieldToCooperativeHost,
  retain = false
) => {
  const cache = new Map<string, NodeVerdict>()
  const parents = new Map<string, Set<string>>()
  const dirty = new Set<string>()
  const enabled = retain && !!apis.observeChanges
  let stop: (() => void) | undefined
  let generation = 0
  let disposed = false
  const sessionId = crypto.randomUUID()
  let resetGeneration = -1
  type Coverage = readonly { elementId: string; node: NodeVerdict }[]
  interface CoverageIndex {
    nodes: ReadonlyMap<string, NodeVerdict>
    findings: readonly ReviewFinding[]
  }
  const receipts = new Map<
    string,
    {
      rootId: string
      revision: number
      generation: number
      digest: string
      coverage: Coverage
      index?: CoverageIndex
      projected?: boolean
    }
  >()
  const latest = new Map<string, string>()
  // These are immutable rule inputs from the existing verdict owner, not scene copies.
  const ruleInputs = (
    rootId: string,
    elementId: string,
    value: NodeVerdict,
    projected = false
  ) => {
    const node =
      projected && elementId === rootId
        ? {
            ...value,
            inherited: true,
            parentId: undefined,
            parentWidth: undefined,
            parentHeight: undefined
          }
        : value
    return {
      type: node.type,
      group: node.group,
      constrainsChildren: node.constrainsChildren,
      inherited: node.inherited,
      visible: node.visible,
      parentId: node.parentId,
      parentWidth: node.parentWidth,
      parentHeight: node.parentHeight,
      bounds:
        node.bounds &&
        (elementId === rootId
          ? { width: node.bounds.width, height: node.bounds.height }
          : node.bounds),
      rotation: node.parentWidth === undefined ? undefined : node.rotation,
      children: [...node.children].sort(),
      text: node.text && {
        layout: {
          width: node.text.layout.width,
          height: node.text.layout.height
        },
        content: node.text.content
      }
    }
  }
  const digestCoverage = async (rootId: string, coverage: Coverage) => {
    const rows = coverage
      .map(({ elementId, node }) => ({
        elementId,
        ...ruleInputs(rootId, elementId, node)
      }))
      .sort((a, b) => {
        if (a.elementId === b.elementId) {
          return 0
        }
        return a.elementId < b.elementId ? -1 : 1
      })
    const bytes = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(
        JSON.stringify({ basis: mechanicalRuleBasis, rootId, rows })
      )
    )
    return Array.from(new Uint8Array(bytes), (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('')
  }
  const clear = () => {
    cache.clear()
    parents.clear()
    dirty.clear()
  }
  const change = (value?: InspectionDependencyChange) => {
    generation++
    if (!value) {
      clear()
      receipts.clear()
      latest.clear()
      resetGeneration = generation
      return
    }
    const pending = [...value.elementIds, ...(value.parentIds ?? [])]
    const seen = new Set<string>()
    for (const id of pending) {
      if (seen.has(id)) {
        continue
      }
      seen.add(id)
      dirty.add(id)
      pending.push(...(parents.get(id) ?? []))
    }
  }
  const runReview = async (rootId: string, signal?: AbortSignal) => {
    const assertActive = () => {
      signal?.throwIfAborted()
      if (disposed) {
        throw new Error('Design reviewer is disposed.')
      }
    }
    assertActive()
    if (typeof rootId !== 'string' || !rootId.length || rootId.length > 256) {
      throw new Error('Invalid review target.')
    }
    if (enabled) {
      stop ??= apis.observeChanges?.(change)
    }
    const start = generation
    let documentChanged = false
    const stopObserving = enabled
      ? undefined
      : apis.observeChanges?.(() => {
          documentChanged = true
        })
    const work = createReviewObservation()
    try {
      const coverage: { elementId: string; node: NodeVerdict }[] = []
      const findings: ReviewFinding[] = []
      const measuredTextIds: string[] = []
      const queue: {
        id: string
        visible: boolean
        parent?: { id: string; bounds?: Bounds }
      }[] = [{ id: rootId, visible: true }]
      const visited = new Set<string>()
      const pending = new Map<string, NodeVerdict>()
      const texts = new Map<string, NonNullable<NodeVerdict['text']>>()
      const measureIds: string[] = []
      let complete = true
      for (let index = 0; index < queue.length; index++) {
        if (index > 0 && index % reviewChunkSize === 0) {
          await yieldToHost()
        }
        assertActive()
        const { id, visible: inherited, parent } = queue[index]
        if (visited.has(id)) {
          complete = false
          findings.push({ kind: 'invalid-hierarchy', elementId: id })
          continue
        }
        visited.add(id)
        work.aggregatedNodes++
        let node = enabled && !dirty.has(id) ? cache.get(id) : undefined
        if (
          node &&
          (node.inherited !== inherited ||
            node.parentId !== parent?.id ||
            node.parentWidth !== parent?.bounds?.width ||
            node.parentHeight !== parent?.bounds?.height)
        ) {
          node = undefined
        }
        if (node) {
          work.reusedNodes++
        } else {
          work.evaluatedNodes++
          work.metadataReads++
          const data = apis.read(id)
          if (!data) {
            complete = false
            findings.push({ kind: 'missing-element', elementId: id })
            continue
          }
          const visible = inherited && data.visible !== false
          // Workspace owns membership, not a geometric rectangle. Real descendant
          // geometry and Frame containment remain checked by their normal owners.
          const workspace = data.type === EntityTypes.WORKSPACE
          if (!workspace) {
            work.computedReads++
          }
          const computed = workspace ? undefined : apis.computed(id, fields)
          const valid =
            computed &&
            ['x', 'y', 'width', 'height'].every(
              (key) =>
                typeof computed[key] === 'number' &&
                Number.isFinite(computed[key])
            ) &&
            Number(computed.width) >= 0 &&
            Number(computed.height) >= 0
          let bounds = valid
            ? {
                x: Number(computed.x),
                y: Number(computed.y),
                width: Number(computed.width),
                height: Number(computed.height)
              }
            : undefined
          if (bounds && data.type === 'oval') {
            const rotation = computed?.rotation ?? 0
            if (typeof rotation !== 'number' || !Number.isFinite(rotation)) {
              bounds = undefined
            } else {
              bounds = deriveGroupBounds([
                { ...bounds, type: data.type, rotation }
              ])
            }
          }
          node = {
            type: data.type,
            group: data.type === EntityTypes.GROUP,
            constrainsChildren: data.type === EntityTypes.FRAME,
            parentId: parent?.id,
            rotation: computed?.rotation,
            inherited,
            parentWidth: parent?.bounds?.width,
            parentHeight: parent?.bounds?.height,
            children: Array.isArray(data.children) ? [...data.children] : [],
            visible,
            bounds,
            complete: true,
            findings: []
          }
          if (visible && !workspace && !bounds) {
            node.complete = false
            node.findings.push({ kind: 'geometry-unavailable', elementId: id })
          }
          if (visible && bounds && data.type === 'text') {
            node.text = { layout: bounds, measured: false, findings: [] }
            measureIds.push(id)
          }
          pending.set(id, node)
        }
        coverage.push({ elementId: id, node })
        if (node.text) {
          texts.set(id, node.text)
        }
        for (const child of node.children) {
          queue.push({
            id: child,
            visible: node.visible,
            parent: {
              id,
              bounds: node.constrainsChildren ? node.bounds : undefined
            }
          })
        }
      }
      // Derive Group content through the existing geometry owner without changing
      // canonical snapshots or introducing a second retained geometry cache.
      const nodes = new Map(
        coverage.map(({ elementId, node }) => [elementId, node])
      )
      for (let index = coverage.length - 1; index >= 0; index--) {
        if (index > 0 && index % reviewChunkSize === 0) {
          await yieldToHost()
        }
        assertActive()
        const { elementId, node } = coverage[index]
        if (!node.group || !pending.has(elementId) || !node.bounds) {
          continue
        }
        const children = node.children
          .map((id) => nodes.get(id))
          .filter((child) => !child || child.visible)
        if (
          children.some(
            (child) =>
              !child?.bounds ||
              !child.complete ||
              (child.type !== 'oval' &&
                child.rotation !== undefined &&
                child.rotation !== 0)
          )
        ) {
          node.complete = false
          node.findings.push({ kind: 'group-bounds-unchecked', elementId })
          continue
        }
        const content = deriveGroupBounds(
          children.flatMap((child) => (child?.bounds ? [child.bounds] : []))
        )
        node.bounds = {
          x: node.bounds.x + content.x,
          y: node.bounds.y + content.y,
          width: content.width,
          height: content.height
        }
      }
      for (const { elementId, node } of coverage) {
        if (
          pending.has(elementId) &&
          node.visible &&
          node.bounds &&
          node.parentWidth !== undefined &&
          node.parentHeight !== undefined
        ) {
          if (
            node.type !== 'oval' &&
            node.rotation !== undefined &&
            node.rotation !== 0
          ) {
            node.complete = false
            node.findings.push({ kind: 'rotated-bounds-unchecked', elementId })
          } else if (node.complete) {
            const excess = overflow(
              node.bounds,
              node.parentWidth,
              node.parentHeight
            )
            if (Object.values(excess).some((value) => value > 0.5)) {
              node.findings.push({
                kind: 'container-overflow',
                elementId,
                ...(node.parentId ? { parentId: node.parentId } : {}),
                ...excess
              })
            }
          }
        }
        complete &&= node.complete
        findings.push(...node.findings.map((finding) => ({ ...finding })))
      }
      const measured: ReturnType<ReviewApis['measure']>[number][] = []
      if (measureIds.length) {
        try {
          for (
            let offset = 0;
            offset < measureIds.length;
            offset += reviewChunkSize
          ) {
            if (offset > 0) {
              await yieldToHost()
            }
            assertActive()
            const batch = measureIds.slice(offset, offset + reviewChunkSize)
            work.textMeasurements += batch.length
            measured.push(...apis.measure(batch))
          }
        } catch {
          assertActive()
          complete = false
        }
        const byId = new Map(
          measured.map((entry) => [entry.elementId, entry.bounds])
        )
        for (const id of measureIds) {
          const text = texts.get(id)
          if (!text) {
            continue
          }
          const content = byId.get(id)
          if (!content || !Object.values(content).every(Number.isFinite)) {
            complete = false
            text.findings.push({
              kind: 'measurement-unavailable',
              elementId: id
            })
          } else {
            text.content = { ...content }
            text.measured = true
            const excess = overflow(
              content,
              text.layout.width,
              text.layout.height
            )
            if (Object.values(excess).some((value) => value > 0.5)) {
              text.findings.push({
                kind: 'text-overflow',
                elementId: id,
                ...excess
              })
            }
          }
        }
      }
      for (const [id, text] of texts) {
        if (text.measured) {
          measuredTextIds.push(id)
        }
        findings.push(...text.findings.map((finding) => ({ ...finding })))
      }
      assertActive()
      documentChanged ||= enabled && start !== generation
      if (documentChanged) {
        complete = false
        findings.push({ kind: 'document-changed', elementId: rootId })
      } else if (
        enabled &&
        !findings.some((finding) => finding.kind === 'invalid-hierarchy')
      ) {
        const removed = new Set<string>()
        for (const [id, node] of pending) {
          if (!node.complete || (node.text && !node.text.measured)) {
            continue
          }
          for (const child of cache.get(id)?.children ?? []) {
            const owners = parents.get(child)
            owners?.delete(id)
            if (!owners?.size) {
              parents.delete(child)
              removed.add(child)
            }
          }
          cache.set(id, node)
          dirty.delete(id)
          for (const child of node.children) {
            const owners = parents.get(child) ?? new Set<string>()
            owners.add(id)
            parents.set(child, owners)
          }
        }
        for (const id of removed) {
          if (parents.has(id) || visited.has(id)) {
            continue
          }
          for (const child of cache.get(id)?.children ?? []) {
            const owners = parents.get(child)
            owners?.delete(id)
            if (!owners?.size) {
              parents.delete(child)
              removed.add(child)
            }
          }
          cache.delete(id)
          dirty.delete(id)
        }
      }
      return {
        coverage,
        measurement: {
          complete,
          truncated: false,
          checkedElements: visited.size,
          measuredTextCount: measuredTextIds.length,
          measuredTextIds,
          findings,
          observation: work
        }
      }
    } finally {
      stopObserving?.()
    }
  }
  const review = async (rootId: string, signal?: AbortSignal) =>
    (await runReview(rootId, signal)).measurement
  const capture = async (
    rootId: string,
    signal?: AbortSignal,
    measurementTargets?: MechanicalCoverageSelection
  ) => {
    const candidates =
      measurementTargets === 'descendants'
        ? undefined
        : new Set(measurementTargets)
    const start = generation
    const { measurement, coverage } = await runReview(rootId, signal)
    const unavailable = () => ({
      ...measurement,
      complete: false,
      available: false,
      evidence: undefined
    })
    if (!enabled || !measurement.complete) {
      return unavailable()
    }
    const digest = await digestCoverage(rootId, coverage)
    signal?.throwIfAborted()
    if (disposed || generation !== start) {
      return unavailable()
    }
    const oldId = latest.get(rootId)
    const old = oldId ? receipts.get(oldId) : undefined
    const unchanged =
      old &&
      (old.projected
        ? !!old.index &&
          coverage.every(({ elementId, node }) => {
            const prior = old.index?.nodes.get(elementId)
            return (
              !!prior &&
              JSON.stringify(ruleInputs(rootId, elementId, prior, true)) ===
                JSON.stringify(ruleInputs(rootId, elementId, node))
            )
          })
        : old.digest === digest)
    const receiptId = oldId && unchanged ? oldId : crypto.randomUUID()
    if (oldId && oldId !== receiptId) {
      receipts.delete(oldId)
    }
    const receipt = unchanged
      ? Object.assign(old, {
          generation,
          coverage,
          digest,
          projected: false,
          index: undefined
        })
      : {
          rootId,
          revision: generation,
          generation,
          digest,
          coverage
        }
    receipts.set(receiptId, receipt)
    latest.set(rootId, receiptId)
    return {
      ...measurement,
      available: true,
      ...(measurementTargets
        ? {
            coveredMeasurementTargets: coverage
              .filter(({ elementId }) =>
                candidates ? candidates.has(elementId) : elementId !== rootId
              )
              .map(({ elementId }) => elementId)
          }
        : {}),
      evidence: { sessionId, revision: receipt.revision, receiptId }
    }
  }
  const owns = (stamp: InspectionEvidenceStamp) => stamp.sessionId === sessionId
  const isCurrent = (stamp: InspectionEvidenceStamp) => {
    const receipt = stamp.receiptId ? receipts.get(stamp.receiptId) : undefined
    return (
      !disposed &&
      owns(stamp) &&
      !!receipt &&
      receipt.revision === stamp.revision &&
      receipt.generation === generation
    )
  }
  const validate = async (
    stamp: InspectionEvidenceStamp,
    signal?: AbortSignal
  ) => {
    signal?.throwIfAborted()
    let observation = createReviewObservation()
    const answer = (
      current: boolean,
      reason?: string,
      changedElementId?: string,
      changedInputs?: string[]
    ) => ({
      current,
      observation,
      validatedAt: { sessionId, revision: generation },
      ...(reason ? { reason } : {}),
      ...(changedElementId ? { changedElementId, changedInputs } : {})
    })
    if (disposed) {
      return answer(false, 'owner-disposed')
    }
    if (!owns(stamp)) {
      return answer(false, 'foreign-owner')
    }
    if (stamp.revision < resetGeneration) {
      return answer(false, 'source-replaced-or-unknown')
    }
    const receipt = stamp.receiptId ? receipts.get(stamp.receiptId) : undefined
    if (!receipt || receipt.revision !== stamp.revision) {
      return answer(false, 'receipt-unavailable')
    }
    if (receipt.generation === generation) {
      return answer(true)
    }
    const start = generation
    const { measurement, coverage } = await runReview(receipt.rootId, signal)
    observation = measurement.observation
    if (!measurement.complete) {
      return answer(false, 'checks-incomplete')
    }
    const digest = await digestCoverage(receipt.rootId, coverage)
    signal?.throwIfAborted()
    if (
      disposed ||
      generation !== start ||
      receipts.get(stamp.receiptId ?? '') !== receipt
    ) {
      return answer(false, 'source-changed-during-validation')
    }
    if (receipt.projected || digest !== receipt.digest) {
      if (receipt.projected && !receipt.index) {
        return answer(false, 'coverage-unavailable')
      }
      const prior =
        receipt.projected && receipt.index
          ? receipt.index.nodes
          : new Map(receipt.coverage.map((row) => [row.elementId, row.node]))
      for (const { elementId, node } of coverage) {
        const old = prior.get(elementId)
        if (!old) {
          return answer(false, 'rule-inputs-changed', elementId, ['membership'])
        }
        const before = ruleInputs(
          receipt.rootId,
          elementId,
          old,
          receipt.projected
        )
        const after = ruleInputs(receipt.rootId, elementId, node)
        const fields = (Object.keys(after) as (keyof typeof after)[]).filter(
          (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key])
        )
        if (fields.length) {
          return answer(false, 'rule-inputs-changed', elementId, fields)
        }
        if (!receipt.projected) {
          ;(prior as Map<string, NodeVerdict>).delete(elementId)
        }
      }
      if (!receipt.projected && prior.size > 0) {
        return answer(false, 'rule-inputs-changed', prior.keys().next().value, [
          'membership'
        ])
      }
    }
    receipt.generation = generation
    receipt.coverage = coverage
    receipt.digest = digest
    receipt.projected = false
    receipt.index = undefined
    return answer(true)
  }
  const reconcile = async (
    stamp: InspectionEvidenceStamp,
    targets: readonly string[],
    signal?: AbortSignal
  ) => {
    if (
      !targets.length ||
      targets.length > 64 ||
      new Set(targets).size !== targets.length
    ) {
      throw new Error('Mechanical coverage requires 1-64 unique targets.')
    }
    const validation = await validate(stamp, signal)
    signal?.throwIfAborted()
    const receipt = receipts.get(stamp.receiptId ?? '')
    const unavailable = (elementId: string, reason: string) => ({
      elementId,
      available: false as const,
      reason
    })
    if (!validation.current || !receipt || !isCurrent(stamp)) {
      return {
        ...validation,
        measurements: targets.map((id) =>
          unavailable(id, 'coverage-unavailable')
        )
      }
    }
    const index = receipt.index ?? {
      nodes: new Map(
        receipt.coverage.map(({ elementId, node }) => [elementId, node])
      ),
      findings: receipt.coverage.flatMap(({ node }) => [
        ...node.findings,
        ...(node.text?.findings ?? [])
      ])
    }
    receipt.index = index
    const within = (id: string, rootId: string) => {
      const seen = new Set<string>()
      for (
        let current: string | undefined = id;
        current && !seen.has(current);
        current = index.nodes.get(current)?.parentId
      ) {
        if (current === rootId) {
          return true
        }
        seen.add(current)
      }
      return false
    }
    const measurements = targets.map((elementId) => {
      const node = index.nodes.get(elementId)
      if (!node || !within(elementId, receipt.rootId)) {
        return unavailable(elementId, 'target-not-covered')
      }
      if (!node.inherited) {
        return unavailable(elementId, 'incompatible-inherited-visibility')
      }
      const findings = index.findings.filter(
        (finding) =>
          within(finding.elementId, elementId) &&
          !(
            finding.elementId === elementId &&
            finding.kind === 'container-overflow'
          )
      )
      const oldId = latest.get(elementId)
      const old = oldId ? receipts.get(oldId) : undefined
      let receiptId = oldId
      let revision = old?.revision
      if (old && old.generation !== generation) {
        const previous =
          old.projected && old.index
            ? old.index.nodes
            : new Map(old.coverage.map((row) => [row.elementId, row.node]))
        const ids = [elementId]
        let unchanged = true
        for (const id of ids) {
          const before = previous.get(id)
          const after = index.nodes.get(id)
          if (
            !before ||
            !after ||
            JSON.stringify(ruleInputs(elementId, id, before, true)) !==
              JSON.stringify(ruleInputs(elementId, id, after, true))
          ) {
            unchanged = false
            break
          }
          ids.push(...after.children)
        }
        // Equal rule inputs preserve the identity used by downstream judgments.
        // Updating an unrelated subtree must not invalidate a check dependency.
        if (unchanged) {
          old.generation = generation
        }
      }
      if (!old || old.generation !== generation) {
        receiptId = crypto.randomUUID()
        revision = generation
        // Share immutable reviewed inputs. Each successor validates its own scope.
        receipts.set(receiptId, {
          rootId: elementId,
          revision,
          generation,
          digest: '',
          coverage: [],
          index,
          projected: true
        })
        latest.set(elementId, receiptId)
        if (oldId) {
          receipts.delete(oldId)
        }
      }
      if (!receiptId || revision === undefined) {
        return unavailable(elementId, 'coverage-unavailable')
      }
      return {
        elementId,
        available: true as const,
        complete: true as const,
        findings,
        evidence: { sessionId, revision, receiptId }
      }
    })
    return { ...validation, measurements }
  }
  return Object.assign(review, {
    reconcile,
    capture,
    isCurrent,
    owns,
    validate,
    // Internal coverage access: no model-facing all-object identity payload.
    coverage: async (stamp: InspectionEvidenceStamp, signal?: AbortSignal) => {
      if (!(await validate(stamp, signal)).current) {
        return undefined
      }
      const receipt = receipts.get(stamp.receiptId ?? '')
      if (!receipt || receipt.generation !== generation || disposed) {
        return undefined
      }
      let coverage = receipt.coverage
      if (receipt.projected && receipt.index) {
        const rows: { elementId: string; node: NodeVerdict }[] = []
        const ids = [receipt.rootId]
        for (const elementId of ids) {
          const node = receipt.index.nodes.get(elementId)
          if (!node) {
            return
          }
          rows.push({
            elementId,
            node:
              elementId === receipt.rootId
                ? {
                    ...node,
                    inherited: true,
                    parentId: undefined,
                    parentWidth: undefined,
                    parentHeight: undefined
                  }
                : node
          })
          ids.push(...node.children)
        }
        coverage = rows
      }
      return {
        rootId: receipt.rootId,
        basis: mechanicalRuleBasis,
        checks: coverage.map(({ elementId, node }) => ({
          elementId,
          inherited: node.inherited,
          parentId: node.parentId,
          parentWidth: node.parentWidth,
          parentHeight: node.parentHeight,
          geometry: node.visible && node.type !== EntityTypes.WORKSPACE,
          containment: node.visible && node.parentWidth !== undefined,
          text: !!node.text
        }))
      }
    },
    dispose: () => {
      disposed = true
      stop?.()
      stop = undefined
      clear()
      receipts.clear()
      latest.clear()
    }
  })
}
export const reviewDesign = createDesignReviewer()
