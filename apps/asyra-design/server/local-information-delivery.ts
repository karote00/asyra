import { createInformationDelivery } from '@asyra/ai-agent-runtime/node'

// App native reply budget reserves space for the canonical outcome envelope.
export const informationDeliveryBytes = 23000
export const deliverInformation = createInformationDelivery(
  informationDeliveryBytes
)
