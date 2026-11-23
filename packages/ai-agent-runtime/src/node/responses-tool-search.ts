import { AiProviderError } from '../provider.js'
import type { ProviderToolGroup } from './tool-provider.js'

const loader = {
  type: 'tool_search',
  execution: 'client',
  description: 'Load entries by their exact namespace.name from the index.',
  parameters: {
    type: 'object',
    properties: {
      names: { type: 'array', items: { type: 'string' }, minItems: 1 }
    },
    required: ['names'],
    additionalProperties: false
  }
}

export interface ResponsesSearchSelection {
  callId: string
  names: string[]
}

export function responsesToolCatalog(
  groups: readonly ProviderToolGroup[],
  webSearch = false
) {
  const names = new Set<string>()
  const deferred = new Set<string>()
  const catalog = groups.map((group) => ({
    type: 'namespace',
    name: group.name,
    description: group.description,
    tools: group.tools.map((tool) => {
      const name = group.name + '.' + tool.name

      if (names.has(name)) {
        throw new AiProviderError({
          code: 'AI_PROVIDER_INVALID_CONFIGURATION',
          message: 'Duplicate provider tool identity.'
        })
      }

      names.add(name)
      if (tool.deferLoading) {
        deferred.add(name)
      }

      return {
        type: 'function',
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
        strict: false,
        ...(tool.deferLoading && { defer_loading: true })
      }
    })
  }))

  function select(include: (name: string, deferred: boolean) => boolean) {
    return catalog.flatMap((group) => {
      const tools = group.tools.filter((tool) =>
        include(group.name + '.' + tool.name, !!tool.defer_loading)
      )

      return tools.length ? [{ ...group, tools }] : []
    })
  }

  if (webSearch) {
    deferred.add('web_search')
  }

  const declarations = [
    ...select((_, delayed) => !delayed),
    ...(deferred.size
      ? [
          webSearch
            ? {
                ...loader,
                description:
                  loader.description +
                  ' For live public sources request web_search. Keep private data out of queries.'
              }
            : loader
        ]
      : [])
  ]

  return {
    catalog,
    names,
    declarations,
    deferred,

    resolve(callId: string, args: unknown): ResponsesSearchSelection {
      const requested =
        args &&
        typeof args === 'object' &&
        Object.keys(args).length === 1 &&
        'names' in args &&
        Array.isArray(args.names) &&
        args.names.every((name) => typeof name === 'string')
          ? args.names
          : []

      return {
        callId,
        names: [
          ...new Set<string>(requested.filter((name) => deferred.has(name)))
        ]
      }
    },

    output(selection: ResponsesSearchSelection) {
      const requested = new Set(selection.names)

      return {
        type: 'tool_search_output',
        execution: 'client',
        status: 'completed',
        call_id: selection.callId,
        tools: select((name, delayed) => delayed && requested.has(name))
      }
    }
  }
}
