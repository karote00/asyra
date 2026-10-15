import core from '../../src/contexts'
import { historyApis } from '../../src/common-apis/history'
import { getActiveCollaborationHandle } from '../../src/collaboration/lifecycle'
import { createAiRuntimeInput } from '../../src/ai/runtime-input'
import { createAiTransactionRunner } from '../../src/ai/transaction'
import { basicApiContracts } from '../../src/ai/basic-api-catalog'
import { operationInputIssue } from '../../server/operation-input-schema'
import type { PreparedDesign } from '../../src/ai/prepared-design'
import type { PreparedDrawingArtifact } from '../../src/ai/prepared-drawing-artifact'

// Heterogeneous tool results have independent semantic assertions below.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Result = any
const assert = (ok: unknown, message: string) => {
  if (!ok) throw new Error(message)
}
const equal = (actual: unknown, expected: unknown) =>
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`
  )
interface Usage {
  input: Result
  check(result: Result): void | Promise<void>
}

export const isActionFixtureReady = () => {
  const id = core.getCurrentWorkspaceId()
  const session = getActiveCollaborationHandle()?.getSessionState()
  return (
    !!id &&
    !!core.getElementMetadata(id) &&
    session?.connection === 'connected' &&
    session.sync === 'synced'
  )
}

/** Product owners and middleware are real; no provider/model request is allowed. */
export const runActionUsageCase = async (
  name: string,
  design: PreparedDesign,
  drawing: PreparedDrawingArtifact,
  additional: PreparedDesign
) => {
  const deadline = performance.now() + 10000
  while (!isActionFixtureReady()) {
    if (performance.now() > deadline)
      throw new Error(
        'The document session did not become ready for fixture creation'
      )
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  const runtime = createAiRuntimeInput({
    permissionRules: {},
    provider: {
      requestActionBatch: async () => {
        throw new Error('Unexpected model call')
      }
    }
  })
  const definitions = new Map(
    runtime.actionDefinitions.map((action) => [action.name, action])
  )
  const runner = createAiTransactionRunner()
  const signal = new AbortController().signal
  const invoke = async (
    tool: string,
    input: unknown,
    invocationSignal = signal
  ): Promise<Result> => {
    const action = definitions.get(tool)
    if (!action) throw new Error(`Missing registered tool: ${tool}`)
    return runner.run(tool, (runMutation) =>
      action.execute(input, { signal: invocationSignal, runMutation })
    )
  }
  try {
    const created = await invoke('apply_prepared_design', { design })
    const root = created.compositionId
    const [a, b] = [created.keyToId.a, created.keyToId.b]
    assert(root && a && b, 'Preparation did not publish usable identities')
    const meta = (id: string): Result => core.getElementMetadata(id)
    const props = (id: string): Result =>
      core.getElementComputedData(id, ['x', 'y', 'fills', 'visible'])
    const snapshot = await invoke('read_design_context', {
      scope: 'ids',
      elementIds: [a, b],
      fields: [],
      delivery: 'reference'
    })
    const attachment = await invoke('read_design_attachment', {
      parentId: root
    })
    const cases: Record<string, Usage> = {
      apply_prepared_design: {
        input: { design: additional },
        check: (r) => {
          assert(
            r.status === 'complete' && meta(r.compositionId),
            'Prepared application failed'
          )
          assert(
            r.compositionId !== root,
            'Fresh preparation reused old identity'
          )
        }
      },
      review_design: {
        input: { elementId: root },
        check: (r) => {
          assert(r.complete && !r.truncated, 'Mechanical check is incomplete')
          equal(r.verification.status, 'pass')
          assert(r.checkedElements >= 3, 'Descendants were not checked')
        }
      },
      arrange_design: {
        input: {
          operation: 'align',
          axis: 'vertical',
          alignment: 'start',
          elementIds: [a, b]
        },
        check: () => equal(props(a).y, props(b).y)
      },
      organize_design: {
        input: {
          operation: 'group',
          elementIds: [a, b],
          name: 'Paired surfaces'
        },
        check: () => {
          assert(meta(a).parentId !== root, 'Grouping did not change hierarchy')
          equal(meta(a).parentId, meta(b).parentId)
        }
      },
      update_design_element: {
        input: { elementId: a, name: 'Revised surface' },
        check: () => equal(meta(a).name, 'Revised surface')
      },
      read_design_context: {
        input: {
          scope: 'snapshot',
          snapshotId: snapshot.snapshotId,
          delivery: 'page'
        },
        check: (r) => {
          equal(r.total, 2)
          equal(
            r.elements.map((item: Result) => item.id),
            [a, b]
          )
        }
      },
      resolve_design_targets: {
        input: {
          scope: 'region',
          bounds: { x: 0, y: 0, width: 300, height: 300 },
          filter: { parentId: root }
        },
        check: (r) => {
          equal(r.elementIds.sort(), [a, b].sort())
          assert(!r.snapshotId, 'Transient query retained a snapshot')
        }
      },
      read_design_attachment: {
        input: { parentId: root },
        check: (r) => {
          equal(r.parentId, root)
          equal(r.workspaceId, core.getCurrentWorkspaceId())
          equal(r.basis.length, 3)
        }
      },
      release_design_context: {
        input: { snapshotId: snapshot.snapshotId },
        check: async (r) => {
          equal(r.released, true)
          let failed = false
          try {
            await invoke('read_design_context', {
              scope: 'snapshot',
              snapshotId: snapshot.snapshotId
            })
          } catch {
            failed = true
          }
          assert(failed, 'Released snapshot remained usable')
        }
      },
      map_retained_fills: {
        input: {
          mappings: [
            {
              query: { scope: 'ids', elementIds: [a, b] },
              coordinateSpace: 'parent-local',
              axis: 'x',
              domain: [10, 90],
              index: 0,
              outside: 'clamp',
              stops: [
                { at: 0, color: '#FF0000' },
                { at: 1, color: '#0000FF' }
              ]
            }
          ]
        },
        check: () => {
          equal(props(a).fills[0].color.toLowerCase(), '#ff0000')
          equal(props(b).fills[0].color.toLowerCase(), '#0000ff')
        }
      },
      inspect_drawing: {
        input: { elementId: root },
        check: async (r) => {
          assert(
            r.available && r.image.dataUrl.startsWith('data:image/'),
            'No rendered image'
          )
          const validity = await invoke('validate_inspection_evidence', {
            evidence: r.evidence
          })
          equal(validity.current, true)
        }
      },
      validate_inspection_evidence: {
        input: { evidence: attachment.evidence },
        check: (r) => equal(r.current, true)
      },
      report_outcome: {
        input: { outcome: 'completed', message: 'Editable surfaces completed' },
        check: (r) => {
          equal(r.outcome, 'completed')
          assert(
            r.persistence?.status === 'durable',
            'Completion did not confirm document persistence'
          )
        }
      },
      request_clarification: {
        input: { question: 'Which material should the surface use?' },
        check: (r) =>
          equal(
            r.clarification.question,
            'Which material should the surface use?'
          )
      },
      request_drawing_detail_choice: {
        input: {},
        check: (r) => {
          equal(r.clarification.kind, 'drawing-detail')
          equal(r.clarification.optionIds.length, 2)
        }
      },
      insert_vector_composition: {
        input: drawing,
        check: (r) =>
          assert(meta(r.compositionId), 'Inserted vector group is missing')
      },
      replace_vector_composition: {
        input: { compositionId: root, drawing },
        check: (r) => {
          assert(!meta(root), 'Replaced composition remained')
          assert(meta(r.compositionId), 'Replacement missing')
        }
      },
      remove_ai_composition: {
        input: { compositionId: root },
        check: () => {
          assert(
            !meta(root) && !meta(a) && !meta(b),
            'Removal retained subtree'
          )
        }
      },
      set_element_visibility: {
        input: { elementId: a, visible: false },
        check: () => equal(core.getElementData(a)?.visible, false)
      },
      select_elements: {
        input: { elementIds: [a, b] },
        check: () =>
          equal(core.getSelectedElementIds().slice().sort(), [a, b].sort())
      },
      update_composition_elements: {
        input: { updates: [{ elementId: a, style: { fillColor: '#00FF00' } }] },
        check: () => equal(props(a).fills[0].color, '#00FF00')
      }
    }
    const basics = new Set(basicApiContracts.map((item) => item.name))
    equal(
      [...definitions.keys()].filter((key) => !basics.has(key)).sort(),
      Object.keys(cases).sort()
    )
    const selected = cases[name]
    if (!selected) throw new Error(`No semantic usage case: ${name}`)
    const definition = definitions.get(name)
    if (!definition) throw new Error('Unregistered case')
    const before = JSON.stringify(await core.save())
    const selection = [...core.getSelectedElementIds()]
    for (const [input, abort] of [
      [null, false],
      [selected.input, true]
    ] as const) {
      let rejected = false
      try {
        await invoke(name, input, abort ? AbortSignal.abort() : signal)
      } catch {
        rejected = true
      }
      assert(rejected, `${name} accepted invalid/cancelled input`)
      equal(JSON.stringify(await core.save()), before)
      equal(core.getSelectedElementIds(), selection)
    }
    if (name === 'select_elements') {
      await invoke(name, { elementIds: [b] })
      const saved = JSON.stringify(await core.save())
      const undoDepth = core.getUndoHistoryDepth()
      for (const ids of [
        ['missing-selection-target'],
        [a, 'missing-selection-target'],
        ['missing-selection-target', a]
      ]) {
        let failure: unknown
        try {
          await invoke(name, { elementIds: ids })
        } catch (error) {
          failure = error
        }
        const messages: string[] = []
        while (failure instanceof Error) {
          messages.push(failure.message)
          failure = failure.cause
        }
        assert(
          messages.some(
            (message) =>
              message ===
              'Selection target does not exist: missing-selection-target'
          ),
          'Selection must reject the unavailable target through its execution boundary'
        )
        equal(core.getSelectedElementIds(), [b])
        equal(core.getUndoHistoryDepth(), undoDepth)
        equal(JSON.stringify(await core.save()), saved)
      }
      const recovered = await invoke(name, { elementIds: [a, b] })
      equal(recovered.selectedCount, core.getSelectedElementIds().length)
      equal(core.getSelectedElementIds(), [a, b])
      await historyApis.undo()
      equal(core.getSelectedElementIds(), [b])
      await historyApis.redo()
      equal(core.getSelectedElementIds(), [a, b])
      core.selectElements(selection, { undoable: false })
    }
    const missing = 'missing-tool-usage-target'
    const failures: Record<
      string,
      { input: Result; check?: (r: Result) => void }
    > = {
      apply_prepared_design: { input: { design } },
      review_design: {
        input: { elementId: missing },
        check: (r) =>
          assert(
            !r.complete || r.available === false,
            'Missing review target was certified'
          )
      },
      arrange_design: {
        input: {
          operation: 'align',
          axis: 'vertical',
          alignment: 'start',
          elementIds: [a, missing]
        }
      },
      organize_design: {
        input: { operation: 'group', elementIds: [a, missing] }
      },
      update_design_element: {
        input: { elementId: missing, name: 'Unavailable' }
      },
      read_design_context: {
        input: { scope: 'snapshot', snapshotId: missing }
      },
      resolve_design_targets: {
        input: { ...cases.resolve_design_targets.input, expectedCount: 99 }
      },
      read_design_attachment: { input: { parentId: missing } },
      release_design_context: {
        input: { snapshotId: missing },
        check: (r) => equal(r.released, false)
      },
      map_retained_fills: {
        input: {
          mappings: [
            {
              ...cases.map_retained_fills.input.mappings[0],
              query: { scope: 'ids', elementIds: [missing] }
            }
          ]
        }
      },
      inspect_drawing: {
        input: { elementId: missing },
        check: (r) => equal(r.available, false)
      },
      validate_inspection_evidence: {
        input: { evidence: { ...attachment.evidence, sessionId: missing } },
        check: (r) => equal(r.current, false)
      },
      insert_vector_composition: {
        input: {
          ...drawing,
          groupDescriptor: { ...drawing.groupDescriptor, id: root }
        }
      },
      replace_vector_composition: {
        input: { compositionId: missing, drawing },
        check: (r) => equal(r.appliedElementIds, [])
      },
      remove_ai_composition: {
        input: { compositionId: missing },
        check: (r) => {
          equal(r.status, 'no-change')
          equal(r.appliedElementIds, [])
        }
      },
      set_element_visibility: {
        input: { elementId: missing, visible: false },
        check: (r) => equal(r.changed, false)
      },
      select_elements: {
        input: { elementIds: [missing] },
        check: (r) =>
          equal(
            r.selectedCount,
            core.getSelectedElementIds().filter((id) => meta(id)).length
          )
      },
      update_composition_elements: {
        input: {
          updates: [{ elementId: missing, style: { fillColor: '#00FF00' } }]
        },
        check: (r) => {
          equal(r.status, 'no-change')
          equal(r.appliedElementIds, [])
        }
      }
    }
    const failure = failures[name]
    if (failure) {
      const failureIssue = operationInputIssue(
        failure.input,
        definition.inputSchema
      )
      assert(
        !failureIssue,
        `${name} domain failure must pass structural admission: ${failureIssue}`
      )
      let thrown = false
      let failedResult: Result
      try {
        failedResult = await invoke(name, failure.input)
      } catch (error) {
        thrown = true
        const causes: Error[] = []
        let cause: unknown = error
        while (cause instanceof Error && !causes.includes(cause)) {
          causes.push(cause)
          cause = cause.cause
        }
        assert(
          causes.length > 0 &&
            causes.every(
              (item) =>
                !(item instanceof TypeError) &&
                !(item instanceof ReferenceError)
            ),
          `${name} failed with a programming error instead of a domain rejection`
        )
        const expectedRejections: Record<string, RegExp> = {
          apply_prepared_design: /A design object already exists/,
          review_design: /Inspection dependency no longer exists/,
          inspect_drawing: /Inspection dependency no longer exists/,
          arrange_design: /An arrangement target is unavailable/,
          organize_design: /An organization target is unavailable/,
          update_design_element: /The edit target is unavailable/,
          read_design_context: /Retained query missing/,
          resolve_design_targets: /does not satisfy expectedCount/,
          read_design_attachment:
            /Attachment parent is not an editable container/,
          map_retained_fills: /Retained query lacks complete targets/,
          insert_vector_composition:
            /Element batch requires unique inactive ids/,
          replace_vector_composition:
            /The original drawing is missing or is not an editable composition/,
          select_elements: /Selection target does not exist/
        }
        const expected = expectedRejections[name]
        assert(
          expected && causes.some((item) => expected.test(item.message)),
          `${name} unexpected rejection: ${causes.map((item) => item.message).join(' -> ')}`
        )
      }
      if (!thrown) {
        assert(
          failure.check,
          `${name} unexpectedly accepted a missing/invalid target`
        )
        failure.check?.(failedResult)
      }
      equal(JSON.stringify(await core.save()), before)
      equal(core.getSelectedElementIds(), selection)
    }
    const issue = operationInputIssue(selected.input, definition.inputSchema)
    assert(!issue, `${name} input: ${issue}`)
    const result = await invoke(name, selected.input)
    equal(result.toolOutcome.status, 'success')
    const { actionObservation: _observation, ...receipt } = result
    const outputIssue = operationInputIssue(receipt, definition.outputSchema)
    assert(!outputIssue, `${name} output: ${outputIssue}`)
    await selected.check(result)
    return { name, status: result.toolOutcome.status }
  } finally {
    for (const resource of runtime.ownedResources ?? [])
      await resource.dispose()
  }
}
