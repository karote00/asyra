import { runTransaction } from '@asyra/core'
import type { EVENT_OPTIONS } from '@asyra/utils'
import core from '../../contexts'
import { mutationReceipt } from '../mutation-receipt'
import { supportsSizeEdits } from './geometry-policy'

export const scaleElementAroundCenter = (
  elementId: string,
  factors: { readonly scaleX: number; readonly scaleY: number },
  options?: EVENT_OPTIONS,
  requiredType?: string
) => {
  const unavailable = () =>
    mutationReceipt(false, { acceptedIds: [], changed: false }, [elementId])

  const type = core.getElementMetadata(elementId)?.type

  if (
    !type ||
    !supportsSizeEdits(type) ||
    (requiredType && type !== requiredType)
  ) {
    return unavailable()
  }

  const data = core.getElementComputedData(elementId, [
    'x',
    'y',
    'width',
    'height',
    'rotation',
    'scaleX',
    'scaleY'
  ])

  if (!data) {
    return unavailable()
  }

  const { x, y, width, height, rotation = 0, scaleX = 1, scaleY = 1 } = data

  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    typeof width !== 'number' ||
    typeof height !== 'number' ||
    typeof scaleX !== 'number' ||
    typeof scaleY !== 'number' ||
    typeof rotation !== 'number' ||
    ![factors.scaleX, factors.scaleY, scaleX, scaleY].every(
      (v) => Number.isFinite(v) && v > 0
    )
  ) {
    return unavailable()
  }

  // Preserve the local box center in parent coordinates, including rotation.
  const nextX = scaleX * factors.scaleX
  const nextY = scaleY * factors.scaleY
  const dx = (width * (scaleX - nextX)) / 2
  const dy = (height * (scaleY - nextY)) / 2
  const values = {
    x: x + Math.cos(rotation) * dx - Math.sin(rotation) * dy,
    y: y + Math.sin(rotation) * dx + Math.cos(rotation) * dy,
    scaleX: nextX,
    scaleY: nextY
  }

  if (
    !Object.values(values).every(Number.isFinite) ||
    nextX <= 0 ||
    nextY <= 0
  ) {
    return unavailable()
  }

  const receipt = runTransaction(() =>
    core.updateElementProperties([{ elementId, values }], options)
  )

  return mutationReceipt(receipt.acceptedIds.includes(elementId), receipt)
}
