import { expect, it, vi } from 'vitest'
vi.mock('../../contexts', () => ({ default: {} }))
vi.mock('../../common-apis/element', () => ({ elementApis: {} }))
vi.mock('../../common-apis/fills', () => ({ fillApis: {} }))
vi.mock('../../common-apis/strokes', () => ({ strokeApis: {} }))
import { createDesignElementEditPreparer } from '../../common-apis/design-edit'
import { createPrescribedPositionAction } from '../prescribed-position-action'

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
  const action = createPrescribedPositionAction(
    { isCurrent, isAttachmentCurrent: isCurrent } as never,
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
  return { records, properties, action, isCurrent, input, context }
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
