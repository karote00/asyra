import { defineFeature } from '@asyra/core'
import { STARTER_FEATURE_NAME } from '../../domain/item-domain.js'
import type { ItemCommandApi } from '../../common-apis/items.js'

export const registerItemFeatures = (api: ItemCommandApi) =>
  defineFeature<ItemCommandApi>(STARTER_FEATURE_NAME, undefined, {
    api,
    priority: 10,
    exclusive: true
  })
