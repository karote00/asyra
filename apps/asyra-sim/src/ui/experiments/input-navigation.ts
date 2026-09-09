import { flushSync } from 'react-dom'
/** Presentation routing only: admission and validity remain with their owners. */
export function reviewExperimentInput(panel: Element, code = ''): void {
  flushSync(() =>
    panel.querySelector<HTMLButtonElement>('#experiment-tab-setup')?.click()
  )
  let selector = '[aria-label="Trajectory source data"]'
  if (code.includes('exclusion')) selector = '[aria-label="Excluded pairs"]'
  else if (code.includes('interval')) selector = '[aria-label="Start time (s)"]'
  else if (code.includes('original-part') || code.includes('topology'))
    selector = '[aria-label="Choose original part GLB"]'
  else if (code.includes('method') || code.includes('geometry'))
    selector = '[aria-label="Analysis method"]'
  else if (
    code.includes('pairs') ||
    code.includes('scope') ||
    code.includes('body')
  )
    selector = '[aria-label$=" analysis role"]'
  const missingDeclaration = [
    ...panel.querySelectorAll<HTMLSelectElement>('.mapping-grid select')
  ].find((field) => field.value === '')
  const target =
    missingDeclaration ??
    panel.querySelector<HTMLElement>('[aria-invalid="true"]') ??
    panel.querySelector<HTMLElement>(selector)
  if (!target) return
  let parent = target.parentElement
  while (parent && parent !== panel) {
    if (parent instanceof HTMLDetailsElement) parent.open = true
    parent = parent.parentElement
  }
  target.focus()
  ;(target.closest('label') ?? target).scrollIntoView?.({ block: 'nearest' })
}
