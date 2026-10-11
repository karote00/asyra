import { describe, expect, it, vi } from 'vitest'
import type { VisualAssessment } from '../local-visual-assessment'
import {
  createPreparedDesignReview,
  type PreparedRecipePacket
} from '../local-prepared-design-review'

const signal = () => new AbortController().signal
const setup = () => {
  let evidence = {
    criteria: { shape: { requirement: 'Draw a plain editable box' } },
    requirementRevision: 1,
    referenceImageIndexes: []
  }
  const recipes = new Map([
    [
      'a',
      {
        type: 'group',
        name: 'Box',
        children: [
          { key: 'body', type: 'rect', width: 20, height: 10, fill: '#ff0000' }
        ]
      }
    ]
  ])
  const assess = vi.fn<
    (
      packet: PreparedRecipePacket,
      signal: AbortSignal
    ) => Promise<VisualAssessment>
  >(async () => ({
    overall: {
      status: 'pass',
      evidence: 'Recipe describes the requested box.'
    },
    checks: [
      {
        criterionId: 'shape',
        status: 'pass',
        evidence: 'Box geometry present.'
      }
    ]
  }))
  const owner = createPreparedDesignReview({
    resolveRecipe: (artifactId: string) => {
      const recipe = recipes.get(artifactId)
      if (!recipe) throw new Error('Unavailable artifact')
      return { recipe, findings: [], elementCount: 2 }
    },
    context: () => structuredClone(evidence),
    assess
  })
  return {
    owner,
    assess,
    recipes,
    changeEvidence: () => {
      evidence = { ...evidence, requirementRevision: 2 }
    }
  }
}

describe('prepared recipe review', () => {
  it('reviews actual retained source without canvas mutation and reuses exact dependencies', async () => {
    const { owner, assess, recipes } = setup()
    const first = await owner.review({ artifactId: 'a' }, signal())
    expect(first).toMatchObject({
      status: 'pass',
      appearance: 'unverified',
      reused: false,
      artifactId: 'a'
    })
    expect(assess.mock.calls[0]?.[0]).toMatchObject({
      recipe: recipes.get('a')
    })
    expect(await owner.review({ artifactId: 'a' }, signal())).toMatchObject({
      reused: true
    })
    expect(assess).toHaveBeenCalledOnce()
    expect(() => owner.assertApplicable('a')).not.toThrow()
    const original = recipes.get('a')
    if (!original) throw new Error('Expected source recipe')
    recipes.set('b', structuredClone(original))
    expect(await owner.review({ artifactId: 'b' }, signal())).toMatchObject({
      reused: true,
      artifactId: 'b'
    })
  })
  it('invalidates on evidence or actual source changes and preserves honest partial coverage', async () => {
    const { owner, assess, recipes, changeEvidence } = setup()
    await owner.review({ artifactId: 'a', keys: ['body'] }, signal())
    expect(() => owner.assertApplicable('a')).not.toThrow()
    changeEvidence()
    expect(() => owner.assertApplicable('a')).toThrow(/evidence/i)
    await owner.review({ artifactId: 'a', keys: ['body'] }, signal())
    const body = recipes.get('a')?.children[0]
    if (!body) throw new Error('Expected body recipe')
    body.fill = '#0000ff'
    expect(() => owner.assertApplicable('a')).toThrow(/recipe/i)
    const result = await owner.review(
      { artifactId: 'a', keys: ['body'] },
      signal()
    )
    expect(result).toMatchObject({
      coverage: { keys: ['body'], wholeRecipe: false },
      appearance: 'unverified'
    })
    expect(assess).toHaveBeenCalledTimes(3)
    await expect(
      owner.review({ artifactId: 'a', keys: ['missing'] }, signal())
    ).rejects.toThrow(/key/i)
  })
  it('retains contradictions without certifying an artifact and does not override deterministic findings', async () => {
    const { owner, assess } = setup()
    assess.mockResolvedValue({
      overall: { status: 'fail', evidence: 'Unrequested backdrop' },
      checks: [
        {
          criterionId: 'shape',
          status: 'fail',
          evidence: 'Backdrop is outside the request'
        }
      ]
    })
    expect(await owner.review({ artifactId: 'a' }, signal())).toMatchObject({
      status: 'fail'
    })
    expect(() => owner.assertApplicable('a')).toThrow(/correction/i)
  })
  it('does not approve evidence changed while the independent assessment runs', async () => {
    const { owner, assess, changeEvidence } = setup()
    assess.mockImplementationOnce(async () => {
      changeEvidence()
      return {
        overall: { status: 'pass', evidence: 'Prior evidence' },
        checks: [
          { criterionId: 'shape', status: 'pass', evidence: 'Prior evidence' }
        ]
      }
    })
    expect(await owner.review({ artifactId: 'a' }, signal())).toMatchObject({
      status: 'unverified',
      evidenceCurrent: false
    })
    expect(() => owner.assertApplicable('a')).toThrow()
  })
})

it('keeps canonical findings authoritative when model assessment passes', async () => {
  const owner = createPreparedDesignReview({
    resolveRecipe: () => ({
      recipe: { type: 'rect', width: -1 },
      elementCount: 1,
      findings: [{ kind: 'requirement', key: 'width', actual: -1 }]
    }),
    context: () => ({
      criteria: { size: { requirement: 'A valid rectangle' } }
    }),
    assess: async () => ({
      overall: { status: 'pass', evidence: 'Mistaken assessment' },
      checks: [
        { criterionId: 'size', status: 'pass', evidence: 'Mistaken assessment' }
      ]
    })
  })
  expect(await owner.review({ artifactId: 'invalid' }, signal())).toMatchObject(
    { status: 'fail' }
  )
  expect(() => owner.assertApplicable('invalid')).toThrow(/correction/i)
})

it('does not let a passing partial review erase an unresolved whole-recipe conflict', async () => {
  const { owner, assess } = setup()
  assess.mockResolvedValueOnce({
    overall: { status: 'fail', evidence: 'Unrequested surrounding content' },
    checks: [
      {
        criterionId: 'shape',
        status: 'fail',
        evidence: 'Whole recipe conflict'
      }
    ]
  })
  await owner.review({ artifactId: 'a' }, signal())
  expect(
    await owner.review({ artifactId: 'a', keys: ['body'] }, signal())
  ).toMatchObject({ status: 'fail' })
  expect(() => owner.assertApplicable('a')).toThrow(/correction/i)
})
