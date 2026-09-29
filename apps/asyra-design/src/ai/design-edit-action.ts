import type { AiActionDefinition } from '@asyra/ai-agent-runtime'
import { DEFAULT_TEXT_DATA } from '@asyra/preset'
import {
  editDesignElement,
  type DesignElementEdit
} from '../common-apis/design-edit'
import { AiActionNames } from '../constants'

export const createDesignEditAction = (
  edit: typeof editDesignElement = editDesignElement
): AiActionDefinition<DesignElementEdit> => ({
  name: AiActionNames.UPDATE_DESIGN_ELEMENT,
  description:
    'Revise one existing editable object after reading its context. Change its name, parent-local geometry, native text/typography, or an existing primary fill/stroke color. Preserve other fields and objects. Returns the edited object for rendered review. Does not add missing fills/strokes or change vector path points.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['elementId'],
    properties: {
      elementId: { type: 'string', minLength: 1, maxLength: 256 },
      name: { type: 'string', minLength: 1, maxLength: 160 },
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
          ...Object.fromEntries(
            Object.entries(DEFAULT_TEXT_DATA).map(([key, value]) => [
              key,
              { type: typeof value }
            ])
          )
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
  execute: async (request, { signal }) => {
    if (signal.aborted) throw new Error('Design edit cancelled.')
    return edit(request)
  }
})
