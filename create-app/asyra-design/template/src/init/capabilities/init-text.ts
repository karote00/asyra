import type { Core } from '@asyra/core'
import {
  DEFAULT_TEXT_DATA,
  TEXT_COMPONENT_DEFINITION,
  TEXT_COMPONENT_TYPE,
  TEXT_PROPERTY_DEFINITION,
  TEXT_PROPERTY_SCHEMA,
  TEXT_PROPERTY_TYPE,
  TEXT_RENDER_STRATEGY,
  type TextData
} from '@asyra/preset'
import { PropertyTypes, SCENE_TREE_ACTIONS } from '@asyra/utils'

export const initText = (
  core: Pick<
    Core,
    | 'registerPropertySchema'
    | 'definePropertyComponent'
    | 'defineComponent'
    | 'registerRenderStrategy'
    | 'defineUIProperty'
  >
): void => {
  core.registerPropertySchema(TEXT_PROPERTY_SCHEMA)
  core.definePropertyComponent(TEXT_PROPERTY_DEFINITION)
  core.defineComponent(TEXT_COMPONENT_DEFINITION)
  core.registerRenderStrategy(TEXT_COMPONENT_TYPE, TEXT_RENDER_STRATEGY, {
    relations: [
      PropertyTypes.POSITION,
      PropertyTypes.DIMENSION,
      TEXT_PROPERTY_TYPE
    ].map((key) => ({
      name: `property:${key}`,
      target: { kind: 'property', key },
      onTargetUnregister: 'unregister-source'
    }))
  })
  core.defineUIProperty<(TextData & Record<string, unknown>) | null>(
    TEXT_PROPERTY_TYPE,
    {
      defaultValue: null,
      emptyValue: null,
      aggregate: true,
      triggers: {
        action: SCENE_TREE_ACTIONS.UPDATE_ELEMENT_COMPUTED_DATA,
        onSelectionChange: true
      },
      compute: ({ selectedIds, elements }) => {
        if (selectedIds.size !== 1 || elements.length !== 1) return null
        const element = elements[0] as unknown as Record<string, unknown>
        if (typeof element?.text !== 'string') return null
        return Object.fromEntries(
          Object.keys(DEFAULT_TEXT_DATA).map((key) => [key, element[key]])
        ) as TextData & Record<string, unknown>
      }
    }
  )
}
