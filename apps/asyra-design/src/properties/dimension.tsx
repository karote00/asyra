import { dimensionRow } from './inspector-registry'
import { InspectorTemplateRow } from './inspector-template'

export default function Dimension() {
  return <InspectorTemplateRow id={dimensionRow.id} />
}
