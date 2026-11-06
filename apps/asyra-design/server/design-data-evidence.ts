import { toolRequestReference } from '../src/ai/tool-contract'
import { documentContextProperties } from '../src/ai/context-schema'
import type { DesignContextQuery } from '../src/common-apis/design-context-fields'
import { randomUUID } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'
import {
  designContextFields,
  designContextPageLimit
} from '../src/common-apis/design-context-fields'
import { operationInputIssue } from './operation-input-schema'

export interface DesignDataQuery {
  criterionId: string
  elementIds?: string[]
  query?: Pick<DesignContextQuery, 'bounds' | 'filter'> & {
    scope: 'region'
    expectedCount: number
  }
  fields: string[]
}
const resolvedDataQuerySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['criterionId', 'fields'],
  oneOf: [
    { required: ['elementIds'], properties: { query: false } },
    { required: ['query'], properties: { elementIds: false } }
  ],
  properties: {
    criterionId: { type: 'string', minLength: 1 },
    query: {
      type: 'object',
      additionalProperties: false,
      required: ['scope', 'bounds', 'expectedCount'],
      properties: {
        scope: { const: 'region' },
        bounds: documentContextProperties.bounds,
        filter: documentContextProperties.filter,
        expectedCount: {
          type: 'integer',
          minimum: 1,
          maximum: designContextPageLimit
        }
      }
    },
    elementIds: {
      type: 'array',
      minItems: 1,
      maxItems: designContextPageLimit,
      uniqueItems: true,
      items: { type: 'string', minLength: 1 }
    },
    fields: {
      type: 'array',
      uniqueItems: true,
      items: { type: 'string', enum: [...designContextFields] }
    }
  }
}

export interface DesignDataSelection extends Omit<
  DesignDataQuery,
  'elementIds'
> {
  elementIds?: string[]
  artifacts?: { artifactId: string; keys: string[] }[]
}

export const designDataQuerySchema = {
  ...resolvedDataQuerySchema,
  required: ['criterionId', 'fields'],
  oneOf: [
    {
      anyOf: [{ required: ['elementIds'] }, { required: ['artifacts'] }],
      properties: { query: false }
    },
    { required: ['query'], properties: { elementIds: false, artifacts: false } }
  ],
  properties: {
    ...resolvedDataQuerySchema.properties,
    artifacts: {
      type: 'array',
      minItems: 1,
      maxItems: designContextPageLimit,
      items: {
        type: 'object',
        required: ['artifactId', 'keys'],
        additionalProperties: false,
        properties: {
          artifactId: toolRequestReference,
          keys: resolvedDataQuerySchema.properties.elementIds
        }
      }
    }
  }
}

export const resolveDesignDataQuery = (
  selection: DesignDataSelection,
  resolveTargets?: (reference: unknown) => string[]
): DesignDataQuery => {
  const issue = operationInputIssue(selection, designDataQuerySchema)

  if (issue) {
    throw new Error(issue)
  }

  const { criterionId, fields, artifacts = [], elementIds = [] } = selection

  if (selection.query) {
    return { criterionId, fields, query: structuredClone(selection.query) }
  }

  const count = artifacts.reduce(
    (n, artifact) => n + artifact.keys.length,
    elementIds.length
  )

  if (count > designContextPageLimit) {
    throw new Error('Data selection exceeds one canonical context page.')
  }

  const ids = [...elementIds]

  for (const artifact of artifacts) {
    if (!resolveTargets) {
      throw new Error('Artifact references are unavailable.')
    }

    ids.push(...resolveTargets(artifact))
  }

  if (new Set(ids).size !== count || ids.length !== count) {
    throw new Error(
      'Data selection must resolve to distinct canonical elements.'
    )
  }

  return { criterionId, fields, elementIds: ids }
}

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

/** Request-owned canonical values; the model supplies judgments, never receipt bodies. */
export const createDesignDataEvidence = (
  read: (query: DesignDataQuery, signal?: AbortSignal) => Promise<unknown>
) => {
  const entries = new Map<
    string,
    { query: DesignDataQuery; values: unknown; current: boolean }
  >()

  const captureValues = async (
    query: DesignDataQuery,
    signal?: AbortSignal
  ) => {
    signal?.throwIfAborted()
    const issue = operationInputIssue(query, resolvedDataQuerySchema)

    if (issue) {
      throw new Error(issue)
    }

    const value = await read(query, signal)

    signal?.throwIfAborted()
    if (
      !record(value) ||
      value.available !== true ||
      typeof value.workspaceId !== 'string' ||
      value.nextOffset !== null ||
      value.total !==
        (query.query?.expectedCount ?? query.elementIds?.length) ||
      !Array.isArray(value.missingIds) ||
      value.missingIds.length ||
      !Array.isArray(value.elements) ||
      value.elements.length !==
        (query.query?.expectedCount ?? query.elementIds?.length) ||
      value.coordinateSpace !== 'parent-local'
    ) {
      throw new Error('Complete current canonical data evidence is required.')
    }

    const rows = value.elements
    const ids =
      query.elementIds ??
      rows
        .map((row) => (record(row) && typeof row.id === 'string' ? row.id : ''))
        .sort()

    if (ids.some((id) => !id) || new Set(ids).size !== ids.length) {
      throw Error('Data evidence requires distinct canonical elements.')
    }

    const elements = ids.map((id) => {
      const matching = rows.filter((row) => record(row) && row.id === id)
      const row = matching[0]

      if (
        matching.length !== 1 ||
        !record(row) ||
        !record(row.properties) ||
        typeof row.type !== 'string' ||
        typeof row.parentId !== 'string' ||
        !Array.isArray(row.truncatedFields) ||
        row.truncatedFields.length ||
        query.fields.some(
          (field) => !Object.hasOwn(row.properties as object, field)
        )
      ) {
        throw new Error(
          'Missing or truncated canonical data cannot prove a criterion.'
        )
      }

      return {
        id,
        type: row.type,
        parentId: row.parentId,
        properties: Object.fromEntries(
          query.fields.map((field) => [
            field,
            (row.properties as Record<string, unknown>)[field]
          ])
        )
      }
    })

    return structuredClone({
      workspaceId: value.workspaceId,
      coordinateSpace: value.coordinateSpace,
      elements
    })
  }

  return {
    async capture(query: DesignDataQuery, signal?: AbortSignal) {
      const values = await captureValues(query, signal)
      const id = randomUUID()

      entries.set(id, { query: structuredClone(query), values, current: true })

      return {
        id,
        criterionId: query.criterionId,
        values: structuredClone(values)
      }
    },

    assert(ids: string[], criterionId?: string) {
      if (
        !ids.length ||
        new Set(ids).size !== ids.length ||
        ids.some((id) => {
          const entry = entries.get(id)

          return (
            !entry?.current ||
            (criterionId !== undefined &&
              entry.query.criterionId !== criterionId)
          )
        })
      ) {
        throw new Error(
          'Use current owner-issued data evidence for this criterion.'
        )
      }
    },

    dependencies(ids: string[]) {
      this.assert(ids)

      return ids.map((id) => {
        const entry = entries.get(id)

        if (!entry) {
          throw new Error('Data evidence is unavailable.')
        }

        return { id, query: entry.query, values: entry.values }
      })
    },

    async validate(ids: string[], signal?: AbortSignal) {
      const invalid: string[] = []

      for (const id of new Set(ids)) {
        const entry = entries.get(id)

        if (!entry?.current) {
          invalid.push(id)
          continue
        }

        try {
          if (
            !isDeepStrictEqual(
              entry.values,
              await captureValues(entry.query, signal)
            )
          ) {
            entry.current = false
            invalid.push(id)
          }
        } catch (error) {
          signal?.throwIfAborted()
          entry.current = false
          invalid.push(id)
        }
      }

      return invalid
    }
  }
}
