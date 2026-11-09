import { expect, it } from 'vitest'
import { AiActionNames } from '../../src/constants/ai-actions'
import { createDesignFacts } from '../local-design-facts'
import { createPreparedDesignReview } from '../local-prepared-design-review'
import { AiDesignToolIds } from '../../src/constants/ai-design'
import { createLocalOperationTools } from '../local-operation-tools'

const observationOwner = (failure?: Error) => {
  const calls: string[] = []
  const owner = createLocalOperationTools(
    [AiActionNames.INSPECT_DRAWING, AiActionNames.REVIEW_DESIGN].map(
      (name) => ({
        name,
        description: name,
        inputSchema: { type: 'object' }
      })
    ),
    { modelActions: (actions) => actions, resolveBatch: (batch) => batch },
    async (batch) => {
      if (failure) throw failure
      return {
        context: {},
        actionResults: batch.actions.map((action) => {
          calls.push(action.name)

          return {
            actionId: action.id,
            actionName: action.name,
            result: {
              available: true,
              elementId: 'card',
              imageScope: 'overview',
              image: {
                mimeType: 'image/png',
                dataUrl: 'data:image/png;base64,aW1hZ2U=',
                width: 20,
                height: 20
              }
            }
          }
        })
      }
    }
  )

  return { owner, calls }
}

it('captures a requested observation without scheduling quality measurement', async () => {
  const { owner, calls } = observationOwner()
  const result = await owner.finishInspection(
    'card',
    false,
    new AbortController().signal
  )

  expect(calls).toEqual([AiActionNames.INSPECT_DRAWING])
  expect(result.actionResults[0].result).toMatchObject({ available: true })
  expect(result).not.toHaveProperty('measurementIssues')
})

it('performs no follow-up reads when observation is deferred', async () => {
  const { owner, calls } = observationOwner()
  const result = await owner.finishInspection(
    'card',
    true,
    new AbortController().signal
  )

  expect(calls).toEqual([])
  expect(result.actionResults).toEqual([])
})

it('never captures a target while its write settlement is unknown', async () => {
  const { owner, calls } = observationOwner()

  await owner.finishInspection(
    'card',
    false,
    new AbortController().signal,
    true
  )
  expect(calls).toEqual([])
})

it('returns a capture failure without retrying writes or scheduling measurement', async () => {
  const { owner, calls } = observationOwner(
    new Error('Capture transport failed')
  )
  const result = await owner.finishInspection(
    'card',
    false,
    new AbortController().signal
  )
  expect(result.inspectionIssues).toEqual([
    { elementId: 'card', message: 'Capture transport failed' }
  ])
  expect(result.actionResults).toEqual([])
  expect(calls).toEqual([])
})

it('preserves cancellation instead of presenting it as a capture warning', async () => {
  const { owner, calls } = observationOwner()
  const controller = new AbortController()
  controller.abort(new Error('Cancelled by user'))
  await expect(
    owner.finishInspection('card', false, controller.signal)
  ).rejects.toThrow('Cancelled by user')
  expect(calls).toEqual([])
})

it('saves an authored calculation without registering source facts', () => {
  const facts = createDesignFacts()
  expect(
    facts.recordCalculations({
      calculations: [{ id: 'spacing', value: 12, unit: 'px' }]
    })
  ).toMatchObject({
    calculations: [{ id: 'spacing', value: 12, unit: 'px' }]
  })
})

it('selects an existing reference without registering design criteria', async () => {
  const owner = createLocalOperationTools(
    [
      {
        name: AiActionNames.INSPECT_DRAWING,
        description: 'Capture',
        inputSchema: { type: 'object' }
      }
    ],
    { modelActions: (actions) => actions, resolveBatch: (batch) => batch },
    async () => ({ context: {}, actionResults: [] }),
    {
      validateReferences: () => [
        {
          attachmentIndex: 0,
          referenceId: 'reference:known',
          validation: { width: 100, height: 80 }
        }
      ]
    }
  )
  const result = JSON.parse(
    await owner.call(
      AiDesignToolIds.SELECT_DESIGN_REFERENCES,
      { referenceImageIndexes: [0] },
      new AbortController().signal
    )
  )
  expect(result.referenceImageIndexes).toEqual([0])
  expect(result).not.toHaveProperty('requirementRevision')
})

it('checks prepared geometry without registering criteria or reference suitability', async () => {
  const owner = createPreparedDesignReview({
    resolveRecipe: () => ({
      recipe: { type: 'rect', width: 10, height: 10 },
      findings: [],
      elementCount: 1
    }),
    resolveAttachment: async () => ({
      workspaceId: 'workspace',
      parentId: 'workspace',
      evidence: { sessionId: 'document', revision: 1 },
      basis: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 }
      ]
    }),
    attachmentCurrent: async () => true
  })
  const result = await owner.review(
    { artifactId: 'part' },
    new AbortController().signal
  )
  expect(result.status).toBe('pass')
  expect(result).not.toHaveProperty('finalCanvasReviewRequired')
})
