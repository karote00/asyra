import { EventTypes } from '@asyra/core/contracts'
import { PROPS_ACTIONS, SharedDataChannelNames } from '@asyra/utils'
import type { JournalEntry } from '../publication-journal'
export function journalFixture(id = crypto.randomUUID()): JournalEntry {
  return {
    version: 1,
    resources: {},
    publication: {
      publicationId: id,
      artifactId: id,
      transactionId: 1,
      origin: 'action',
      mode: 'atomic',
      slices: [
        {
          sliceId: id,
          orderedIds: [id],
          batches: [
            {
              batchId: id,
              channel: SharedDataChannelNames.PROPS,
              deliveries: [
                {
                  deliveryId: id,
                  orderedIds: [id],
                  eventName: EventTypes.UPDATE_PROPERTY,
                  payload: {
                    action: PROPS_ACTIONS.UPDATE_PROPERTY,
                    id: 'test-property',
                    key: 'value',
                    before: 0,
                    after: 1
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  }
}
