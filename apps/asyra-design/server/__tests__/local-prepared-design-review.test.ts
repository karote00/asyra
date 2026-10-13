import { describe, expect, it, vi } from 'vitest'
import { createPreparedDesignReview } from '../local-prepared-design-review'

const signal = () => new AbortController().signal
const setup = () => {
  let current = true
  let requirementRevision = 1
  const recipes = new Map<
    string,
    { recipe: unknown; findings: unknown[]; elementCount: number }
  >([
    [
      'a',
      {
        recipe: {
          type: 'group',
          children: [{ key: 'body', type: 'rect', width: 20, height: 10 }]
        },
        findings: [],
        elementCount: 2
      }
    ]
  ])
  const assess = vi.fn(() => {
    throw new Error('Model execution is forbidden')
  })
  const recipe = (id: string) => {
    const value = recipes.get(id)
    if (!value) throw new Error('Missing fixture recipe')
    return value
  }
  const options = {
    resolveRecipe: (id: string) => {
      const result = recipes.get(id)
      if (!result) throw new Error('Unavailable artifact')
      return result
    },
    context: () => ({
      criteria: {
        shape: { requirement: 'Draw a box' },
        material: { requirement: 'Blue glass' }
      },
      requirementRevision,
      referenceImageIndexes: []
    }),
    resolveAttachment: async (parentId?: string) => ({
      workspaceId: 'workspace',
      parentId: parentId ?? 'workspace',
      evidence: { sessionId: 'scene', revision: 0 },
      basis: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 }
      ]
    }),
    attachmentCurrent: async () => current,
    // A foreign caller cannot reactivate the removed model hook.
    assess
  }
  const owner = createPreparedDesignReview(options)
  return {
    owner,
    options,
    assess,
    recipes,
    recipe,
    invalidate: () => {
      current = false
    },
    changeReferences: () => {
      requirementRevision++
    }
  }
}

describe('tool-only prepared recipe checks', () => {
  it('checks data with no model call and never certifies appearance', async () => {
    const f = setup()
    const first = await f.owner.review({ artifactId: 'a' }, signal())
    expect(first).toMatchObject({
      status: 'pass',
      appearance: 'unverified',
      reused: false,
      finalCanvasReviewRequired: true
    })
    expect(
      first.assessment.checks.every((check) => check.status === 'unverified')
    ).toBe(true)
    expect((await f.owner.review({ artifactId: 'a' }, signal())).reused).toBe(
      true
    )
    expect(f.assess).not.toHaveBeenCalled()
    expect(f.owner.read().counts.pass).toBe(2)
    expect(f.owner.read().items).toEqual([])
    expect(f.owner.read({ includePassed: true }).items).toHaveLength(2)
  })

  it('blocks compiler failures regardless of partial key or criterion coverage', async () => {
    const f = setup()
    f.recipe('a').findings.push({
      kind: 'requirement',
      key: 'body',
      property: 'width',
      expected: 30,
      actual: 20
    })
    const first = await f.owner.review(
      { artifactId: 'a', keys: ['body'], criterionIds: ['material'] },
      signal()
    )
    expect(first.status).toBe('fail')
    expect(() => f.owner.assertApplicable('a')).toThrow(/correction/)
    f.recipes.set('alias', structuredClone(f.recipe('a')))
    expect(
      (await f.owner.review({ artifactId: 'alias' }, signal())).status
    ).toBe('fail')
    expect(f.assess).not.toHaveBeenCalled()
  })

  it('iterates corrected source without losing provenance or invoking a model', async () => {
    const f = setup()
    f.recipe('a').findings.push({ kind: 'overflow', key: 'body' })
    await f.owner.review({ artifactId: 'a' }, signal())
    f.recipes.set('b', {
      recipe: { type: 'rect', key: 'body', width: 10, height: 10 },
      findings: [],
      elementCount: 1
    })
    const next = await f.owner.review(
      { artifactId: 'b', previousArtifactId: 'a' },
      signal()
    )
    expect(next).toMatchObject({
      status: 'pass',
      previousReview: { artifactId: 'a', sourceChanged: true }
    })
    expect(f.owner.read().counts.fail).toBe(0)
    expect(f.owner.assertApplicable('b')?.parentId).toBe('workspace')
    expect(f.assess).not.toHaveBeenCalled()
  })

  it('requires current parent and source evidence before applying', async () => {
    const f = setup()
    await f.owner.review({ artifactId: 'a', parentId: 'parent' }, signal())
    expect(() => f.owner.assertApplicable('a', 'other')).toThrow(/parent/)
    f.changeReferences()
    expect(() => f.owner.assertApplicable('a', 'parent')).toThrow(/evidence/)
    await f.owner.review({ artifactId: 'a', parentId: 'parent' }, signal())
    f.recipe('a').recipe = { type: 'rect', width: 42 }
    expect(() => f.owner.assertApplicable('a', 'parent')).toThrow(/recipe/)
  })

  it('invalidates selected-part reuse when containing source changes', async () => {
    const f = setup()
    await f.owner.review({ artifactId: 'a', keys: ['body'] }, signal())
    const source = f.recipe('a').recipe as { x?: number }
    source.x = 100
    expect(
      (await f.owner.review({ artifactId: 'a', keys: ['body'] }, signal()))
        .reused
    ).toBe(false)
  })

  it('reports stale attachments and does not approve them', async () => {
    const f = setup()
    f.invalidate()
    expect(
      (await f.owner.review({ artifactId: 'a' }, signal())).evidenceCurrent
    ).toBe(false)
    expect(f.owner.read().counts.stale).toBe(1)
    expect(() => f.owner.assertApplicable('a')).toThrow(/changed/)
    expect(f.assess).not.toHaveBeenCalled()
  })

  it('rejects missing, ambiguous and cancelled inputs without model fallback', async () => {
    const f = setup()
    for (const args of [
      { artifactId: 'missing' },
      { artifactId: 'a', keys: ['missing'] },
      { artifactId: 'a', criterionIds: ['missing'] },
      { artifactId: 'a', previousArtifactId: 'a' }
    ])
      await expect(f.owner.review(args, signal())).rejects.toThrow()
    f.recipe('a').recipe = {
      children: [{ key: 'body' }, { key: 'body' }]
    }
    await expect(
      f.owner.review({ artifactId: 'a', keys: ['body'] }, signal())
    ).rejects.toThrow(/ambiguous/)
    const controller = new AbortController()
    controller.abort()
    await expect(
      f.owner.review({ artifactId: 'a' }, controller.signal)
    ).rejects.toThrow()
    expect(f.assess).not.toHaveBeenCalled()
  })
})

it('rejects known compiler failures even when the caller omits an explicit review', () => {
  const f = setup()
  f.recipe('a').findings.push({
    kind: 'requirement',
    key: 'body',
    expected: 30,
    actual: 20
  })
  expect(() => f.owner.assertApplicable('a')).toThrow(/correction/)
  expect(f.assess).not.toHaveBeenCalled()
})

it('refreshes each retained parent receipt without replacing it with workspace evidence', async () => {
  const fixture = setup()
  fixture.recipes.set('b', structuredClone(fixture.recipe('a')))
  const invalid = new Set<string>()
  const resolveAttachment = vi.fn(async (parentId?: string) => ({
    ...(await fixture.options.resolveAttachment(parentId)),
    evidence: {
      sessionId: 'scene',
      revision: 0,
      receiptId: `parent:${parentId}`
    }
  }))
  const attachmentCurrent = vi.fn(
    async (attachment: { parentId: string }) =>
      !invalid.has(attachment.parentId)
  )
  const owner = createPreparedDesignReview({
    ...fixture.options,
    resolveAttachment,
    attachmentCurrent
  })
  await owner.review({ artifactId: 'a', parentId: 'tier-a' }, signal())
  await owner.review({ artifactId: 'b', parentId: 'tier-b' }, signal())
  const before = owner.read({ includePassed: true })
  resolveAttachment.mockClear()
  attachmentCurrent.mockClear()
  await owner.refresh(signal())
  expect(owner.read({ includePassed: true })).toEqual(before)
  expect(resolveAttachment).not.toHaveBeenCalled()
  expect(
    attachmentCurrent.mock.calls.map(([attachment]) => attachment.parentId)
  ).toEqual(['tier-a', 'tier-b'])
  attachmentCurrent.mockClear()
  await owner.refresh(signal(), new Set(['attachment:b']))
  expect(
    attachmentCurrent.mock.calls.map(([attachment]) => attachment.parentId)
  ).toEqual(['tier-b'])
  attachmentCurrent.mockClear()
  attachmentCurrent.mockImplementation(async (attachment) => {
    if (attachment.parentId === 'tier-a')
      throw new Error('One receipt unavailable')
    return true
  })
  await owner.refresh(signal())
  expect(
    attachmentCurrent.mock.calls.map(([attachment]) => attachment.parentId)
  ).toEqual(['tier-a', 'tier-b'])
  expect(owner.read().items.map((item) => item.id)).toEqual([
    'prepared:a:attachment'
  ])
  expect(
    owner
      .read({ includePassed: true })
      .items.find((item) => item.id === 'prepared:b:attachment')
  ).toEqual(before.items.find((item) => item.id === 'prepared:b:attachment'))
})

it('does not retain a current attachment claim when its validity check fails', async () => {
  const fixture = setup()
  let fail = false
  const owner = createPreparedDesignReview({
    ...fixture.options,
    attachmentCurrent: async () => {
      if (fail) throw new Error('Evidence transport failed')
      return true
    }
  })
  await owner.review({ artifactId: 'a' }, signal())
  fail = true
  await expect(owner.refresh(signal())).resolves.toBeUndefined()
  expect(owner.read().items).toEqual([
    expect.objectContaining({ id: 'prepared:a:attachment', status: 'stale' })
  ])
})

it('reuses automatically published compiler checks and explicitly continues a corrected source obligation', async () => {
  const { createDesignPreparationSession } =
    await import('../design-preparation')
  const session = createDesignPreparationSession()
  const f = setup()
  const owner = createPreparedDesignReview({
    ...f.options,
    results: session.checkResults,
    resolveRecipe: session.recipe
  })
  const draft = {
    type: 'frame',
    name: 'Frame',
    width: 10,
    height: 10,
    children: [
      { key: 'part', type: 'rect', name: 'Part', x: 20, width: 10, height: 10 }
    ]
  }
  const initial = session.prepare(draft)
  const before = owner.read({ includePassed: true }).items[0]
  expect(before.status).toBe('fail')
  await owner.review({ artifactId: initial.artifactId }, signal())
  expect(
    owner
      .read({ includePassed: true })
      .items.find((item) => item.id === before.id)
  ).toEqual(before)
  expect(owner.read({ includePassed: true }).items).toHaveLength(2)
  const corrected = session.prepare({ ...draft, width: 40 })
  await owner.review(
    {
      artifactId: corrected.artifactId,
      previousArtifactId: initial.artifactId
    },
    signal()
  )
  expect(owner.read()).toMatchObject({
    counts: { pass: 2, fail: 0, stale: 0, unverified: 0 },
    items: []
  })
  expect(owner.read({ includePassed: true }).items).toHaveLength(2)
  expect(f.assess).not.toHaveBeenCalled()
  await expect(
    owner.review({ artifactId: initial.artifactId }, signal())
  ).rejects.toThrow(/superseded/)
})
