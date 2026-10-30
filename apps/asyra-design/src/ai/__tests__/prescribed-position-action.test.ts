import { AiExecutionError } from '@asyra/ai-agent-runtime'
import { expect, it, vi } from 'vitest'
vi.mock('../../contexts', () => ({ default: {} }))
vi.mock('../../common-apis/element', () => ({ elementApis: {} }))
vi.mock('../../common-apis/fills', () => ({ fillApis: {} }))
vi.mock('../../common-apis/strokes', () => ({ strokeApis: {} }))
import { createDesignElementEditPreparer } from '../../common-apis/design-edit'
import { createPrescribedPositionAction } from '../prescribed-position-action'
import { createDesignReviewer } from '../../common-apis/design-review'

const fixture = () => {
  const records: Record<
    string,
    { type: string; parentId?: string; lock?: boolean }
  > = {
    workspace: { type: 'workspace' },
    parent: { type: 'frame', parentId: 'workspace' },
    a: { type: 'rect', parentId: 'parent' },
    b: { type: 'rect', parentId: 'parent' }
  }
  const properties = vi.fn()
  const prepare = createDesignElementEditPreparer({
    getData: (id) => records[id],
    getComputed: () => ({ x: 80, y: 10, width: 20, height: 20 }),
    properties,
    rename: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn()
  })
  const isCurrent = vi.fn(() => true)
  const isAttachmentCurrent = vi.fn(() => true)
  const action = createPrescribedPositionAction(
    { isCurrent },
    { isAttachmentCurrent },
    { read: (id) => records[id], prepare, workspace: () => 'workspace' }
  )
  const attachmentEvidence = {
    parentId: 'parent',
    workspaceId: 'workspace',
    evidence: { sessionId: 's', revision: 1 }
  }
  const input = {
    evidence: [{ sessionId: 's', revision: 1 }],
    positions: ['a', 'b'].map((elementId) => ({
      elementId,
      x: 10,
      y: 10,
      attachmentEvidence
    }))
  }
  const context = {
    signal: new AbortController().signal,
    runMutation: async (work: () => unknown) => work()
  }
  return {
    records,
    properties,
    action,
    isCurrent,
    isAttachmentCurrent,
    input,
    context
  }
}

it('preflights every canonical edit before the first write and rejects queue-time changes', async () => {
  const f = fixture()
  f.records.b.lock = true
  await expect(f.action.execute(f.input, f.context as never)).rejects.toThrow(
    /locked/
  )
  expect(f.properties).not.toHaveBeenCalled()
  f.records.b.lock = false
  f.context.runMutation = async (work) => {
    f.isCurrent.mockReturnValue(false)
    return work()
  }
  await expect(f.action.execute(f.input, f.context as never)).rejects.toThrow(
    /expired/
  )
  expect(f.properties).not.toHaveBeenCalled()
})

it('requires the exact parent basis and reports acknowledged edits without certifying appearance', async () => {
  const f = fixture()
  f.records.b.parentId = 'workspace'
  await expect(f.action.execute(f.input, f.context as never)).rejects.toThrow(
    /parent/
  )
  expect(f.properties).not.toHaveBeenCalled()
  f.records.b.parentId = 'parent'
  expect(await f.action.execute(f.input, f.context as never)).toMatchObject({
    status: 'complete',
    appliedElementIds: ['a', 'b']
  })
  expect(f.properties.mock.calls).toEqual([
    ['a', { x: 10 }],
    ['b', { x: 10 }]
  ])
})

it('reports preflight rejection as not-started but never classifies a writer failure as no-write', async () => {
  const f = fixture()
  f.records.b.lock = true
  await expect(
    f.action.execute(f.input, f.context as never)
  ).rejects.toMatchObject({
    name: 'AiToolContractError',
    stage: 'input'
  })
  expect(f.properties).not.toHaveBeenCalled()
  f.records.b.lock = false
  const failure = new Error('Canonical write interrupted')
  f.properties.mockImplementation(() => {
    throw failure
  })
  await expect(f.action.execute(f.input, f.context as never)).rejects.toBe(
    failure
  )
})

it('consumes real mechanical receipts independently of the attachment owner and refuses retired receipts before writing', async () => {
  const f = fixture()
  let changed: (() => void) | undefined
  const reviewer = createDesignReviewer(
    {
      read: () => ({ type: 'frame' }),
      computed: () => ({ x: 0, y: 0, width: 100, height: 100, rotation: 0 }),
      measure: () => [],
      observeChanges(listener) {
        changed = listener
        return () => undefined
      }
    },
    async () => undefined,
    true
  )
  const attachmentOwner = {
    isCurrent: vi.fn((_stamp: unknown) => false),
    isAttachmentCurrent: vi.fn(() => true)
  }
  const write = vi.fn(() => ({ appliedElementIds: ['a'] }))
  const prepare = vi.fn(() => write)
  const action = createPrescribedPositionAction(reviewer, attachmentOwner, {
    read: (id) => f.records[id],
    workspace: () => 'workspace',
    prepare: prepare as never
  })
  try {
    const captured = await reviewer.capture('parent')
    if (!captured.evidence) throw new Error('Expected mechanical evidence')
    const input = {
      evidence: [captured.evidence],
      positions: [f.input.positions[0]]
    }
    expect(reviewer.isCurrent(captured.evidence)).toBe(true)
    expect(attachmentOwner.isCurrent(captured.evidence)).toBe(false)
    await expect(
      action.execute(input, f.context as never)
    ).resolves.toMatchObject({
      status: 'complete',
      appliedElementIds: ['a']
    })
    expect(write).toHaveBeenCalledOnce()
    write.mockClear()
    prepare.mockClear()
    const foreign = {
      ...input,
      evidence: [{ ...captured.evidence, sessionId: 'foreign' }]
    }
    await expect(action.execute(foreign, f.context as never)).rejects.toThrow(
      /Mechanical check evidence expired/
    )
    attachmentOwner.isAttachmentCurrent.mockReturnValue(false)
    await expect(action.execute(input, f.context as never)).rejects.toThrow(
      /attachment evidence expired/
    )
    attachmentOwner.isAttachmentCurrent.mockReturnValue(true)
    changed?.()
    await expect(action.execute(input, f.context as never)).rejects.toThrow(
      /Mechanical check evidence expired/
    )
    expect(prepare).not.toHaveBeenCalled()
    expect(write).not.toHaveBeenCalled()
  } finally {
    reviewer.dispose()
  }
})

it('rejects attachment changes and cancellation inside mutation admission without preparing or applying edits', async () => {
  const f = fixture()
  f.context.runMutation = async (work) => {
    f.isAttachmentCurrent.mockReturnValue(false)
    return work()
  }
  await expect(f.action.execute(f.input, f.context as never)).rejects.toThrow(
    /attachment evidence expired/
  )
  expect(f.isCurrent).toHaveBeenCalled()
  expect(f.properties).not.toHaveBeenCalled()
  const controller = new AbortController()
  f.isAttachmentCurrent.mockClear()
  f.context.signal = controller.signal
  f.context.runMutation = async (work) => {
    controller.abort(new Error('Cancelled before mutation'))
    return work()
  }
  await expect(
    f.action.execute(f.input, f.context as never)
  ).rejects.toBeInstanceOf(AiExecutionError)
  expect(f.isAttachmentCurrent).not.toHaveBeenCalled()
  expect(f.properties).not.toHaveBeenCalled()
})
