import { expect, it } from 'vitest'
import {
  validateVisualAssessment,
  visualAssessmentInstructions
} from '../local-visual-assessment'
import { createLocalImageTools } from '../local-image-tools'

it('validates every required finding without accepting malformed or missing outcomes', () => {
  const criteria = {
    view: { requirement: 'A view' },
    style: { requirement: 'Rough' }
  }
  const check = {
    criterionId: 'view',
    status: 'pass',
    evidence: 'Visible agreement'
  }
  for (const value of [
    null,
    {},
    { checks: [check] },
    { overall: { status: 'pass', evidence: 'Agrees' }, checks: [check, check] },
    {
      overall: { status: 'pass', evidence: 'Agrees' },
      checks: [check, { ...check, criterionId: 'style', evidence: '' }]
    },
    {
      overall: { status: 'pass', evidence: 'Agrees' },
      checks: [check, { ...check, criterionId: 'other' }]
    },
    {
      overall: { status: 'pass', evidence: '' },
      checks: [check, { ...check, criterionId: 'style' }]
    }
  ])
    expect(() => validateVisualAssessment(value, criteria)).toThrow()
  expect(
    validateVisualAssessment(
      {
        overall: {
          status: 'unverified',
          evidence: 'Surface detail is unavailable.'
        },
        checks: [
          check,
          {
            criterionId: 'style',
            status: 'unverified',
            evidence: 'No detail image'
          }
        ]
      },
      criteria
    ).checks[1].status
  ).toBe('unverified')
})

it('preserves selected original reference bytes and excludes unselected research images', () => {
  const user = {
    dataUrl: 'data:image/png;base64,YQ==',
    mediaType: 'image/png',
    size: 1
  }
  const research = { ...user, dataUrl: 'data:image/png;base64,Yg==' }
  const tools = createLocalImageTools({
    metadata: { imageAttachments: [user] }
  })
  const index = tools.addReference(research)
  expect(tools.referenceImages()).toEqual([
    { role: 'reference', dataUrl: user.dataUrl }
  ])
  expect(tools.referenceImages([index])).toEqual([
    { role: 'reference', dataUrl: research.dataUrl }
  ])
  expect(tools.referenceImages([])).toEqual([])
  expect(() => tools.referenceImages([2])).toThrow(/existing/)
})

it('retains optional polish separately without replacing required findings', () => {
  const criteria = { style: { requirement: 'Detailed illustration' } }
  const assessment = {
    overall: {
      status: 'pass',
      evidence: 'Matches the requested illustration style.'
    },
    checks: [
      {
        criterionId: 'style',
        status: 'pass',
        evidence: 'Visible facade detail.'
      }
    ],
    suggestions: ['Additional glass variation is optional polish.']
  }
  expect(validateVisualAssessment(assessment, criteria)).toEqual(assessment)
  expect(
    validateVisualAssessment(
      {
        ...assessment,
        overall: { status: 'fail', evidence: 'Requested viewpoint is absent.' }
      },
      criteria
    ).overall.status
  ).toBe('fail')
  expect(() =>
    validateVisualAssessment({ ...assessment, suggestions: [null] }, criteria)
  ).toThrow()
})

it('checks unrequested additions without banning requested scenes or deleting existing content', () => {
  expect(visualAssessmentInstructions).toContain('unrequested additions')
  expect(visualAssessmentInstructions).toContain(
    'background panels, labels or decoration'
  )
  expect(visualAssessmentInstructions).toContain(
    'Requested scenes and backgrounds remain valid'
  )
  expect(visualAssessmentInstructions).toContain(
    'Preserve existing unrelated content'
  )
})
