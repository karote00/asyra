import { expect, it, vi } from 'vitest'
import { createAiToolContract } from '@asyra/ai-agent-runtime'
import type { InspectionDependencyChange } from '../../src/common-apis/inspection-dependencies'
import recorded from './fixtures/recorded-101/review-usage-20261025.json'
import recordedRecovery from './fixtures/recorded-101/binding-recovery-20261026.json'
import { createLocalOperationTools } from '../local-operation-tools'
import { invokeLocalTool } from '../local-tool-invocation'
import { operationInputIssue } from '../operation-input-schema'

/** Real App inspection/evidence/review path; only the pixel renderer is substituted. */
async function verifySelectedReviewFlow() {
  const hadWindow = 'window' in globalThis
  if (!hadWindow) vi.stubGlobal('window', {})
  const { default: core } = await import('../../src/contexts')
  const { applyPreset, PresetProfiles, PresetDefaults } =
    await import('@asyra/preset')
  const { createAiInspectionAction, createInspectionValidationAction } =
    await import('../../src/ai/inspection')
  const { createInspectionEvidence } =
    await import('../../src/common-apis/inspection-evidence')
  const { observeAiAction } = await import('../../src/ai/runtime-input')
  applyPreset(core, {
    profile: PresetProfiles.CUSTOM,
    defaults: [PresetDefaults.BASIC_SHAPES, PresetDefaults.CONTAINERS]
  })
  core.load({
    version: '1.0.0',
    props: {},
    sceneTree: {
      workspace: 'workspace',
      workspaceList: ['workspace'],
      elements: {
        workspace: {
          id: 'workspace',
          type: 'workspace',
          name: 'Workspace',
          parentId: '',
          children: [],
          visible: true,
          lock: false
        }
      }
    }
  })
  const ids = core.createElementsInParent(
    [
      { type: 'rect', x: 0, y: 0, width: 20, height: 20 },
      { type: 'rect', x: 30, y: 0, width: 20, height: 20 }
    ],
    'workspace'
  )
  const document = await core.save()
  const captures: string[] = []
  let failTarget = ''
  const capture = vi
    .spyOn(core, 'captureElementSnapshot')
    .mockImplementation((id) => {
      captures.push(id)
      if (id === failTarget) throw new Error('Injected pixel capture failure')
      return {
        type: 'snapshot',
        width: 1,
        height: 1,
        bounds: { x: 0, y: 0, width: 20, height: 20 },
        dataUrl:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='
      }
    })
  let invalidate: ((change?: InspectionDependencyChange) => void) | undefined
  const evidence = createInspectionEvidence((listener) => {
    invalidate = listener
    return () => undefined
  })
  const actions = [
    createAiInspectionAction(undefined, evidence),
    createInspectionValidationAction(evidence)
  ].map((definition) => observeAiAction(definition))
  const dispatched: string[] = []
  const tools = createLocalOperationTools(
    actions.map((definition) => createAiToolContract(definition)),
    { modelActions: (v) => v, resolveBatch: (v) => v },
    async (batch) => ({
      context: {},
      actionResults: await Promise.all(
        batch.actions.map(async (action) => {
          dispatched.push(action.name)
          const owner = actions.find((entry) => entry.name === action.name)
          if (!owner) throw new Error('Unexpected mutation dispatch')
          return {
            actionId: action.id,
            actionName: action.name,
            result: (await owner.execute(action.arguments, {
              signal: signals.signal
            } as never)) as never
          }
        })
      )
    }),
    {
      getNativeTools: () =>
        tools.definitions.map((definition) => ({
          ...definition,
          namespace: 'design_operations'
        }))
    }
  )
  const signals = new AbortController()
  let bytes = 0
  let reads = 0
  let queryBytes = 0
  const call = async (
    name: string,
    input: unknown,
    signal = signals.signal
  ) => {
    const definition = tools.definitions.find((entry) => entry.name === name)
    if (!definition) throw new Error('Missing tool ' + name)
    const reply = await invokeLocalTool(tools, definition, input, signal)
    bytes +=
      Buffer.byteLength(JSON.stringify(input)) + Buffer.byteLength(reply.text)
    if (name === 'describe_design_apis') {
      reads++
      queryBytes +=
        Buffer.byteLength(JSON.stringify(input)) + Buffer.byteLength(reply.text)
    }
    return JSON.parse(reply.text)
  }
  const guideReplyBytes: Record<string, number> = {}
  const guide = async (operation: string) => {
    const result = await call('describe_design_apis', {
      names: ['review_drawing'],
      view: 'usage',
      inputScope: { operation }
    })
    expect(result.toolOutcome?.status, JSON.stringify(result)).toBe('success')
    expect(result.contentDelivery).toBeUndefined()
    guideReplyBytes[operation] = Buffer.byteLength(JSON.stringify(result))
    const selected = result.tools[0]
    if (operation !== 'record')
      expect(selected.invocationExample.invocation).toBeDefined()
    else expect(selected.usageGuide.instructions).toContain('next.arguments')
    expect(selected.usageGuide.results).toContain('accepted')
    expect(selected.usageGuide.recovery).toMatch(/replay/i)
    return selected
  }
  const plan = {
    method: 'Inspect independent parts',
    references: [],
    detailRequired: false,
    criteria: {
      appearance: {
        requirement: 'Requested appearance',
        description: 'Actual visible parts',
        verification: 'visual',
        requiredUnits: ['left', 'right']
      },
      material: {
        requirement: 'Material across scales',
        description: 'Overview and local detail',
        verification: 'visual',
        requiredUnits: ['patch']
      },
      overall: {
        requirement: 'Whole drawing',
        description: 'Whole drawing',
        verification: 'visual',
        requiredUnits: []
      }
    }
  }
  const judge = async (
    next: {
      tool: string
      arguments: Record<string, unknown> & { checks: Record<string, unknown>[] }
    },
    final = false
  ) =>
    call(next.tool, {
      ...next.arguments,
      final,
      checks: next.arguments.checks.map((check: object) => ({
        ...check,
        status: 'pass',
        evidence: 'Explicit fixture visual judgment'
      }))
    })
  try {
    await call('define_design_criteria', plan)
    bytes = 0
    reads = 0
    queryBytes = 0
    const menu = await call('describe_design_apis', { query: 'review_drawing' })
    expect(menu.contentDelivery).toBeUndefined()
    expect(menu.tools).toHaveLength(1)
    const choices = menu.tools[0].inputScopes
    expect(choices.operations).toEqual(['record', 'capture', 'bind'])
    expect(choices.nodeTypes).toEqual([])
    expect(choices.selection).toContain('reuse retained images')
    const menuBytes = bytes
    const captureGuide = await guide(
      choices.operations.find((operation: string) => operation === 'capture')
    )
    const invocation = captureGuide.invocationExample.invocation
    const captureArgs = structuredClone(invocation.arguments)
    captureArgs.inspections[0].elementId = ids[0]
    captureArgs.inspections[0].checks = [
      { criterionId: 'appearance', unitId: 'left' }
    ]
    const first = await call(invocation.tool, captureArgs)
    expect(first.reviewOperation).toBe('capture')
    expect(first.accepted).toBe(false)
    expect(first.inspectionIds, JSON.stringify(first)).toHaveLength(1)
    expect(captures).toEqual([ids[0]])
    const recordedLeft = await judge(first.next)
    expect(recordedLeft.recordedChecks[0]).toMatchObject({
      criterionId: 'appearance',
      unitId: 'left',
      status: 'pass'
    })
    expect(recordedLeft.accepted).toBe(false)
    const captureBytes = bytes
    const captureContractBytes = queryBytes
    const baselineContractBytes =
      recorded.savedReviewUsageBytes + recorded.savedFieldPageBytes
    const captureBaselineBytes =
      baselineContractBytes + captureBytes - captureContractBytes
    expect(reads).toBe(2)
    expect(captureBytes).toBeLessThan(
      recorded.savedReviewUsageBytes + recorded.savedFieldPageBytes
    )

    bytes = 0
    queryBytes = 0
    reads = 0
    bytes = menuBytes
    queryBytes = menuBytes
    reads = 1
    const bindGuide = await guide(
      choices.operations.find((operation: string) => operation === 'bind')
    )
    const bind = structuredClone(bindGuide.invocationExample.invocation)
    bind.arguments.bindChecks[0] = {
      criterionId: 'appearance',
      unitId: 'left',
      inspectionIds: first.inspectionIds
    }
    const rebound = await call(bind.tool, bind.arguments)
    expect(rebound.reviewOperation).toBe('bind')
    expect(captures).toEqual([ids[0]])
    const recordExample = rebound.next
    const actualRecord = {
      ...recordExample.arguments,
      checks: recordExample.arguments.checks.map((check: object) => ({
        ...check,
        status: 'pass',
        evidence: 'Explicit reuse judgment'
      }))
    }
    const committed = await call(recordExample.tool, actualRecord)
    expect(committed.reviewOperation).toBe('record')
    expect(committed.accepted).toBe(false)
    expect(captures).toHaveLength(1)
    const reuseBytes = bytes
    const reuseContractBytes = queryBytes
    const reuseBaselineBytes =
      baselineContractBytes + reuseBytes - reuseContractBytes
    expect(reads).toBe(2)
    expect(reuseBytes).toBeLessThan(reuseBaselineBytes)
    const recordGuide = await guide('record')
    expect(recordGuide.invocationExample.available).toBe(false)
    const full = await call('describe_design_apis', {
      names: ['review_drawing']
    })
    // Pagination is legitimate for an explicitly requested full schema.
    let fullValue = full
    let text = ''
    while (fullValue.contentDelivery) {
      text += fullValue.contentDelivery.text
      if (!fullValue.contentDelivery.next) break
      const next = fullValue.contentDelivery.next
      fullValue = await call(next.tool, next.arguments)
    }
    const canonical = (text ? JSON.parse(text) : fullValue).tools[0].inputSchema
    expect(operationInputIssue(actualRecord, canonical)).toBeUndefined()

    // Partial capture keeps the previous successful image and retries only its failed target.
    const beforeRecoveryBytes = bytes
    failTarget = ids[1]
    const mixedArgs = {
      ...captureArgs,
      inspectionIds: first.inspectionIds,
      inspections: [
        {
          elementId: ids[1],
          checks: [{ criterionId: 'appearance', unitId: 'right' }]
        }
      ]
    }
    const mixed = await call(invocation.tool, mixedArgs)
    expect(mixed.toolOutcome.status).toBe('partial')
    expect(mixed.inspectionIds).toEqual(first.inspectionIds)
    failTarget = ''
    const recovered = await call(invocation.tool, {
      ...mixedArgs,
      inspections: mixed.failedInspections.map(
        (entry: { inspection: object }) => entry.inspection
      )
    })
    expect(recovered.toolOutcome.status).toBe('success')
    expect(captures.filter((id) => id === ids[0])).toHaveLength(1)
    expect(recovered.next.requiredInputs).toEqual(['bindChecks'])
    const recoveredBinding = await call(recovered.next.tool, {
      ...recovered.next.arguments,
      bindChecks: [
        {
          criterionId: 'appearance',
          unitId: 'right',
          inspectionIds: recovered.inspectionIds.filter(
            (id: string) => !first.inspectionIds.includes(id)
          )
        }
      ]
    })
    const recordedRight = await judge(recoveredBinding.next)
    expect(recordedRight.coverage.passed).toBe(2)
    expect(recordedRight.accepted).toBe(false)
    const recoveryBytes = bytes - beforeRecoveryBytes
    expect(captureBytes + recoveryBytes).toBeLessThan(
      captureBaselineBytes + recoveryBytes
    )
    const beforeCancel = captures.length
    const cancelled = new AbortController()
    cancelled.abort()
    await expect(
      call(invocation.tool, captureArgs, cancelled.signal)
    ).rejects.toThrow()
    expect(captures).toHaveLength(beforeCancel)
    // Invalid branch mixtures cannot capture or publish a judgment.
    expect(
      operationInputIssue(
        { ...captureArgs, checks: actualRecord.checks },
        canonical
      )
    ).toBeTruthy()
    const invalid = await call(invocation.tool, {
      ...captureArgs,
      checks: actualRecord.checks
    })
    expect(invalid.toolOutcome.status).not.toBe('success')
    expect(captures).toHaveLength(beforeCancel)
    // Projection preserves full schema constraints, both phases and recovery routing.
    for (const operation of ['capture', 'bind', 'record']) {
      const selected = await call('describe_design_apis', {
        names: ['review_drawing'],
        inputScope: { operation }
      })
      let page = selected
      let serialized = ''
      while (page.contentDelivery) {
        serialized += page.contentDelivery.text
        if (!page.contentDelivery.next) break
        const next = page.contentDelivery.next
        page = await call(next.tool, next.arguments)
      }
      const contract = (serialized ? JSON.parse(serialized) : page).tools[0]
        .inputSchema
      const examples = {
        capture: captureArgs,
        bind: bind.arguments,
        record: actualRecord
      }
      const valid = examples[operation as keyof typeof examples]
      expect(operationInputIssue(valid, contract)).toBeUndefined()
      expect(
        operationInputIssue(
          { ...valid, phase: 'structure', final: false },
          contract
        )
      ).toBeTruthy()
      const { final: _final, ...structureInput } = valid
      expect(
        operationInputIssue({ ...structureInput, phase: 'structure' }, contract)
      ).toBeUndefined()
      expect(
        operationInputIssue({ ...valid, unknownField: true }, contract)
      ).toBeTruthy()
    }
    const field = await call('describe_design_apis', {
      names: ['review_drawing'],
      schemaPaths: ['/properties/final']
    })
    expect(field.toolOutcome.status).toBe('success')
    const refreshed = await call(
      'describe_design_apis',
      captureGuide.definition.refresh.arguments
    )
    expect(refreshed.tools[0].usageGuide).toEqual(captureGuide.usageGuide)
    const duplicated = await guide('capture')
    expect(duplicated.usageGuide).toEqual(captureGuide.usageGuide)
    const invalidScope = await call('describe_design_apis', {
      names: ['review_drawing'],
      view: 'usage',
      inputScope: { operation: 'invalid' }
    })
    expect(invalidScope.toolOutcome.status).toBe('failed')
    const correctiveQuery = JSON.parse(
      invalidScope.message.split('Scope guidance: ')[1]
    ).example
    const corrected = await call(
      correctiveQuery.tool,
      correctiveQuery.arguments
    )
    expect(corrected.tools[0].usageGuide).toEqual(captureGuide.usageGuide)
    expect(captures).toHaveLength(beforeCancel)

    const multiscale = await call(invocation.tool, {
      ...captureArgs,
      inspections: ['overview', 'detail'].map((view) => ({
        elementId: ids[0],
        view,
        checks: [{ criterionId: 'material', unitId: 'patch' }]
      }))
    })
    expect(multiscale.next.arguments.checks[0].inspectionIds).toHaveLength(2)
    expect(
      multiscale.next.arguments.checks[0].binding.dependencies
    ).toHaveLength(2)
    const multiPass = await judge(multiscale.next)
    expect(multiPass.recordedChecks[0].status).toBe('pass')
    expect(multiPass.accepted).toBe(false)
    const afterMultiscale = captures.length
    const tampered = structuredClone(multiscale.next.arguments)
    tampered.checks = multiPass.recordedChecks.map(() => ({
      ...multiscale.next.arguments.checks[0],
      status: 'pass',
      evidence: 'Explicit judgment',
      binding: {
        ...multiscale.next.arguments.checks[0].binding,
        signature: 'invalid'
      }
    }))
    const rejected = await call(multiscale.next.tool, tampered)
    expect(rejected.toolOutcome.status).not.toBe('success')
    expect(captures).toHaveLength(afterMultiscale)

    // Independent local dependencies survive an unrelated target edit.
    invalidate?.({ elementIds: [ids[0]] })
    const staleMulti = await judge(multiscale.next)
    expect(staleMulti.toolOutcome.status).not.toBe('success')
    const stale = await call(recordExample.tool, actualRecord)
    expect(stale.toolOutcome.status).not.toBe('success')
    expect(captures).toHaveLength(afterMultiscale)
    const surviving = await judge(recoveredBinding.next)
    expect(surviving.recordedChecks[0].status).toBe('pass')
    expect(surviving.accepted).toBe(false)

    // Exercise the published recovery through real evidence and dispatcher owners.
    // Both declared units change scope; a separate whole-view pass must survive.
    const stable = await call(invocation.tool, {
      phase: 'visual',
      final: false,
      inspections: [{ elementId: ids[1], checks: [{ criterionId: 'overall' }] }]
    })
    await judge(stable.next)
    const beforeScopeChange = await call('read_design_checks', {
      view: 'details',
      includePassed: true
    })
    const savedLookup = await call(
      'describe_design_apis',
      recordedRecovery.bindLookup
    )
    const lookupBytes = Buffer.byteLength(JSON.stringify(savedLookup))
    const readCount = reads
    const beforeScopeBytes = bytes
    const changed = await call(invocation.tool, {
      phase: 'visual',
      final: false,
      inspections: ids.map((elementId, index) => ({
        elementId,
        view: 'detail',
        checks: [
          { criterionId: 'appearance', unitId: ['left', 'right'][index] }
        ]
      }))
    })
    expect(changed.toolOutcome.status, JSON.stringify(changed)).toBe('partial')
    expect(changed.recordedChecks).toEqual([])
    expect(
      operationInputIssue(
        changed,
        (text ? JSON.parse(text) : fullValue).tools[0].partialOutputSchema
      )
    ).toBeUndefined()
    expect(changed.next.requiredInputs).toEqual([
      'bindChecks[0].supersedes.reason',
      'bindChecks[1].supersedes.reason'
    ])
    expect(changed.next.arguments.bindChecks).toEqual(
      ['left', 'right'].map((unitId, index) => ({
        criterionId: 'appearance',
        unitId,
        inspectionIds: [changed.inspectionIds[index]],
        supersedes: {
          revision: beforeScopeChange.items.find(
            (item: { unitId?: string }) => item.unitId === unitId
          ).revision
        }
      }))
    )
    const recoveryStartBytes = bytes
    const captureCount = captures.length
    const retry = structuredClone(changed.next.arguments)
    expect(operationInputIssue(retry, canonical)).toBeTruthy()
    for (const check of retry.bindChecks)
      check.supersedes.reason = 'Inspect the changed local region explicitly'
    expect(operationInputIssue(retry, canonical)).toBeUndefined()
    const aborted = new AbortController()
    aborted.abort()
    await expect(
      call(changed.next.tool, retry, aborted.signal)
    ).rejects.toThrow()
    const retryBinding = await call(changed.next.tool, retry)
    expect(retryBinding.reviewOperation).toBe('bind')
    const recoveryCommitted = await judge(retryBinding.next)
    expect(recoveryCommitted.recordedChecks).toHaveLength(2)
    expect(captures).toHaveLength(captureCount)
    expect(reads).toBe(readCount)
    // The complete retry plus record costs less than the old extra lookup alone.
    const retryBytes = bytes - recoveryStartBytes
    expect(retryBytes).toBeLessThan(lookupBytes)
    // Include the enlarged initial response contract, not only the avoided lookup.
    // The old route also needs the same successful bind/record exchange; omitting
    // its failed capture entirely makes this a conservative baseline lower bound.
    const recoveryDeliveryBytes =
      guideReplyBytes.capture +
      recoveryStartBytes -
      beforeScopeBytes +
      retryBytes
    const recordedRecoveryLowerBoundBytes =
      recordedRecovery.captureUsageReplyBytes +
      recordedRecovery.bindLookupReplyBytes +
      retryBytes
    expect(recoveryDeliveryBytes).toBeLessThan(recordedRecoveryLowerBoundBytes)
    const afterScopeChange = await call('read_design_checks', {
      view: 'details',
      includePassed: true
    })
    expect(
      afterScopeChange.items.find(
        (item: { criterionId: string }) => item.criterionId === 'overall'
      )
    ).toEqual(
      beforeScopeChange.items.find(
        (item: { criterionId: string }) => item.criterionId === 'overall'
      )
    )
    // A stale reason is not silently reused; each conflicting current revision is delivered.
    const staleRetry = await call(changed.next.tool, retry)
    expect(staleRetry.toolOutcome).toMatchObject({
      status: 'failed',
      settlement: 'not-started'
    })
    expect(staleRetry.next.requiredInputs).toEqual(changed.next.requiredInputs)
    expect(staleRetry.next.arguments.bindChecks[0].supersedes).toEqual({
      revision: recoveryCommitted.recordedChecks[0].revision
    })
    invalidate?.({ elementIds: [ids[0]] })
    const expired = await call(changed.next.tool, {
      ...retry,
      bindChecks: [retry.bindChecks[0]]
    })
    expect(expired.toolOutcome.status).not.toBe('success')
    expect(captures).toHaveLength(captureCount)
    expect(bytes - beforeScopeBytes).toBeGreaterThan(retryBytes)
    expect(await core.save()).toEqual(document)
    expect(
      dispatched.every((name) =>
        ['inspect_drawing', 'validate_inspection_evidence'].includes(name)
      )
    ).toBe(true)
    // eslint-disable-next-line no-console -- Formal exchange-size comparison, not latency.
    console.info(
      JSON.stringify({
        reviewUsage: {
          captureToRecordBytes: captureBytes,
          captureContractBytes,
          captureWithRecoveryBytes: captureBytes + recoveryBytes,
          captureWithRecoveryBaselineBytes:
            captureBaselineBytes + recoveryBytes,
          captureBaselineBytes,
          reuseToRecordBytes: reuseBytes,
          reuseContractBytes,
          reuseBaselineBytes,
          savedContractBytes: baselineContractBytes,
          contractReads: 2,
          knownOperationContractReads: 1,
          savedContractReads: recorded.queries.length,
          bindingRecovery: {
            recoveryDeliveryBytes,
            recordedRecoveryLowerBoundBytes,
            captureAndRetryBytes:
              recoveryStartBytes - beforeScopeBytes + retryBytes,
            retryAndRecordBytes: retryBytes,
            avoidedLookupBytes: lookupBytes,
            contractReads: reads - readCount,
            repeatedCaptures: captures.length - captureCount
          }
        }
      })
    )
  } finally {
    capture.mockRestore()
    evidence.dispose()
    if (!hadWindow) vi.unstubAllGlobals()
  }
}

it(
  'executes selected review usage through capture binding and recording without replay',
  verifySelectedReviewFlow
)
