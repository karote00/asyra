import {
  FillGradientTypes,
  type FillGradientData,
  type PositionData
} from '@asyra/utils'
import type { GradientHandleIndex } from './fills'

export const isNonLinearGradient = (
  gradientType: FillGradientData['gradientType']
) => gradientType !== FillGradientTypes.LINEAR

const getHandleDeltaScale = (
  gradient: FillGradientData,
  handleIndex: GradientHandleIndex
) => (handleIndex === 0 && isNonLinearGradient(gradient.gradientType) ? 2 : 1)

export const computeNextGradientForHandleWithDelta = (
  baseGradient: FillGradientData,
  handleIndex: GradientHandleIndex,
  width: number,
  height: number,
  delta: PositionData
): FillGradientData => {
  const currentHandle = baseGradient.gradientHandles[handleIndex]
  const deltaScale = getHandleDeltaScale(baseGradient, handleIndex)
  const deltaX = (delta.x / width) * deltaScale
  const deltaY = (delta.y / height) * deltaScale

  if (!currentHandle) {
    return baseGradient
  }

  if (handleIndex === 1 && isNonLinearGradient(baseGradient.gradientType)) {
    const [startHandle, endHandle] = baseGradient.gradientHandles
    if (!startHandle || !endHandle) {
      return {
        ...baseGradient,
        gradientHandles: baseGradient.gradientHandles.map((handle, index) =>
          index === handleIndex
            ? {
                x: currentHandle.x + deltaX,
                y: currentHandle.y + deltaY
              }
            : handle
        )
      }
    }

    return {
      ...baseGradient,
      gradientHandles: baseGradient.gradientHandles.map((handle, index) => {
        if (index === 0) {
          return {
            x: startHandle.x - deltaX,
            y: startHandle.y - deltaY
          }
        }
        if (index === 1) {
          return {
            x: endHandle.x + deltaX,
            y: endHandle.y + deltaY
          }
        }
        return handle
      })
    }
  }

  return {
    ...baseGradient,
    gradientHandles: baseGradient.gradientHandles.map((handle, index) =>
      index === handleIndex
        ? {
            x: currentHandle.x + deltaX,
            y: currentHandle.y + deltaY
          }
        : handle
    )
  }
}
