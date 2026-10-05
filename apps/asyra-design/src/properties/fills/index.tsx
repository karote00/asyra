import { MIXED_STRING } from '@asyra/utils'
import { useFills } from '../../providers'
import { useProperty } from '../../hooks'
import { fillApis } from '../../common-apis'
import FillList from './list'

const Fills = () => {
  const fillsValue = useFills()
  const selection = useProperty<Set<string>>('elementSelection')
  const elementIds = Array.from(selection)
  const mixed = fillsValue === MIXED_STRING
  const fills = mixed ? [] : fillsValue

  const handleAddFill = () => {
    fillApis.addFills(elementIds)
  }

  const handleRemoveFill = (index: number) => {
    if (index < 0 || index >= fills.length) {
      return
    }

    fillApis.removeFills(fillApis.getFillTargetsAtIndex(elementIds, index))
  }

  return (
    <FillList
      fills={fills}
      elementIds={elementIds}
      mixed={mixed}
      onAdd={handleAddFill}
      onRemoveFill={handleRemoveFill}
    />
  )
}

export default Fills
