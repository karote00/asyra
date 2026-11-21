import { EntityTypes } from '@asyra/utils'
import { CommonApiInputError } from '../common-api-input-error'

export const supportsSizeEdits = (type: string | undefined) =>
  type !== EntityTypes.FRAME && type !== EntityTypes.WORKSPACE

export const hasSizeEdit = (values: object) =>
  ['width', 'height', 'scaleX', 'scaleY'].some((key) =>
    Object.hasOwn(values, key)
  )

export const requireSizeEditTarget = (id: string, type: string | undefined) => {
  if (!supportsSizeEdits(type)) {
    throw new CommonApiInputError(
      'Frame and Workspace size and scale edits are unavailable.',
      { elementId: id }
    )
  }
}
