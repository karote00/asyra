import type { Core } from '@asyra/core'
import {
  SharedDataChannelNames,
  type CoreRawData,
  type PropertySchema
} from '@asyra/utils'
import {
  ITEM_COMPONENT_TYPE,
  ITEM_PROPERTY_TYPE,
  ITEM_PROPERTY_NAME,
  type ItemFieldExtension
} from '../../domain/item-domain.js'

export const registerStarterSharedDataChannels = (core: Core): (() => void) => {
  const ownedChannels: string[] = []
  ;[SharedDataChannelNames.SCENE_TREE, SharedDataChannelNames.PROPS].forEach(
    (name) => {
      if (core.hasSharedDataChannel(name)) {
        return
      }
      core.registerSharedDataChannel(name, core.createLocalSharedDataChannel())
      ownedChannels.push(name)
    }
  )
  return () => {
    ;[...ownedChannels].reverse().forEach((name) => {
      core.unregisterSharedDataChannel(name)
    })
  }
}

export const registerStarterSchema = (
  core: Core,
  itemSchema: PropertySchema,
  itemField?: ItemFieldExtension
): void => {
  const propertyKeys = [
    'title',
    'status',
    'offsetX',
    'offsetY',
    ...(itemField ? [itemField.key] : [])
  ]
  core.definePropertyComponent({
    type: ITEM_PROPERTY_TYPE,
    defaults: {
      title: 'Untitled item',
      status: 'todo',
      offsetX: 0,
      offsetY: 0,
      ...(itemField ? { [itemField.key]: itemField.defaultValue } : {})
    },
    persistKeys: propertyKeys,
    valueKeys: propertyKeys
  })
  core.defineComponent({
    type: ITEM_COMPONENT_TYPE,
    idPrefix: 'item',
    namePrefix: 'Item',
    properties: [
      {
        name: ITEM_PROPERTY_NAME,
        type: ITEM_PROPERTY_TYPE,
        alias: propertyKeys,
        schema: itemSchema
      }
    ]
  })
}

export const createEmptyCoreDocument = (): CoreRawData =>
  ({
    version: '1.0.0',
    sceneTree: {
      workspace: '',
      workspaceList: [],
      elements: {}
    },
    props: {}
  }) as unknown as CoreRawData
