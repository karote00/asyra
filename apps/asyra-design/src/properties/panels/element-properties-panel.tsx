import type { InspectorRefs } from '../inspector-contract'
import { featureEnabled } from '../../workspace-features'
import { TEXT_COMPONENT_TYPE } from '@asyra/preset'
import Header from '../header'
import TextProperties from '../text'
import Position from '../position'
import Dimension from '../dimension'
import Rotation from '../rotation'
import Fills from '../fills'
import Strokes from '../strokes'
import { useElementData, useElementSelection } from '../../providers'

const SectionDivider = () => <div className="h-[1px] bg-white/5 my-1" />

const ElementAppearance = ({ elementId }: { elementId: string }) => {
  const element = useElementData(elementId)

  return (
    <>
      <SectionDivider />
      {featureEnabled('fills') && <Fills />}
      {featureEnabled('strokes') && element.type !== TEXT_COMPONENT_TYPE && (
        <>
          <SectionDivider />
          <Strokes />
        </>
      )}
    </>
  )
}

const ElementPropertiesPanel = ({
  title,
  dimensionsUnavailable,
  inspectorRefs
}: {
  inspectorRefs?: InspectorRefs
  title: string
  dimensionsUnavailable?: boolean
}) => {
  const elementSelection = useElementSelection()

  if (!elementSelection.size) {
    return null
  }

  const dimension = dimensionsUnavailable ? (
    <p>Size editing is unavailable for this selection.</p>
  ) : (
    <Dimension />
  )

  return (
    <div className="flex flex-col">
      {/* Design section: Position, Dimension, Rotation */}
      <Header label={title} />
      {featureEnabled('geometry') && (
        <div className="grid grid-cols-1 w-full pb-2">
          {inspectorRefs?.positionRow ? (
            <div ref={inspectorRefs.positionRow} />
          ) : (
            <Position />
          )}
          {inspectorRefs?.dimensionRow ? (
            <div ref={inspectorRefs.dimensionRow} />
          ) : (
            dimension
          )}
          <Rotation />
        </div>
      )}

      {featureEnabled('text') && <TextProperties />}
      <ElementAppearance
        elementId={elementSelection.size === 1 ? [...elementSelection][0] : ''}
      />
    </div>
  )
}

export default ElementPropertiesPanel
