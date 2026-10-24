import { deliverPreparedDesign } from '../prepared-design'
import recoveryFixture from '../../../server/__tests__/fixtures/recorded-101/pattern-budget-recovery-20261023.json'
import { describe, expect, it, vi } from 'vitest'
import { emitBrowserDragPhase, emitDiagnosticCounter } from '@asyra/utils'
import {
  prepareDesign,
  createDesignPreparationSession
} from '../../../server/design-preparation'
import {
  createPreparedDesignAction,
  type PreparedDesignApis
} from '../design-actions'
import type { PreparedDesign } from '../prepared-design'

const fixture = () =>
  prepareDesign(
    {
      type: 'frame',
      name: 'Editorial page',
      width: 800,
      height: 600,
      children: [
        {
          key: 'section',
          name: 'Section',
          type: 'frame',
          width: 700,
          height: 500,
          children: [
            {
              key: 'heading',
              name: 'Heading',
              type: 'text',
              width: 600,
              height: 60,
              text: 'Editable 世界',
              fontSize: 32,
              lineHeight: 40
            }
          ]
        }
      ]
    },
    'application'
  )
const apis = (): PreparedDesignApis => ({
  getWorkspaceId: () => 'workspace',
  getElementMetadata: (id) =>
    id === 'existing'
      ? { type: 'custom-container', parentId: 'workspace' }
      : undefined,
  isContainerType: (type) => type === 'custom-container',
  isLocked: () => false,
  getElementType: () => undefined,
  create: vi.fn((entries) => entries.map((d) => d.id)),
  select: vi.fn()
})
const context = () => ({ signal: new AbortController().signal }) as never
const mutable = () =>
  JSON.parse(JSON.stringify(deliverPreparedDesign(fixture())))

describe('prepared editable design application', () => {
  it('records canonical phase work only during its own creation callbacks', async () => {
    const api = apis()
    api.create = (entries) => {
      emitBrowserDragPhase('scene-tree:element-batch:materialize', 4)
      emitDiagnosticCounter(
        'scene-tree:membership:inserted-items',
        entries.length
      )
      return entries.map((entry) => entry.id)
    }
    const result = await createPreparedDesignAction(api, async () => {
      emitBrowserDragPhase('scene-tree:element-batch:materialize', 1000)
      emitDiagnosticCounter('scene-tree:membership:inserted-items', 1000)
    }).execute({ design: deliverPreparedDesign(fixture()) }, context())
    expect(result).toMatchObject({
      timing: {
        canonicalWork: {
          phases: {
            'scene-tree:element-batch:materialize': { count: 3, totalMs: 12 }
          },
          counters: { 'scene-tree:membership:inserted-items': 3 }
        }
      }
    })
  })

  it('enrolls each native write while leaving cooperative work outside the member', async () => {
    const api = apis()
    let inMutation = false
    let members = 0
    api.create = vi.fn((entries) => {
      expect(inMutation).toBe(true)
      return entries.map((d) => d.id)
    })
    api.select = vi.fn(() => expect(inMutation).toBe(true))
    await createPreparedDesignAction(api, async () => {
      expect(inMutation).toBe(false)
    }).execute(
      { design: deliverPreparedDesign(fixture()) },
      {
        signal: new AbortController().signal,
        runMutation: async (mutate, settled) => {
          members++
          inMutation = true
          try {
            const value = mutate()
            settled?.(value)
            return value
          } finally {
            inMutation = false
          }
        }
      }
    )
    expect(members).toBe(4)
  })

  it('creates ordered native hierarchy, preserves literal text and returns semantic IDs', async () => {
    const api = apis(),
      paint = vi.fn(async () => undefined)
    const design = fixture()
    const result = await createPreparedDesignAction(api, paint).execute(
      { design: deliverPreparedDesign(design) },
      context()
    )
    expect(api.create).toHaveBeenNthCalledWith(
      1,
      [design.entries[0].descriptor],
      'workspace'
    )
    expect(api.create).toHaveBeenNthCalledWith(
      2,
      [design.entries[1].descriptor],
      design.rootId
    )
    expect(api.create).toHaveBeenNthCalledWith(
      3,
      [design.entries[2].descriptor],
      design.entries[1].descriptor.id
    )
    expect(result).toMatchObject({
      status: 'complete',
      compositionId: design.rootId,
      keyToId: design.keyToId
    })
    expect(paint).toHaveBeenCalledTimes(3)
  })
  it('applies an expanded detail stage in ordered cooperative slices through one action', async () => {
    const design = prepareDesign(
      {
        type: 'group',
        name: 'Repeated facade',
        projection: {
          azimuth: 0,
          elevation: 0,
          scale: 1,
          originX: 0,
          originY: 20
        },
        children: [
          {
            type: 'pattern',
            key: 'panes',
            name: 'Panes',
            origin: { x: 0, y: 0, z: 0 },
            axes: [{ count: 1200, step: { x: 10, y: 0, z: 0 } }],
            faces: [
              {
                key: 'face',
                name: 'Face',
                fill: '#123456',
                vertices: [
                  { x: 0, y: 0, z: 0 },
                  { x: 8, y: 0, z: 0 },
                  { x: 8, y: 0, z: 8 },
                  { x: 0, y: 0, z: 8 }
                ]
              }
            ]
          }
        ]
      },
      'large-stage'
    )
    const api = apis(),
      paint = vi.fn(async () => undefined)
    const result = await createPreparedDesignAction(api, paint).execute(
      { design: deliverPreparedDesign(design) },
      context()
    )
    expect(result).toMatchObject({
      status: 'complete',
      timing: { elementCount: 1201, sliceCount: 39 }
    })
    const calls = vi.mocked(api.create).mock.calls
    expect(calls.flatMap(([entries]) => entries.map((e) => e.id))).toEqual(
      design.entries.map((e) => e.descriptor.id)
    )
    expect(calls.every(([entries]) => entries.length <= 32)).toBe(true)
    expect(api.select).toHaveBeenCalledExactlyOnceWith([design.rootId])
    expect(paint).toHaveBeenCalledTimes(39)
  })
  it.each([
    (d: ReturnType<typeof mutable>) => {
      d.version = 99
    },
    (d: ReturnType<typeof mutable>) => {
      d.entries[1].parentId = d.entries[2].descriptor.id
    },
    (d: ReturnType<typeof mutable>) => {
      d.entries[2].descriptor.id = d.rootId
    },
    (d: ReturnType<typeof mutable>) => {
      d.entries[2].descriptor.width = Infinity
    },
    (d: ReturnType<typeof mutable>) => {
      d.entries[2].descriptor.type = 'image'
    },
    (d: ReturnType<typeof mutable>) => {
      d.entries[2].descriptor.fontSize = -2
    },
    (d: ReturnType<typeof mutable>) => {
      d.entries[2].descriptor.props.push('foreign-property')
    },
    (d: ReturnType<typeof mutable>) => {
      d.keyToId = { heading: 'unrelated' }
    },
    (d: ReturnType<typeof mutable>) => {
      d.entries[0].descriptor.children = ['existing']
    }
  ])('rejects malformed whole artifacts before writing', async (change) => {
    const design = mutable()
    change(design)
    const api = apis()
    await expect(
      createPreparedDesignAction(api).execute({ design }, context())
    ).rejects.toThrow()
    expect(api.create).not.toHaveBeenCalled()
  })
  it('admits native cubic topology and rejects disconnected or foreign controls before writes', async () => {
    const make = () =>
      JSON.parse(
        JSON.stringify(
          prepareDesign({
            type: 'frame',
            name: 'Illustration',
            width: 200,
            height: 200,
            children: [
              {
                key: 'petal',
                name: 'Petal',
                type: 'vector',
                width: 100,
                height: 100,
                fill: '#ff8800',
                rings: [
                  [
                    { x: 0, y: 50, outControl: { x: 0, y: 0 } },
                    { x: 100, y: 50, inControl: { x: 100, y: 0 } },
                    { x: 50, y: 100 }
                  ]
                ]
              }
            ]
          })
        )
      )
    const api = apis(),
      action = createPreparedDesignAction(api, async () => undefined)
    await expect(
      action.execute({ design: deliverPreparedDesign(make()) }, context())
    ).resolves.toMatchObject({ status: 'complete' })
    vi.mocked(api.create).mockClear()
    const broken = make(),
      d = broken.entries[1].descriptor
    const segment = Object.keys(d.segments)[0]
    d.segments[segment].inControlId = 'foreign-control'
    await expect(
      action.execute({ design: deliverPreparedDesign(broken) }, context())
    ).rejects.toThrow()
    expect(api.create).not.toHaveBeenCalled()
  })
  it('consumes an isolated snapshot across yields and stops if the target workspace changes', async () => {
    const source = mutable(),
      api = apis()
    const paint = vi.fn(async () => {
      source.entries[2].descriptor.text = 'tampered'
    })
    await createPreparedDesignAction(api, paint).execute(
      { design: source },
      context()
    )
    expect(vi.mocked(api.create).mock.calls[2][0][0].text).toBe('Editable 世界')
    vi.mocked(api.create).mockClear()
    const switchWorkspace = async () => {
      api.getWorkspaceId = () => 'other-workspace'
    }
    await expect(
      createPreparedDesignAction(api, switchWorkspace).execute(
        { design: deliverPreparedDesign(fixture()) },
        context()
      )
    ).rejects.toMatchObject({ receipt: { settlement: 'partial' } })
    expect(api.create).toHaveBeenCalledTimes(1)
  })
  it('rejects collisions and locked workspaces before creating anything', async () => {
    const api = apis(),
      design = fixture()
    api.getElementType = () => 'rect'
    await expect(
      createPreparedDesignAction(api).execute(
        { design: deliverPreparedDesign(design) },
        context()
      )
    ).rejects.toThrow()
    api.getElementType = () => undefined
    api.isLocked = () => true
    await expect(
      createPreparedDesignAction(api).execute(
        { design: deliverPreparedDesign(design) },
        context()
      )
    ).rejects.toThrow()
    expect(api.create).not.toHaveBeenCalled()
  })
  it('does not remove completed work when a later creation fails', async () => {
    const api = apis(),
      design = fixture()
    api.create = vi
      .fn()
      .mockReturnValueOnce([design.rootId])
      .mockImplementationOnce(() => {
        throw new Error('creation failed')
      })
    await expect(
      createPreparedDesignAction(api, async () => undefined).execute(
        { design: deliverPreparedDesign(design) },
        context()
      )
    ).rejects.toMatchObject({ receipt: { settlement: 'partial' } })
    expect(api.create).toHaveBeenCalledTimes(2)
    expect(api.select).not.toHaveBeenCalled()
  })
  it('honors abort before mutation and between chunks', async () => {
    const controller = new AbortController(),
      api = apis(),
      design = fixture()
    const action = createPreparedDesignAction(api, async () =>
      controller.abort()
    )
    await expect(
      action.execute({ design: deliverPreparedDesign(design) }, {
        signal: controller.signal
      } as never)
    ).rejects.toThrow()
    expect(api.create).toHaveBeenCalledTimes(1)
    vi.mocked(api.create).mockClear()
    await expect(
      action.execute({ design: deliverPreparedDesign(design) }, {
        signal: controller.signal
      } as never)
    ).rejects.toThrow()
    expect(api.create).not.toHaveBeenCalled()
  })
  it('batches wide siblings and yields without copying or changing canonical IDs', async () => {
    const api = apis(),
      paint = vi.fn(async () => undefined)
    const design: PreparedDesign = prepareDesign({
      type: 'frame',
      name: 'Library',
      width: 1000,
      height: 1000,
      children: Array.from({ length: 70 }, (_, i) => ({
        key: `item-${i}`,
        name: `Item ${i}`,
        type: 'rect',
        width: 10,
        height: 10,
        fill: '#ffffff'
      }))
    })
    await createPreparedDesignAction(api, paint).execute(
      { design: deliverPreparedDesign(design) },
      context()
    )
    expect(vi.mocked(api.create).mock.calls.map(([ds]) => ds.length)).toEqual([
      1, 32, 32, 6
    ])
    expect(paint).toHaveBeenCalledTimes(4)
  })
})

it('registers prepared application with the conversation runtime', async () => {
  const { createAiRuntimeInput } = await import('../runtime-input')
  const input = createAiRuntimeInput({
    provider: { requestActionBatch: vi.fn() },
    permissionRules: { apply_prepared_design: 'allow' }
  })
  expect(
    input.actionDefinitions.some((a) => a.name === 'apply_prepared_design')
  ).toBe(true)
})

describe('mixed container prepared application', () => {
  it.each([false, true])(
    'applies a Group root (empty=%s) with ordinary canonical batches',
    async (empty) => {
      const design = prepareDesign({
        type: 'group',
        name: 'Artwork',
        children: empty
          ? []
          : [
              {
                key: 'region',
                type: 'frame',
                name: 'Region',
                width: 100,
                height: 80,
                children: [
                  {
                    key: 'parts',
                    type: 'group',
                    name: 'Parts',
                    children: [
                      {
                        key: 'shape',
                        type: 'rect',
                        name: 'Shape',
                        x: 10,
                        y: 20,
                        width: 30,
                        height: 40
                      }
                    ]
                  }
                ]
              }
            ]
      })
      const api = apis()
      await createPreparedDesignAction(api, async () => undefined).execute(
        { design: deliverPreparedDesign(design) },
        context()
      )
      expect(api.create).toHaveBeenCalled()
      expect(api.select).toHaveBeenCalledWith([design.rootId])
    }
  )
  it('rejects forged Group backgrounds rather than pretending they render', async () => {
    const design = JSON.parse(
      JSON.stringify(prepareDesign({ type: 'group', name: 'Empty' }))
    )
    design.entries[0].descriptor.fills = [
      {
        id: `${design.rootId}-fill`,
        type: 'fill',
        kind: 'solid',
        color: '#ffffff',
        opacity: 1,
        visible: true,
        colorFormat: 'hex',
        defaultColorFormat: 'hex',
        gradient: null
      }
    ]
    const api = apis()
    await expect(
      createPreparedDesignAction(api).execute(
        { design: deliverPreparedDesign(design) },
        context()
      )
    ).rejects.toThrow()
    expect(api.create).not.toHaveBeenCalled()
  })
})

it('measures canonical creation separately from cooperative paint waits', async () => {
  let clock = 0
  const api = apis()
  api.create = vi.fn((entries) => {
    clock += 3
    return entries.map((d) => d.id)
  })
  const paint = vi.fn(async () => {
    clock += 5
  })
  const action = createPreparedDesignAction(api, paint, () => clock)
  const result = await action.execute(
    { design: deliverPreparedDesign(fixture()) },
    context()
  )
  expect(result).toMatchObject({
    timing: {
      admissionMs: 0,
      createMs: 9,
      transactionMs: 0,
      selectionMs: 0,
      validationMs: 0,
      orchestrationMs: 0,
      cooperativeYieldMs: 15,
      totalMs: 24,
      sliceCount: 3,
      elementCount: 3
    }
  })
})

it('yields to the host without requiring animation frames between prepared batches', async () => {
  const frame = vi.fn((callback: FrameRequestCallback) => {
    callback(0)
    return 1
  })
  const yieldToHost = vi.fn(async () => undefined)
  vi.stubGlobal('requestAnimationFrame', frame)
  vi.stubGlobal('scheduler', { yield: yieldToHost })
  try {
    await createPreparedDesignAction(apis()).execute(
      { design: deliverPreparedDesign(fixture()) },
      context()
    )
    expect(frame).not.toHaveBeenCalled()
    expect(yieldToHost).toHaveBeenCalledTimes(3)
  } finally {
    vi.unstubAllGlobals()
  }
})

it('returns compact identity evidence without constructing full mapping receipts', async () => {
  const result = await createPreparedDesignAction(
    apis(),
    async () => undefined
  ).execute(
    { design: deliverPreparedDesign(fixture()), response: 'compact' },
    context()
  )
  expect(result).toMatchObject({
    status: 'complete',
    compositionId: fixture().rootId,
    appliedElementCount: 3
  })
  expect(result).not.toHaveProperty('appliedElementIds')
  expect(result).not.toHaveProperty('keyToId')
  expect(result).not.toHaveProperty('roleToElementIds')
})

it.each(['frame', 'group'])(
  'applies a named %s using actual IDs, not a reserved root name',
  async (type) => {
    const design = prepareDesign({
      type,
      key: 'user-chosen-container',
      name: 'User drawing',
      ...(type === 'frame' ? { width: 10, height: 10 } : {}),
      children: []
    })
    const api = apis()
    await createPreparedDesignAction(api).execute(
      { design: deliverPreparedDesign(design) },
      context()
    )
    expect(api.create).toHaveBeenCalledWith(
      [design.entries[0].descriptor],
      'workspace'
    )
    expect(design.rootId).not.toBe('user-chosen-container')
  }
)

it('rejects a forged root identity before any canonical write', async () => {
  const design = mutable()
  design.rootId = 'not-the-created-element'
  const api = apis()
  await expect(
    createPreparedDesignAction(api).execute({ design }, context())
  ).rejects.toThrow()
  expect(api.create).not.toHaveBeenCalled()
})

it('appends a ready part to an existing custom container without recreating earlier parts', async () => {
  const api = apis()
  const part = fixture()
  const result = await createPreparedDesignAction(
    api,
    async () => undefined
  ).execute(
    {
      design: deliverPreparedDesign(part),
      parentId: 'existing',
      response: 'compact'
    },
    context()
  )
  expect(api.create).toHaveBeenNthCalledWith(
    1,
    [part.entries[0].descriptor],
    'existing'
  )
  expect(api.create).toHaveBeenNthCalledWith(
    2,
    [part.entries[1].descriptor],
    part.rootId
  )
  expect(result).toMatchObject({
    compositionId: part.rootId,
    appliedElementCount: 3
  })
})
it.each(['missing', 'leaf', 'outside', 'locked', 'cycle'])(
  'rejects %s continuation parents before writing',
  async (kind) => {
    const api = apis()
    let parentId = 'workspace'
    if (kind === 'outside') parentId = 'other'
    if (kind === 'cycle') parentId = 'existing'
    api.getElementMetadata = (id) =>
      id === 'existing' && kind !== 'missing'
        ? {
            type: kind === 'leaf' ? 'rect' : 'custom-container',
            parentId
          }
        : undefined
    api.isLocked = (id) => kind === 'locked' && id === 'existing'
    await expect(
      createPreparedDesignAction(api).execute(
        { design: deliverPreparedDesign(fixture()), parentId: 'existing' },
        context()
      )
    ).rejects.toThrow()
    expect(api.create).not.toHaveBeenCalled()
  }
)
it('rechecks a continuation parent after each cooperative slice', async () => {
  const api = apis()
  await expect(
    createPreparedDesignAction(api, async () => {
      api.getElementMetadata = () => undefined
    }).execute(
      { design: deliverPreparedDesign(fixture()), parentId: 'existing' },
      context()
    )
  ).rejects.toThrow()
  expect(api.create).toHaveBeenCalledTimes(1)
})

const sharedDesign = () => {
  const session = createDesignPreparationSession()
  const receipt = session.prepare({
    type: 'group',
    name: 'Shared',
    sharedFills: { red: '#ff0000' },
    children: [
      {
        key: 'a',
        name: 'A',
        type: 'rect',
        width: 10,
        height: 10,
        fill: { shared: 'red' }
      },
      {
        key: 'b',
        name: 'B',
        type: 'oval',
        x: 20,
        width: 10,
        height: 10,
        fill: { shared: 'red' }
      }
    ]
  })
  return session.resolve(receipt.artifactId)
}
it('applies prepared shared child IDs without expanding or redefining them', async () => {
  const design = sharedDesign(),
    api = apis()
  await createPreparedDesignAction(api, async () => undefined).execute(
    { design: deliverPreparedDesign(design) },
    context()
  )
  expect(api.create).toHaveBeenLastCalledWith(
    design.entries.slice(1).map((e) => e.descriptor),
    design.rootId
  )
})
it.each(['missing', 'element', 'forward', 'duplicate'])(
  'rejects %s shared references before any canonical writes',
  async (kind) => {
    const design = JSON.parse(JSON.stringify(sharedDesign()))
    const first = design.entries[1].descriptor,
      second = design.entries[2].descriptor
    if (kind === 'missing') second.fills = ['unknown-fill']
    if (kind === 'element') second.fills = [design.rootId]
    if (kind === 'forward') {
      second.fills = [{ ...first.fills[0], id: second.id + '-fill' }]
      first.fills = [second.id + '-fill']
    }
    if (kind === 'duplicate') second.fills = structuredClone(first.fills)
    const api = apis()
    await expect(
      createPreparedDesignAction(api).execute(
        { design: deliverPreparedDesign(design) },
        context()
      )
    ).rejects.toThrow()
    expect(api.create).not.toHaveBeenCalled()
  }
)

it.each([false, true])(
  'default apply reads only live metadata while parents grow - lock=%s',
  async (lockDuringYield) => {
    const { default: core } = await import('../../contexts')
    const { elementApis, selectionApis } = await import('../../common-apis')
    const records = new Map<
      string,
      { type: string; parentId?: string; lock?: boolean; childCount: number }
    >([
      ['workspace', { type: 'workspace', childCount: 8000 }],
      ['existing', { type: 'frame', parentId: 'workspace', childCount: 8000 }]
    ])
    const spies = [
      vi.spyOn(core, 'getCurrentWorkspaceId').mockReturnValue('workspace'),
      vi
        .spyOn(core, 'getElementMetadata')
        .mockImplementation((id) => records.get(id) as never),
      vi.spyOn(core, 'isContainerType').mockReturnValue(true),
      vi
        .spyOn(selectionApis, 'selectElements')
        .mockImplementation(() => undefined),
      vi
        .spyOn(elementApis, 'createElementsInParent')
        .mockImplementation((entries, parentId) => {
          for (const entry of entries)
            records.set(entry.id, { type: entry.type, parentId, childCount: 0 })
          const parent = records.get(parentId)
          if (!parent) throw new Error('Missing canonical parent')
          parent.childCount += entries.length
          return entries.map((entry) => entry.id)
        })
    ]
    const snapshot = vi.spyOn(core, 'getElementData').mockImplementation(() => {
      throw new Error('Full growing parent snapshot is not an admission input')
    })
    let yields = 0
    try {
      const promise = createPreparedDesignAction(undefined, async () => {
        yields++
        const parent = records.get('existing')
        if (!parent) throw new Error('Missing canonical parent')
        if (lockDuringYield) parent.lock = true
      }).execute(
        { design: deliverPreparedDesign(fixture()), parentId: 'existing' },
        context()
      )
      if (lockDuringYield)
        await expect(promise).rejects.toMatchObject({
          receipt: { settlement: 'partial' }
        })
      else expect(await promise).toMatchObject({ status: 'complete' })
      expect(yields).toBeGreaterThan(0)
      expect(snapshot).not.toHaveBeenCalled()
    } finally {
      snapshot.mockRestore()
      spies.forEach((spy) => spy.mockRestore())
    }
  }
)

it('rejects changed reviewed attachment evidence at browser admission before any mutation', async () => {
  const api = apis()
  const attachmentEvidence = {
    parentId: 'workspace',
    workspaceId: 'workspace',
    evidence: { sessionId: 'scene', revision: 4 }
  }
  const evidence = { isCurrent: vi.fn(() => false) }
  const action = createPreparedDesignAction(
    api,
    async () => undefined,
    () => 0,
    evidence
  )
  await expect(
    action.execute(
      { design: deliverPreparedDesign(fixture()), attachmentEvidence },
      context()
    )
  ).rejects.toThrow(/evidence/i)
  expect(api.create).not.toHaveBeenCalled()
  evidence.isCurrent.mockReturnValue(true)
  await expect(
    action.execute(
      {
        design: deliverPreparedDesign(fixture()),
        parentId: 'existing',
        attachmentEvidence
      },
      context()
    )
  ).rejects.toThrow(/parent/i)
  expect(api.create).not.toHaveBeenCalled()
  await expect(
    createPreparedDesignAction(api).execute(
      { design: deliverPreparedDesign(fixture()), attachmentEvidence },
      context()
    )
  ).rejects.toThrow(/evidence/i)
  expect(api.create).not.toHaveBeenCalled()
  api.create = vi.fn((entries) => {
    evidence.isCurrent.mockReturnValue(false)
    return entries.map((entry) => entry.id)
  })
  evidence.isCurrent.mockReturnValue(true)
  expect(
    await action.execute(
      { design: deliverPreparedDesign(fixture()), attachmentEvidence },
      context()
    )
  ).toMatchObject({ status: 'complete' })
  expect(api.create).toHaveBeenCalled()
})

it('checks reviewed evidence inside the mutation callback after queue admission', async () => {
  const api = apis()
  let current = true
  const action = createPreparedDesignAction(
    api,
    async () => undefined,
    () => 0,
    { isCurrent: () => current }
  )
  await expect(
    action.execute(
      {
        design: deliverPreparedDesign(fixture()),
        attachmentEvidence: {
          parentId: 'workspace',
          workspaceId: 'workspace',
          evidence: { sessionId: 'scene', revision: 0 }
        }
      },
      {
        signal: new AbortController().signal,
        runMutation: async (mutate) => {
          current = false
          return mutate()
        }
      }
    )
  ).rejects.toThrow(/evidence/i)
  expect(api.create).not.toHaveBeenCalled()
})

it('continues budget partitions in one canonical root and refuses duplicate application', async () => {
  const session = createDesignPreparationSession()
  const draftId = session.retainRejectedDraft(recoveryFixture.input.draft)
  if (!draftId) throw new Error('Missing retained source')
  const signal = new AbortController().signal
  const firstRepair = { draftId, partition: 0 }
  const first = await session.prepareAsync(
    session.repairDraft(firstRepair),
    signal,
    firstRepair
  )
  const repair = {
    draftId,
    partition: 1,
    continueFromArtifact: first.artifactId
  }
  const later = await session.prepareAsync(
    session.repairDraft(repair),
    signal,
    repair
  )
  const entries = new Map<
    string,
    { type: string; x: number; y: number; rotation?: number }
  >()
  const parents = new Map<string, string>()
  const api: PreparedDesignApis = {
    ...apis(),
    getElementType: (id) => entries.get(id)?.type,
    getElementMetadata: (id) =>
      entries.has(id)
        ? { type: entries.get(id)?.type, parentId: parents.get(id) }
        : undefined,
    getPlacement: (id) => entries.get(id),
    isContainerType: (type) => type === 'group',
    create: (ds, parent) => {
      for (const d of ds) {
        entries.set(d.id, {
          ...structuredClone(d),
          x: Number(d.x),
          y: Number(d.y)
        })
        parents.set(d.id, parent)
      }
      return ds.map((d) => d.id)
    }
  }
  const capture = vi.fn()
  const action = createPreparedDesignAction(
    api,
    async () => undefined,
    () => 0,
    undefined,
    { capture }
  )
  await action.execute(
    { design: deliverPreparedDesign(session.resolve(first.artifactId)) },
    context()
  )
  const rootId = session.resolve(first.artifactId).rootId
  // Model canonical Group bounds normalization, not a user translation.
  const root = entries.get(rootId)
  if (!root) throw new Error('Missing root')
  root.x -= 200
  root.y -= 100
  for (const [id, parent] of parents)
    if (parent === rootId) {
      const member = entries.get(id)
      if (!member) throw new Error('Missing member')
      member.x += 200
      member.y += 100
    }
  const expectedSize = entries.size
  const anchorId = session.resolve(later.artifactId).continuation?.anchor.id
  const anchor = anchorId ? entries.get(anchorId) : undefined
  if (!anchor) throw new Error('Missing continuation anchor')
  const originalRotation = anchor.rotation
  anchor.rotation = (originalRotation ?? 0) + 0.1
  await expect(
    action.execute(
      { design: deliverPreparedDesign(session.resolve(later.artifactId)) },
      context()
    )
  ).rejects.toThrow(/rotation changed/)
  expect(entries.size).toBe(expectedSize)
  anchor.rotation = originalRotation
  root.x += 1
  await expect(
    action.execute(
      { design: deliverPreparedDesign(session.resolve(later.artifactId)) },
      context()
    )
  ).rejects.toThrow(/anchor moved/)
  root.x -= 1
  api.isLocked = (id) => id === rootId
  await expect(
    action.execute(
      { design: deliverPreparedDesign(session.resolve(later.artifactId)) },
      context()
    )
  ).rejects.toThrow(/unavailable/)
  api.isLocked = () => false
  entries.delete(rootId)
  await expect(
    action.execute(
      { design: deliverPreparedDesign(session.resolve(later.artifactId)) },
      context()
    )
  ).rejects.toThrow(/unavailable/)
  entries.set(rootId, root)
  expect(entries.size).toBe(expectedSize)
  const result = await action.execute(
    { design: deliverPreparedDesign(session.resolve(later.artifactId)) },
    context()
  )
  expect(result.compositionId).toBe(rootId)
  expect(capture).toHaveBeenCalledWith(
    rootId,
    [],
    expect.any(AbortSignal),
    true
  )
  expect(entries.size).toBe(13095)
  expect([...parents.values()].filter((id) => id === 'workspace')).toHaveLength(
    1
  )
  expect(
    [...parents]
      .filter(([id]) => id !== rootId)
      .every(([, parent]) => parent === rootId)
  ).toBe(true)
  await expect(
    action.execute(
      { design: deliverPreparedDesign(session.resolve(later.artifactId)) },
      context()
    )
  ).rejects.toThrow(/already exists/)
  expect(entries.size).toBe(13095)
})

it.each(['compact', 'full'] as const)(
  'retains the confirmed prefix after interruption in %s mode',
  async (response) => {
    const design = fixture()
    const api = apis()
    const controller = new AbortController()
    const action = createPreparedDesignAction(api, async () =>
      controller.abort()
    )
    const failure = await action
      .execute(
        { design: deliverPreparedDesign(design), response },
        {
          signal: controller.signal,
          runMutation: async (write, settled) => {
            const result = write()
            settled?.(result)
            return result
          }
        }
      )
      .catch((error: unknown) => error)
    expect(failure).toMatchObject({
      receipt: {
        settlement: 'partial',
        result: {
          status: 'partial',
          compositionId: design.rootId,
          appliedElementCount: 1,
          plannedElementCount: 3,
          appliedRange: { start: 0, end: 1 },
          recovery: expect.stringContaining('Do not replay')
        }
      }
    })
    expect(api.create).toHaveBeenCalledTimes(1)
    expect(api.select).not.toHaveBeenCalled()
    if (response === 'full')
      expect(failure).toMatchObject({
        receipt: {
          result: { appliedElementIds: [design.rootId] }
        }
      })
  }
)

it('retains all acknowledged writes when final selection fails without marking delivery complete', async () => {
  const api = apis()
  api.select = vi.fn(() => {
    throw new Error('Selection interrupted')
  })
  await expect(
    createPreparedDesignAction(api, async () => undefined).execute(
      { design: deliverPreparedDesign(fixture()) },
      context()
    )
  ).rejects.toMatchObject({
    receipt: {
      settlement: 'completed',
      result: {
        status: 'partial',
        appliedElementCount: 3,
        plannedElementCount: 3,
        appliedRange: { start: 0, end: 3 }
      }
    }
  })
  expect(api.create).toHaveBeenCalledTimes(3)
  expect(api.select).toHaveBeenCalledTimes(1)
})
