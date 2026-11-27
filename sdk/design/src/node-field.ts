import type { InspectorNodeNumber, WorkspaceNode } from './common.js'

type ScalarFields = NonNullable<WorkspaceNode['fields']>
type NumericKeys<Fields> = {
  [Key in keyof Fields]: Fields[Key] extends number ? Key : never
}[keyof Fields] &
  string

/** Bind a standard inspector input to one selected node's persisted numeric field. */
export function numberField<Fields extends ScalarFields>(
  extension: { id: string; node: { fields: Fields } },
  field: NumericKeys<NoInfer<Fields>>,
  { label }: { label: string }
): InspectorNodeNumber {
  if (
    !Object.hasOwn(extension.node.fields, field) ||
    typeof extension.node.fields[field] !== 'number' ||
    !label?.trim()
  ) {
    throw new TypeError('Expected a declared numeric field and label')
  }

  return Object.freeze({
    kind: 'node-number',
    id: extension.id + '.' + field,
    nodeId: extension.id,
    field,
    label
  })
}
