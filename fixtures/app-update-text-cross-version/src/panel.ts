import type { DocumentRuntime } from './runtime.js'
import { CHART_UI, METADATA_UI, TYPOGRAPHY_UI } from './definitions.js'

export function mountPanel(runtime: DocumentRuntime, host: HTMLElement) {
  const subscriptions: { unsubscribe(): void }[] = []
  for (const key of [METADATA_UI, TYPOGRAPHY_UI, CHART_UI]) {
    const output = document.createElement('output')
    output.dataset.projection = key
    host.append(output)
    const subject = runtime.core.getUIPropertySubject(key)
    if (!subject) throw new Error(`Missing projection ${key}`)
    subscriptions.push(
      subject.subscribe((value) => {
        output.textContent = JSON.stringify(value)
        output.hidden = value === null
      })
    )
  }
  const approve = document.createElement('button')
  approve.textContent = 'Approve selected Text'
  approve.disabled = true
  const metadata = runtime.core.getUIPropertySubject(METADATA_UI)
  if (!metadata) throw new Error('Missing metadata projection')
  subscriptions.push(
    metadata.subscribe((value) => {
      approve.disabled = value === null
    })
  )
  const onApprove = () => {
    const id = runtime.core.getSelectedElementIds()[0]
    if (id) runtime.feature.approve(id)
  }
  approve.addEventListener('click', onApprove)
  host.append(approve)
  return () => {
    subscriptions.forEach((subscription) => subscription.unsubscribe())
    approve.removeEventListener('click', onApprove)
    host.replaceChildren()
  }
}
