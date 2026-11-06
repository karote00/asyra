import continuation from './fixtures/recorded-101/continuation-contracts-20261106.json'
// @vitest-environment jsdom
import { expect, it } from 'vitest'
import { createAiToolContract } from '@asyra/ai-agent-runtime'
import { createLocalDesignTools } from '../local-design-tools'
import { createDesignPreparationSession } from '../design-preparation'
import { createLocalOperationTools } from '../local-operation-tools'
import { invokeLocalTool } from '../local-tool-invocation'
import { createRetainedDesignContext } from '../../src/common-apis/retained-design-context'
import {
  createDocumentContextAction,
  createDocumentContextReleaseAction
} from '../../src/ai/context-action'
import { createAiInspectionAction } from '../../src/ai/inspection'
import { AiDesignToolIds } from '../../src/constants/ai-design'

it.each(['ids', 'region'])(
  'reads real canonical data through %s, binds judgments and revalidates selected values',
  async (route) => {
    let invalidate: () => void = () => undefined

    let reads = 0
    const known = new Set(['target'])
    let contextCalls = 0
    let width = 20
    let name = 'Rectangle'
    let exists = true
    let regionIds = ['target']
    const contexts = createRetainedDesignContext(
      {
        getCurrentWorkspaceId: () => 'workspace',

        getSelectedElementIds: () => ['target'],

        getElementChildren: () => ({
          available: true,
          elementIds: ['target'],
          total: 1,
          nextOffset: null
        }),

        getElementIdsInBounds: () => regionIds,

        getElementMetadata: (id) =>
          known.has(id) && exists
            ? { name, type: 'rect', parentId: 'workspace' }
            : undefined,

        getElementComputedData: () => {
          reads++

          return {
            width,
            fills: Array.from({ length: 9 }, () => ({
              type: 'solid',
              color: '#ffffff'
            }))
          }
        }
      },
      (listener) => {
        invalidate = listener

        return () => undefined
      }
    )
    const actions = [
      createDocumentContextAction(contexts.read),
      createDocumentContextReleaseAction(contexts.read),
      createAiInspectionAction(() => {
        throw new Error('Data review must not capture pixels')
      })
    ]
    const snapshots: string[] = []
    let captures = 0
    const signal = new AbortController().signal
    const session = createDesignPreparationSession()
    const preparation = createLocalDesignTools([], session)
    const tools = createLocalOperationTools(
      actions.map(createAiToolContract),
      {
        resolveTargets: preparation.resolveTargets,

        modelActions: (value) => value,

        resolveBatch: (value) => value
      },
      async (batch) => ({
        context: {},
        actionResults: await Promise.all(
          batch.actions.map(async (action) => {
            const owner = actions.find((entry) => entry.name === action.name)

            if (!owner) {
              throw new Error('Missing canonical owner')
            }

            if (owner.name === actions[0].name) {
              contextCalls++
            }

            if (owner.name === actions[2].name) {
              captures++
            }

            const result = (await owner.execute(
              action.arguments as never,
              { signal } as never
            )) as Record<string, unknown>

            if (typeof result.snapshotId === 'string' && 'leaseId' in result) {
              snapshots.push(result.snapshotId)
            }

            return {
              actionId: action.id,
              actionName: action.name,
              result: result as never
            }
          })
        )
      })
    )

    const call = async (name: string, input: unknown) => {
      const definition = tools.definitions.find((entry) => entry.name === name)

      if (!definition) {
        throw new Error('Missing tool definition')
      }

      const output = await invokeLocalTool(tools, definition, input, signal)

      return JSON.parse(output.text)
    }

    const review = (input: unknown) =>
      call(AiDesignToolIds.REVIEW_DRAWING, input)

    const idsQuery = {
      criterionId: 'scale',
      elementIds: ['target'],
      fields: ['width']
    }
    const query =
      route === 'ids'
        ? idsQuery
        : {
            criterionId: 'scale',
            fields: ['width'],
            query: {
              scope: 'region',
              bounds:
                continuation.regionQueries.input.operations[0].arguments.bounds,
              filter: { type: 'rect' },
              expectedCount: 1
            }
          }

    try {
      await call(AiDesignToolIds.DEFINE_DESIGN_CRITERIA, {
        method: 'Compare canonical width',
        references: [],
        detailRequired: false,
        criteria: {
          scale: {
            requirement: 'Width 20',
            description: 'Canonical width equals 20',
            verification: 'data'
          }
        }
      })
      expect(
        (
          await review({
            phase: 'visual',
            dataQueries: [{ ...query, criterionId: 'unknown' }]
          })
        ).toolOutcome.status
      ).toBe('failed')
      expect(reads).toBe(0)
      const acquired = await review({ phase: 'visual', dataQueries: [query] })

      expect(acquired.toolOutcome.status, JSON.stringify(acquired)).toBe(
        'success'
      )
      expect(acquired.dataEvidence[0].values.elements[0].properties).toEqual({
        width: 20
      })
      expect(acquired.next.arguments.inspectionIds).toEqual([])
      expect(reads).toBe(1)
      const snapshot = acquired.dataEvidence[0].id
      const input = {
        ...acquired.next.arguments,
        final: true,
        checks: acquired.next.arguments.checks.map((check: object) => ({
          ...check,
          status: 'pass',
          evidence: 'Canonical width equals the requested 20.'
        }))
      }
      const forged = structuredClone(input)

      forged.checks[0].dataEvidenceIds = ['foreign']
      expect((await review(forged)).toolOutcome.status).toBe('failed')
      const recorded = await review(input)

      expect(recorded.toolOutcome.status, JSON.stringify(recorded)).toBe(
        'success'
      )
      expect(recorded.accepted).toBe(true)
      expect(reads).toBe(2)
      name = 'Renamed decoration'
      invalidate()
      await tools.validateCompletion(signal)
      expect(reads).toBe(3)
      const retained = await call(AiDesignToolIds.READ_DESIGN_CHECKS, {
        includePassed: true,
        view: 'details'
      })

      expect(JSON.stringify(retained)).toContain('pass')
      if (route === 'region') {
        regionIds = ['replacement']
        known.add('replacement')
        invalidate()
        expect((await review(input)).toolOutcome.status).toBe('failed')
        regionIds = ['target']
        known.delete('replacement')
        invalidate()
      }

      width = 21
      invalidate()
      const stale = await review(input)

      expect(stale.toolOutcome.status).toBe('failed')
      expect(JSON.stringify(stale)).toContain('stale')
      const fresh = await review({ phase: 'visual', dataQueries: [query] })

      expect(fresh.dataEvidence[0].id).not.toBe(snapshot)
      expect(fresh.dataEvidence[0].values.elements[0].properties.width).toBe(21)
      const failed = await review({
        ...fresh.next.arguments,
        final: true,
        checks: fresh.next.arguments.checks.map((check: object) => ({
          ...check,
          status: 'fail',
          evidence: 'Width 21 differs from requested 20.'
        }))
      })

      expect(failed.accepted).toBe(false)
      expect(failed.correction.checks[0].inspectionIds).toEqual([])
      expect(failed.correction.checks[0].dataEvidenceIds).toEqual([
        fresh.dataEvidence[0].id
      ])
      exists = false
      invalidate()
      expect(
        (await review({ phase: 'visual', dataQueries: [query] })).toolOutcome
          .status
      ).toBe('failed')
      exists = true
      invalidate()
      const truncated = await review({
        phase: 'visual',
        dataQueries: [{ ...query, fields: ['fills'] }]
      })

      expect(truncated.toolOutcome.status).toBe('failed')
      expect(JSON.stringify(truncated)).toContain('truncated')
      const artifacts = ['Crown', 'Base'].map((name) => {
        const { artifactId } = session.prepare({
          type: 'frame',
          name,
          width: 50,
          height: 50,
          children: [
            { key: 'panel', type: 'rect', name: 'Panel', width: 10, height: 10 }
          ]
        })
        const reference = { artifactId, keys: ['panel'] }

        preparation.resolveTargets(reference).forEach((id) => known.add(id))

        return reference
      })

      invalidate()
      const before = contextCalls
      const withKeys = { ...idsQuery, artifacts }

      for (const invalid of [
        {
          ...idsQuery,
          artifacts: [artifacts[0], { ...artifacts[1], keys: ['missing'] }]
        },
        {
          ...idsQuery,
          artifacts: [{ ...artifacts[0], artifactId: 'foreign' }]
        },
        { ...idsQuery, artifacts: [artifacts[0], artifacts[0]] }
      ]) {
        expect(
          (await review({ phase: 'visual', dataQueries: [invalid] }))
            .toolOutcome.status
        ).toBe('failed')
      }

      expect(contextCalls).toBe(before)
      const keyed = await review({ phase: 'visual', dataQueries: [withKeys] })

      expect(keyed.toolOutcome.status, JSON.stringify(keyed)).toBe('success')
      expect(
        keyed.dataEvidence[0].values.elements.map(
          (row: { id: string }) => row.id
        )
      ).toEqual([...known])
      expect(contextCalls - before).toBe(1)
      const keysOnly = await review({
        phase: 'visual',
        dataQueries: [{ criterionId: 'scale', artifacts, fields: ['width'] }]
      })

      expect(keysOnly.dataEvidence[0].values.elements).toHaveLength(2)
      width++
      invalidate()
      const expired = await review({
        ...keysOnly.next.arguments,
        checks: keysOnly.next.arguments.checks.map((check: object) => ({
          ...check,
          status: 'pass',
          evidence: 'Prior width'
        }))
      })

      expect(expired.toolOutcome.status).toBe('failed')
      expect(JSON.stringify(expired)).toContain('stale')
      for (const id of snapshots) {
        expect(() => contexts.get(id)).toThrow()
      }

      expect(captures).toBe(0)
    } finally {
      contexts.dispose()
    }
  }
)
