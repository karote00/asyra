import { AiDesignToolIds } from '../src/constants/ai-design'
import { operationInputIssue } from '@asyra/ai-agent-runtime/schema'

export const isDiscoveryTool = (name: string) =>
  name === AiDesignToolIds.SEARCH_DESIGN_TOOLS ||
  name === AiDesignToolIds.READ_DESIGN_RESOURCES

const scopeSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    schemaPaths: {
      type: 'array',
      minItems: 1,
      items: { type: 'string', pattern: '^/' }
    },
    inputScope: {
      type: 'object',
      additionalProperties: false,
      required: ['operation'],
      properties: {
        operation: { type: 'string', minLength: 1 },
        nodeTypes: {
          type: 'array',
          minItems: 1,
          uniqueItems: true,
          items: { type: 'string' }
        },
        optionalInputs: {
          type: 'array',
          uniqueItems: true,
          items: { type: 'string' }
        }
      }
    }
  },
  not: { required: ['schemaPaths', 'inputScope'] }
}

export const discoveryInputSchema = (name: string, categories: string[]) => ({
  type: 'object',
  additionalProperties: false,
  ...(name === AiDesignToolIds.READ_DESIGN_RESOURCES
    ? { required: ['names'] }
    : {}),
  properties:
    name === AiDesignToolIds.SEARCH_DESIGN_TOOLS
      ? {
          query: {
            type: 'string',
            minLength: 1,
            pattern: '\\S',
            description:
              'Intended capability; ranking never grants support for unmatched terms.'
          },
          category: { type: 'string', enum: categories },
          inputFields: {
            type: 'array',
            minItems: 1,
            items: { type: 'string', minLength: 1 },
            description:
              'Required declared input names or paths; requires query.'
          },
          offset: { type: 'integer', minimum: 0 },
          registryRevision: { type: 'integer', minimum: 0 }
        }
      : {
          names: {
            type: 'array',
            minItems: 1,
            uniqueItems: true,
            items: { type: 'string', minLength: 1 },
            description:
              'Exact action, semantic operation or namespace-qualified tool identities.'
          },
          view: {
            type: 'string',
            enum: ['parameters', 'usage', 'full'],
            description:
              'Use parameters for executable arguments. For scoped workflows use the published scopeRead.'
          },
          includeRecipeDependency: {
            type: 'boolean',
            description:
              'Include the canonical action wrapper, when available, for saving a recipe.'
          },
          includeResultSchema: {
            type: 'boolean',
            description:
              'Include full result validation with usage; full view always includes it.'
          },
          scopes: {
            type: 'object',
            additionalProperties: scopeSchema,
            description:
              'Per-identity scope, keyed by an exact member of names. schemaPaths returns fragments; inputScope selects owner-published branches. Omit view when selecting schemaPaths.'
          },
          refresh: { type: 'boolean' },
          refreshReason: {
            type: 'string',
            enum: ['context-loss', 'delivery-failure', 'missing-fields']
          }
        }
})

export const discoveryInputIssue = (
  name: string,
  args: unknown,
  categories: string[]
): string | undefined => {
  const issue = operationInputIssue(
    args,
    discoveryInputSchema(name, categories)
  )

  if (issue) {
    return issue
  }

  const value = args as Record<string, unknown>

  if (name === AiDesignToolIds.SEARCH_DESIGN_TOOLS) {
    if (value.inputFields && !value.query) {
      return 'inputFields requires query.'
    }

    if (
      (value.offset !== undefined || value.registryRevision !== undefined) &&
      !value.query &&
      !value.category
    ) {
      return 'Pagination requires query or category.'
    }

    return
  }

  if (value.includeResultSchema !== undefined && value.view !== 'usage') {
    return 'includeResultSchema requires view=usage.'
  }

  if (value.refreshReason !== undefined && value.refresh !== true) {
    return 'refreshReason requires refresh=true.'
  }

  for (const [identity, scope] of Object.entries(
    (value.scopes ?? {}) as Record<string, Record<string, unknown>>
  )) {
    if (!(value.names as string[]).includes(identity)) {
      return `Scope identity ${identity} is not selected in names.`
    }

    if (scope.schemaPaths && value.view !== undefined) {
      return 'schemaPaths selects fragments; omit view for that read.'
    }
  }
}

/** Build public navigation from a single definition owner's identity and scope. */
export const contractReadArguments = (selector: Record<string, unknown>) => {
  const { inputScope, schemaPaths, ...rest } = selector
  const names = rest.names as string[]

  return {
    ...rest,
    names,
    ...(inputScope || schemaPaths
      ? {
          scopes: Object.fromEntries(
            names.map((name) => [
              name,
              {
                ...(inputScope ? { inputScope } : {}),
                ...(schemaPaths ? { schemaPaths } : {})
              }
            ])
          )
        }
      : {})
  }
}
