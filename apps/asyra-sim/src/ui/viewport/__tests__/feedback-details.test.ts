// @vitest-environment jsdom
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { feedbackFromIssues } from '../../experiments/playback-feedback'
import { FeedbackDetails } from '../feedback-details'

it('keeps every pair and its own label in expandable details, including unknowns beside contact', () => {
  const feedback = feedbackFromIssues(
    {
      checkedTime: 4,
      complete: false,
      totalPairCount: 3,
      message: 'Unresolved geometry remains unknown.'
    },
    [
      {
        pairId: 'hit',
        bodyIds: ['tool', 'table'],
        kind: 'collision',
        name: 'Tool - table'
      },
      {
        pairId: 'near',
        bodyIds: ['part', 'table'],
        kind: 'clearance',
        name: 'Part - table'
      },
      {
        pairId: 'unknown',
        bodyIds: ['arm', 'post'],
        kind: 'unresolved',
        name: 'Arm - post'
      }
    ]
  )
  const host = document.createElement('div')

  host.innerHTML = renderToStaticMarkup(
    createElement(FeedbackDetails, { feedback, matches: true })
  )
  const details = host.querySelector('details')

  if (!details) throw new Error('Missing complete pair details')

  expect(details?.querySelector('summary')?.textContent).toBe(
    'Show all 3 pair issues'
  )
  expect(
    [...details.querySelectorAll('[data-pair-id]')].map((element) => ({
      id: element.getAttribute('data-pair-id'),
      kind: element.getAttribute('data-pair-kind'),
      text: element.textContent
    }))
  ).toEqual([
    { id: 'hit', kind: 'collision', text: 'Collision - Tool - table' },
    { id: 'near', kind: 'clearance', text: 'Clearance - Part - table' },
    {
      id: 'unknown',
      kind: 'unresolved',
      text: 'Not fully checked - Arm - post'
    }
  ])
  expect(host.textContent).toContain('Incomplete coverage')
  expect(host.textContent).toContain('not a precise contact region')
})
