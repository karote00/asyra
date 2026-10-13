import type {
  ApplyRemoteCanonicalChangeSlicesInput,
  SharedPublication
} from './app-protocol-types'
import {
  canonicalChangesFromOrganizedPublication,
  organizeRemotePublication,
  organizeSourceSlice
} from './operations'
import { emitDiagnosticCounter, measureBrowserDragPhase } from '@asyra/utils'

export type DecideRemotePublication = (
  publication: SharedPublication
) => SharedPublication | false

export interface PublicationProcessorOptions {
  readonly decideRemotePublication: DecideRemotePublication
  readonly applyRemoteCanonicalChangeSlices: (
    input: ApplyRemoteCanonicalChangeSlicesInput
  ) => void | Promise<void>
}

export const createPublicationProcessor =
  ({
    decideRemotePublication,
    applyRemoteCanonicalChangeSlices
  }: PublicationProcessorOptions): ((
    publication: SharedPublication
  ) => boolean | Promise<boolean>) =>
  (publication) => {
    const acceptedPublication = measureBrowserDragPhase(
      'collaboration:remote-policy',
      () => decideRemotePublication(publication)
    )
    if (acceptedPublication === false) {
      return false
    }
    const acceptedOrganization = measureBrowserDragPhase(
      'collaboration:remote-input-organize',
      () => organizeRemotePublication(acceptedPublication)
    )
    const canonicalSlices = measureBrowserDragPhase(
      'collaboration:remote-canonical-batch-derive',
      () =>
        acceptedOrganization.sourceSlices.map((slice) =>
          canonicalChangesFromOrganizedPublication(
            organizeSourceSlice(slice, acceptedOrganization)
          )
        )
    )
    canonicalSlices.forEach((canonicalChanges) => {
      canonicalChanges.forEach((change) => {
        if (change.kind !== 'element-creation') return
        emitDiagnosticCounter('collaboration:remote-add-element-batch-count')
        emitDiagnosticCounter(
          'collaboration:remote-add-element-batch-size',
          change.entries.length
        )
      })
    })
    const settlement = measureBrowserDragPhase(
      'collaboration:remote-transaction-apply',
      () =>
        applyRemoteCanonicalChangeSlices({
          origin: acceptedPublication.origin,
          slices: canonicalSlices
        })
    )
    return settlement instanceof Promise ? settlement.then(() => true) : true
  }
