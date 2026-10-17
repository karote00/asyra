import recordedReferences from './fixtures/recorded-101/reference-uses-20261017.json'
import { describe, expect, it } from 'vitest'
import { createReferenceDecisions } from '../local-reference-decisions'
const identities = [
  {
    attachmentIndex: 1,
    referenceId: 'reference:immutable-image',
    validation: { width: 100, height: 200 }
  }
]
const setup = () => {
  const owner = createReferenceDecisions()
  owner.setRequirements({
    detail: { requiredUnits: ['entrance', 'crown'] },
    view: {}
  })
  return owner
}
const use = (id = 'entrance') => ({
  id,
  criterionId: 'detail',
  unitId: id,
  purpose: 'visual',
  region: { x: 10, y: 20, width: 30, height: 40 },
  limitations: []
})
const decision = (uses = [use()]) => ({
  referenceId: identities[0].referenceId,
  status: 'accepted',
  reason: 'The primary agent assessed this exact area.',
  uses
})
const update = (owner: ReturnType<typeof setup>, value: unknown = decision()) =>
  owner.update(() => identities, {
    requirementRevision: 1,
    referenceDecisions: [value]
  })
describe('explicit reference uses', () => {
  it('rejects recorded criterion-only acceptance without altering retained state', () => {
    const owner = setup()
    expect(() =>
      update(owner, {
        referenceId: identities[0].referenceId,
        status: 'accepted',
        reason: 'Recorded source accepted',
        criterionIds: ['detail'],
        limitations: []
      })
    ).toThrow()
    expect(owner.snapshot()).toEqual([])
  })
  it('issues exact request-bound use receipts and preserves independent revisions', () => {
    const owner = setup()
    update(owner, decision([use(), use('crown')]))
    const [entry] = owner.snapshot()
    const entrance = entry.uses[0].receipt
    const crown = entry.uses[1].receipt
    expect(
      owner.resolve(entrance, 'visual', {
        criterionId: 'detail',
        unitId: 'entrance'
      }).region
    ).toEqual(use().region)
    expect(() =>
      owner.resolve(entrance, 'visual', {
        criterionId: 'detail',
        unitId: 'crown'
      })
    ).toThrow()
    expect(() => owner.resolve(entrance, 'preparation')).toThrow()
    update(
      owner,
      decision([
        { ...use(), region: { x: 10, y: 20, width: 31, height: 40 } },
        use('crown')
      ])
    )
    expect(() => owner.resolve(entrance, 'visual')).toThrow()
    expect(owner.resolve(crown, 'visual').receipt).toEqual(crown)
    const other = setup()
    update(other, decision([use(), use('crown')]))
    expect(() => other.resolve(crown, 'visual')).toThrow()
  })
  it('preserves use revisions when explanation or declaration order changes', () => {
    const owner = setup()
    update(owner, decision([use(), use('crown')]))
    const receipts = owner.snapshot()[0].uses.map((item) => item.receipt)
    const changed = update(owner, {
      ...decision([use('crown'), use()]),
      reason: 'Clarified primary-agent explanation only'
    })
    expect(changed.changedDependencies).toEqual([])
    for (const receipt of receipts)
      expect(owner.resolve(receipt, 'visual').receipt).toEqual(receipt)
  })
  it('validates every declaration atomically and allows explicit whole image', () => {
    const owner = setup()
    update(owner)
    const before = owner.snapshot()
    expect(() =>
      update(
        owner,
        decision([
          use(),
          { ...use('crown'), region: { x: 99, y: 0, width: 2, height: 1 } }
        ])
      )
    ).toThrow()
    expect(owner.snapshot()).toEqual(before)
    update(owner, {
      ...decision(),
      uses: [
        {
          id: 'view',
          criterionId: 'view',
          purpose: 'visual',
          region: 'whole',
          limitations: []
        }
      ]
    })
    expect(owner.snapshot()[0].uses[0].pixels).toEqual({
      width: 100,
      height: 200
    })
  })
  it('retires rejected uses without losing bytes and rejects stale requirement receipts', () => {
    const owner = setup()
    update(owner)
    const receipt = owner.snapshot()[0].uses[0].receipt
    update(owner, { ...decision([]), status: 'rejected' })
    expect(() => owner.resolve(receipt, 'visual')).toThrow()
    expect(owner.snapshot()[0].referenceId).toBe(identities[0].referenceId)
    update(owner)
    const current = owner.snapshot()[0].uses[0].receipt
    owner.setRequirements({ detail: { requiredUnits: ['entrance'] } })
    expect(() => owner.resolve(current, 'visual')).toThrow()
  })
})

import { createLocalDesignReview } from '../local-design-review'
import { createPreparedDesignReview } from '../local-prepared-design-review'
import { createDesignCheckResults } from '../design-check-results'

describe('reference use downstream integration', () => {
  const setupReview = () => {
    const results = createDesignCheckResults()
    const review = createLocalDesignReview({
      results,
      validateReferences: () => identities
    })
    review.record({
      phase: 'plan',
      method: 'Review exact parts',
      references: [],
      detailRequired: false,
      criteria: {
        view: {
          requirement: 'Whole view',
          description: 'Whole',
          verification: 'visual',
          requiredUnits: []
        },
        detail: {
          requirement: 'Local detail',
          description: 'Parts',
          verification: 'visual',
          requiredUnits: ['entrance', 'crown']
        }
      }
    })
    const select = (uses = [use(), use('crown')]) =>
      review.selectReferences([1], {
        requirementRevision: 1,
        referenceDecisions: [decision(uses)]
      })
    const receipts = () =>
      review
        .correctionContext()
        .referenceDecisions[0].uses.map((item) => item.receipt)
    select()
    return { review, results, select, receipts }
  }
  it('invalidates only the selected local use and rejects a late bound judgment without clearing independent passes', () => {
    const { review, select, receipts } = setupReview()
    const whole = review.inspect('tower', true, true)?.inspectionId
    const entrance = review.inspect('entrance', true, false, {
      x: 0,
      y: 0,
      width: 20,
      height: 20
    })?.inspectionId
    const crown = review.inspect('crown', true, false, {
      x: 0,
      y: 0,
      width: 20,
      height: 20
    })?.inspectionId
    if (!whole || !entrance || !crown)
      throw new Error('Fixture capture unavailable')
    const bound = review.bindReview('visual', [
      { criterionId: 'view', inspectionIds: [whole] },
      {
        criterionId: 'detail',
        unitId: 'entrance',
        inspectionIds: [entrance],
        referenceUses: [receipts()[0]]
      },
      {
        criterionId: 'detail',
        unitId: 'crown',
        inspectionIds: [crown],
        referenceUses: [receipts()[1]]
      }
    ])
    const submit = {
      ...bound,
      final: true,
      checks: bound.checks.map((item) => ({
        ...item,
        status: 'pass',
        evidence: 'Observed exact source correspondence'
      }))
    }
    expect(review.recordBoundReview(submit)).toMatchObject({ accepted: true })
    const independent = review
      .readChecks({ includePassed: true })
      .items.filter((item) => item.unitId !== 'entrance')
    const late = review.bindReview('visual', [
      {
        criterionId: 'detail',
        unitId: 'entrance',
        inspectionIds: [entrance],
        referenceUses: [receipts()[0]]
      }
    ])
    select([
      { ...use(), region: { x: 11, y: 20, width: 30, height: 40 } },
      use('crown')
    ])
    expect(
      review
        .readChecks({ includePassed: true })
        .items.filter((item) => item.unitId !== 'entrance')
    ).toEqual(independent)
    expect(review.readChecks().items).toMatchObject([
      { unitId: 'entrance', status: 'stale' }
    ])
    expect(() =>
      review.recordBoundReview({
        ...late,
        checks: late.checks.map((item) => ({
          ...item,
          status: 'pass',
          evidence: 'Late'
        }))
      })
    ).toThrow(/stale/)
    const repaired = review.bindReview('visual', [
      {
        criterionId: 'detail',
        unitId: 'entrance',
        inspectionIds: [entrance],
        referenceUses: [receipts()[0]]
      }
    ])
    expect(
      review.recordBoundReview({
        ...repaired,
        final: true,
        checks: repaired.checks.map((item) => ({
          ...item,
          status: 'pass',
          evidence: 'Updated entrance only'
        }))
      })
    ).toMatchObject({ accepted: true })
    expect(
      review
        .readChecks({ includePassed: true })
        .items.filter((item) => item.unitId !== 'entrance')
    ).toEqual(independent)
  })
  it('retains an independent unit when a shared fact changes only its entrance use binding', () => {
    const { review } = setupReview()
    const select = (width = 30) =>
      review.selectReferences([1], {
        requirementRevision: 1,
        referenceDecisions: [
          decision([
            {
              ...use(),
              purpose: 'fact',
              region: { x: 10, y: 20, width, height: 40 }
            },
            { ...use('crown'), purpose: 'fact' }
          ])
        ]
      })
    select()
    const receipts = () =>
      review
        .correctionContext()
        .referenceDecisions[0].uses.map((item) => item.receipt)
    const fact = {
      id: 'facade',
      statement: 'Observed source facade',
      scope: 'Source only',
      sources: [identities[0].referenceId],
      verification: 'Primary agent observed the image',
      dependencies: [{ key: 'source-facade', version: '1' }]
    }
    const binding = (
      unitId: string,
      receipt: ReturnType<typeof receipts>[number]
    ) => ({
      factId: 'facade',
      criterionId: 'detail',
      unitId,
      elementIds: [unitId],
      referenceUses: [receipt]
    })
    review.record({
      phase: 'facts',
      facts: [fact],
      factBindings: [
        binding('entrance', receipts()[0]),
        binding('crown', receipts()[1])
      ]
    })
    const capture = (id: string, overview = false) => {
      const image = review.inspect(id, true, overview)
      if (!image) throw new Error('Missing fixture capture')
      return image.inspectionId
    }
    const whole = capture('tower', true),
      entrance = capture('entrance'),
      crown = capture('crown')
    const pass = (selections: Parameters<typeof review.bindReview>[1]) => {
      const bound = review.bindReview('visual', selections)
      return review.recordBoundReview({
        ...bound,
        final: true,
        checks: bound.checks.map((item) => ({
          ...item,
          status: 'pass',
          evidence: 'Observed matching source'
        }))
      })
    }
    pass([
      { criterionId: 'view', inspectionIds: [whole] },
      { criterionId: 'detail', unitId: 'entrance', inspectionIds: [entrance] },
      { criterionId: 'detail', unitId: 'crown', inspectionIds: [crown] }
    ])
    const before = review
      .readChecks({ includePassed: true })
      .items.find((item) => item.unitId === 'crown')
    select(31)
    expect(
      review
        .readChecks({ includePassed: true })
        .items.find((item) => item.unitId === 'crown')
    ).toEqual(before)
    expect(() =>
      pass([{ criterionId: 'detail', unitId: 'crown', inspectionIds: [crown] }])
    ).not.toThrow()
    review.record({
      phase: 'facts',
      factBindings: [binding('entrance', receipts()[0])]
    })
    expect(
      review
        .readChecks({ includePassed: true })
        .items.find((item) => item.unitId === 'crown')
    ).toEqual(before)
    expect(
      pass([
        { criterionId: 'detail', unitId: 'entrance', inspectionIds: [entrance] }
      ])
    ).toMatchObject({ accepted: true })
  })
  it('keeps preparation independent of unrelated uses and refuses changed use at apply admission', async () => {
    const { review, results } = setupReview()
    const sourceUse = (id: string, unitId: string) => ({
      ...use(unitId),
      id,
      purpose: 'preparation'
    })
    const select = (width = 30) =>
      review.selectReferences([1], {
        requirementRevision: 1,
        referenceDecisions: [
          decision([
            {
              ...sourceUse('prepare-entry', 'entrance'),
              region: { x: 10, y: 20, width, height: 40 }
            },
            sourceUse('prepare-crown', 'crown')
          ])
        ]
      })
    select()
    const receipts = review
      .correctionContext()
      .referenceDecisions[0].uses.map((item) => item.receipt)
    const owner = createPreparedDesignReview({
      results,
      resolveRecipe: () => ({
        recipe: { type: 'rect', width: 10, height: 20 },
        findings: [],
        elementCount: 1
      }),
      context: (uses) => review.preparationContext(uses),
      resolveAttachment: async () => ({
        workspaceId: 'workspace',
        parentId: 'workspace',
        basis: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 0, y: 1 }
        ],
        evidence: { sessionId: 'source-use', revision: 1 }
      }),
      attachmentCurrent: async () => true
    })
    const signal = new AbortController().signal
    await owner.review(
      { artifactId: 'entry', referenceUses: [receipts[0]] },
      signal
    )
    await owner.review(
      { artifactId: 'crown', referenceUses: [receipts[1]] },
      signal
    )
    select(31)
    expect(() => owner.assertApplicable('entry')).toThrow(/stale/)
    expect(() => owner.assertApplicable('crown')).not.toThrow()
    expect(
      await owner.review(
        { artifactId: 'crown', referenceUses: [receipts[1]] },
        signal
      )
    ).toMatchObject({ reused: true, status: 'pass' })
    expect(
      await owner.review({ artifactId: 'no-source' }, signal)
    ).toMatchObject({ status: 'pass' })
  })
})

import sharp from 'sharp'
import { createLocalImageCheck } from '../local-image-check'
it('revalidates an explicit reference use after native pixel work without publishing a late pass', async () => {
  const references = setup()
  update(references, {
    ...decision(),
    uses: [{ ...use(), purpose: 'pixel-comparison', region: 'whole' }]
  })
  const receipt = references.snapshot()[0].uses[0].receipt
  const results = createDesignCheckResults()
  const bytes = await sharp({
    create: { width: 2, height: 2, channels: 3, background: 'white' }
  })
    .png()
    .toBuffer()
  const dataUrl = `data:image/png;base64,${bytes.toString('base64')}`
  let validations = 0
  const owner = createLocalImageCheck({
    results,
    inspection: () => ({
      target: 'entrance',
      dataUrl,
      imageScope: 'region',
      background: '#ffffff',
      region: { x: 0, y: 0, width: 2, height: 2 }
    }),
    validate: async () => {
      if (++validations === 2)
        update(references, { ...decision([]), status: 'rejected' })
      return true
    },
    reference: (_index, use) => {
      references.resolve(use, 'pixel-comparison')
      return { referenceId: receipt.referenceId, dataUrl }
    }
  })
  await expect(
    owner.call(
      {
        checkId: 'entry-color',
        inspectionId: 'current',
        referenceImageIndex: 1,
        referenceUse: receipt,
        referenceRegion: { x: 0, y: 0, width: 2, height: 2 },
        channelTolerance: 0,
        maxDifferentFraction: 0
      },
      new AbortController().signal
    )
  ).rejects.toThrow(/stale/)
  expect(results.read({ includePassed: true }).items).toEqual([])
})

it('rejects all three recorded broad source decisions before any consumer can use them', () => {
  const owner = setup()
  for (const decision of recordedReferences.input.referenceDecisions) {
    expect(() =>
      owner.update(
        () => {
          throw new Error('Resolution must not run for malformed declarations')
        },
        { requirementRevision: 1, referenceDecisions: [decision] }
      )
    ).toThrow(/uses/)
    expect(owner.snapshot()).toEqual([])
  }
})
