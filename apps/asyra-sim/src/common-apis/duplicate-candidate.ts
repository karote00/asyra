import { runTransaction, type Core } from '@asyra/core'
import { PropertyFields } from '../constants'
import {
  createCandidate,
  readCandidateLineage,
  readWorkcell,
  type WorkcellResourceAdmission
} from './workcell'
import {
  createExperiment,
  readExperiments,
  type ExperimentDraft
} from './experiment'
import type { CandidateLineage } from './candidate-lineage'

/** Copy editable inputs, never historical evidence or runtime resources. */
export function duplicateCandidate(
  core: Core,
  sourceId: string,
  name: string,
  admit?: WorkcellResourceAdmission
): string {
  const source = readWorkcell(core, sourceId),
    lineage = readCandidateLineage(core, sourceId)
  const ids = new Map(
    source.bodies.map((body) => [body.id, crypto.randomUUID()])
  )
  const remap = (id: string): string => {
    const next = ids.get(id)
    if (!next)
      throw new Error(`Unresolved body reference in source candidate: ${id}`)
    return next
  }
  const remapRecord = <T>(
    record: Readonly<Record<string, T>>
  ): Record<string, T> =>
    Object.fromEntries(
      Object.entries(record).map(([id, value]) => [remap(id), value])
    )
  const workcell = {
    ...structuredClone(source),
    robotRootId: source.robotRootId === null ? null : remap(source.robotRootId),
    bodies: source.bodies.map((body) => ({
      ...structuredClone(body),
      id: remap(body.id),
      parentId: body.parentId === null ? null : remap(body.parentId)
    }))
  }
  const experiments = readExperiments(core, sourceId).map((experiment) => {
    const { revision: _revision, rule, ...definition } = experiment.definition
    const { revision: _ruleRevision, ...draftRule } = rule
    const draft: ExperimentDraft = {
      ...definition,
      rule: draftRule,
      ...(definition.trajectoryInput
        ? {
            trajectoryInput: {
              ...definition.trajectoryInput,
              mapping: {
                ...definition.trajectoryInput.mapping,
                joints: Object.fromEntries(
                  Object.entries(definition.trajectoryInput.mapping.joints).map(
                    ([id, value]) => [ids.get(id) ?? id, value]
                  )
                )
              },
              // CSV headers are source fields, not body identities. JSON joint keys
              // are identities; scan complete string tokens without parsing or
              // repairing an unfinished document, preserving all other source bytes.
              text:
                definition.trajectoryInput.kind === 'csv'
                  ? definition.trajectoryInput.text
                  : definition.trajectoryInput.text.replace(
                      /"(?:\\.|[^"\\])*"/g,
                      (token: string, offset: number, text: string) => {
                        if (!/^\s*:/.test(text.slice(offset + token.length)))
                          return token
                        try {
                          const next = ids.get(JSON.parse(token))
                          return next ? JSON.stringify(next) : token
                        } catch {
                          return token
                        }
                      }
                    )
            }
          }
        : {}),
      ...(definition.exclusionsInput !== undefined
        ? {
            exclusionsInput: definition.exclusionsInput
              .split('\n')
              .map((line) =>
                line
                  .split('\t')
                  .map((field, index) =>
                    index < 2 ? (ids.get(field) ?? field) : field
                  )
                  .join('\t')
              )
              .join('\n')
          }
        : {}),
      trajectory: {
        ...definition.trajectory,
        keyframes: definition.trajectory.keyframes.map((frame) => ({
          ...frame,
          joints: remapRecord(frame.joints)
        }))
      },
      sourceUnits: {
        ...definition.sourceUnits,
        joints: remapRecord(definition.sourceUnits.joints)
      },
      scope: {
        ...definition.scope,
        primaryBodyIds: definition.scope.primaryBodyIds.map(remap),
        influencingBodyIds: definition.scope.influencingBodyIds.map(remap),
        acknowledgedExcludedVisibleBodyIds:
          definition.scope.acknowledgedExcludedVisibleBodyIds.map(remap),
        excludedPairs: definition.scope.excludedPairs.map((pair) => ({
          ...pair,
          a: remap(pair.a),
          b: remap(pair.b)
        }))
      }
    }
    return { name: experiment.name, draft }
  })
  const nextLineage: CandidateLineage = {
    version: 1,
    copiedFromCandidateId: sourceId,
    bodyOrigins: Object.fromEntries(
      source.bodies.map((body) => [
        remap(body.id),
        lineage?.bodyOrigins[body.id] ?? {
          candidateId: sourceId,
          bodyId: body.id
        }
      ])
    )
  }
  return runTransaction(() => {
    const id = createCandidate(core, name, workcell, admit)
    core.updateElementProperties([
      {
        elementId: id,
        values: {
          [PropertyFields.CANDIDATE]: {
            robotRootId: workcell.robotRootId,
            lineage: nextLineage
          }
        }
      }
    ])
    for (const experiment of experiments)
      createExperiment(core, id, experiment.name, experiment.draft)
    return id
  })
}
