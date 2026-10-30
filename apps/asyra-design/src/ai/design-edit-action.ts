import {
  toolResultIds,
  toolResultObject,
  toolResultStatus,
  toolResultString,
  actionToolSemantics
} from './tool-contract'
import { runAiMutation, type AiActionDefinition } from '@asyra/ai-agent-runtime'
import { TEXT_PROPERTY_VALUE_SCHEMAS } from '@asyra/preset'
import {
  editDesignElement,
  type DesignElementEdit
} from '../common-apis/design-edit'
import { AiActionNames } from '../constants'

export const createDesignEditAction = (
  edit: typeof editDesignElement = editDesignElement
): AiActionDefinition<DesignElementEdit> => ({
  ...actionToolSemantics(
    AiActionNames.UPDATE_DESIGN_ELEMENT,
    toolResultObject({
      status: toolResultStatus,
      compositionId: toolResultString,
      appliedElementIds: toolResultIds
    })
  ),
  name: AiActionNames.UPDATE_DESIGN_ELEMENT,
  description:
    'Revise a known editable object as an item of execute_design_batch; read context only if required identities or values are unknown. Change its name, parent-local geometry, native text/typography, or an existing primary fill/stroke color. Preserve other fields and objects. Returns the edited object for rendered review. Does not add missing fills/strokes or change vector path points.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['elementId'],
    properties: {
      elementId: {
        'x-design-element-binding': 'each',
        type: 'string',
        minLength: 1,
        maxLength: 256
      },
      name: { type: 'string', minLength: 1, maxLength: 160, pattern: '\\S' },
      properties: {
        type: 'object',
        additionalProperties: false,
        minProperties: 1,
        properties: {
          ...Object.fromEntries(
            ['x', 'y', 'rotation'].map((key) => [
              key,
              { type: 'number', minimum: -100000, maximum: 100000 }
            ])
          ),
          ...Object.fromEntries(
            ['width', 'height'].map((key) => [
              key,
              { type: 'number', exclusiveMinimum: 0, maximum: 100000 }
            ])
          ),
          ...TEXT_PROPERTY_VALUE_SCHEMAS
        }
      },
      fillColor: {
        type: 'string',
        pattern: '^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$'
      },
      strokeColor: {
        type: 'string',
        pattern: '^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$'
      }
    },
    anyOf: [
      { required: ['name'] },
      { required: ['properties'] },
      { required: ['fillColor'] },
      { required: ['strokeColor'] }
    ]
  },
  execute: async (request, context) => {
    if (context.signal.aborted) throw new Error('Design edit cancelled.')
    return runAiMutation(context, () => edit(request))
  }
})
