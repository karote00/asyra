export const ITEM_PRIORITIES = ['low', 'normal', 'high'] as const

export type ItemPriority = (typeof ITEM_PRIORITIES)[number]

export const isItemPriority = (value: unknown): value is ItemPriority =>
  typeof value === 'string' &&
  ITEM_PRIORITIES.some((priority) => priority === value)

export const priorityItemField = {
  key: 'priority',
  defaultValue: 'normal',
  validate: isItemPriority,
  invalidMessage: 'Item priority must be low, normal, or high.'
} as const
