import {
  ContourReviewLimits,
  CONTOUR_QUALITY_SCHEMA,
  resolveContourQuality,
  reviewVectorContours,
  applyContourRefinements
} from './local-vector-contour-review'
import { randomUUID } from 'node:crypto'
import {
  IMAGE_LAYER_SCHEMA,
  separateImageBackground
} from './local-image-layer-separation'
import { setImmediate as yieldToEventLoop } from 'node:timers/promises'
import { LocalComponentAnalysisLimits as limits } from './local-component-analysis-limits'
import { Buffer } from 'node:buffer'
import { AiImageToolIds } from './ai-domain-prompt'
import type { AiProviderInput } from '../src/ai/action-batch-protocol'
import { AiActionNames } from '../src/constants/ai-actions'
import { analyzeVectorComponents } from './local-vector-component-analysis'
import {
  LOCAL_VECTOR_REFERENCE_SCHEMA,
  parseLocalVectorArtifact,
  prepareLocalVectorArtifact,
  vectorArtifactSummary,
  type LocalVectorArtifact
} from './local-vector-artifact'

interface ConversionInput {
  readonly bytes: Uint8Array
  readonly contentType: string
  readonly profile: 'photo-faithful'
  readonly signal: AbortSignal
}
const convertImage = async (input: ConversionInput): Promise<string> => {
  const { convertVTracerBuffer } = await import('../vtracer-tool-server.mjs')
  return convertVTracerBuffer(input)
}
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const createLocalImageTools = (
  input: Pick<AiProviderInput, 'metadata'>,
  convert: (input: ConversionInput) => Promise<string> = convertImage
) => {
  const metadata = input.metadata
  const attachments =
    isRecord(metadata) && Array.isArray(metadata.imageAttachments)
      ? [...metadata.imageAttachments]
      : []
  const artifacts = new Map<string, LocalVectorArtifact>()
  const converted = new Map<number, string>()
  const analyses = new Map<string, ReturnType<typeof analyzeVectorComponents>>()
  const contourReviews = new Map<
    string,
    ReturnType<typeof reviewVectorContours> & {
      quality: ReturnType<typeof resolveContourQuality>
    }
  >()
  const contourSources = new Map<
    string,
    {
      original: LocalVectorArtifact
      generation: number
      maxDisplacementPx?: number
    }
  >()
  let decompositionCalls = 0
  let analysisPathCount = 0
  let analysisCalls = 0
  let analysisQueue = Promise.resolve()
  const definitions = [
    {
      type: 'function',
      name: AiImageToolIds.REVIEW_VECTOR_CONTOURS,
      description:
        'Measure selected contour straightness and tangent breaks before drawing. Supply quality.mode (faithful preserves source irregularities; cleanup permits bounded edits) and final drawing targetSize. Faithful reviews have no cleanup proposals. Cleanup is limited to 0.5 source pixels AND 0.5 output drawing pixels; viewport zoom is irrelevant. Returns an opaque reviewId and bounded straighten/smooth-join proposals with source-pixel locations, metrics and limitations, never coordinate arrays. You decide intent: a small kink can be an intentional corner. Up to 16 selected paths, sharing the request analysis budget. Compound/unsafe contours are report-only; no proposal does not establish visual correctness.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['imageArtifactId', 'pathIds', 'quality'],
        properties: {
          quality: CONTOUR_QUALITY_SCHEMA,
          imageArtifactId: { type: 'string' },
          pathIds: {
            type: 'array',
            minItems: 1,
            maxItems: ContourReviewLimits.pathsPerCall,
            uniqueItems: true,
            items: { type: 'string' }
          }
        }
      }
    },
    {
      type: 'function',
      name: AiImageToolIds.APPLY_CONTOUR_REFINEMENTS,
      description:
        'Apply an explicit non-overlapping subset of same-request contour proposals. Creates a NEW artifact without touching the canvas; use its returned imageArtifactId in existing drawing actions. Retains anchors, fills, order and coordinate frame; validates combined topology and <=0.5 source-pixel displacement against the original trace across at most three generations. Returns before/after evidence. Rejected proposals do not change any artifact. Choose according to the original reference; metrics cannot certify visual fidelity.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['reviewId', 'proposalIds'],
        properties: {
          reviewId: { type: 'string' },
          proposalIds: {
            type: 'array',
            minItems: 1,
            maxItems: ContourReviewLimits.proposals,
            uniqueItems: true,
            items: { type: 'string' }
          }
        }
      }
    },
    {
      type: 'function',
      name: AiImageToolIds.VECTORIZE_IMAGE_LAYERS,
      description:
        'Separate an AI-selected solid native rect/oval background BEFORE tracing the residual foreground. Specify source-pixel bounds/fill, colorTolerance (0 exact to 32), and clipToBackground (true explicitly discards everything outside that region). Optional foregroundColors explicitly quantizes this region to the selected flat foreground palette plus background (instead of colorTolerance); omit for shading or uncertain colors. Only matching pixels inside that region are replaced by the native base, including matching interior details; this is compositing, not semantic object segmentation. Use only when a solid native base matches the intended design, never gradients/textures. Returns one imageArtifactId carrying background plus foreground; insert/replace it once, do not add another background. Coordinates share the returned sourceBounds, so exclusions never stretch foreground. Up to four calls allow revised parameters. No match fails; review the returned evidence and actual rendered result.',
      inputSchema: IMAGE_LAYER_SCHEMA
    },
    {
      type: 'function',
      name: AiImageToolIds.VTRACER,
      description:
        'Prepare an image after YOUR visual decomposition decision. Required plan selects separate-background with native rect/oval parameters for an intended solid base, or preserve-vectors with a concrete reason no supported native base improves the reference. Do not choose preserve-vectors merely because foreground is complex or merged with the base. Native plans separate first and trace only foreground. Vectorize one submitted PNG/JPEG/WebP attachment. Returns an imageArtifactId and path IDs with source-pixel bounds, colors, point counts and subpath counts. Use the reference in an insert/replace action with target bounds and optional excludePathIds and componentMappings from the returned componentTargets catalog. Review all shapes for supported App component representations before drawing. The server creates all editable coordinates. Do not request code execution, SVG parsing or raster editing to use this result. Separate marks can be omitted by their path IDs.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          attachmentIndex: { type: 'integer', minimum: 0 },
          plan: {
            anyOf: [
              {
                type: 'object',
                additionalProperties: false,
                required: ['strategy', 'reason'],
                properties: {
                  strategy: { const: 'preserve-vectors', type: 'string' },
                  reason: { type: 'string', minLength: 1, maxLength: 500 }
                }
              },
              {
                type: 'object',
                additionalProperties: false,
                required: [
                  'strategy',
                  'reason',
                  'background',
                  'colorTolerance',
                  'clipToBackground'
                ],
                properties: {
                  strategy: {
                    const: 'separate-background',
                    type: 'string'
                  },
                  reason: { type: 'string', minLength: 1, maxLength: 500 },
                  background: IMAGE_LAYER_SCHEMA.properties.background,
                  colorTolerance: IMAGE_LAYER_SCHEMA.properties.colorTolerance,
                  clipToBackground:
                    IMAGE_LAYER_SCHEMA.properties.clipToBackground,
                  foregroundColors:
                    IMAGE_LAYER_SCHEMA.properties.foregroundColors
                }
              }
            ]
          }
        },
        required: ['attachmentIndex', 'plan']
      }
    },
    {
      type: 'function',
      name: AiImageToolIds.ANALYZE_VECTOR_COMPONENTS,
      description: `Read-only geometric analysis of up to ${limits.pathsPerCall} plausible path candidates from a current-request vector artifact. Up to ${limits.callsPerRequest} independent calls and ${limits.pathsPerRequest} total candidate paths may be submitted per request without awaiting earlier replies. Prefer submitting all candidates from the same artifact in one call; the backend schedules bounded jobs. Await all relevant results before selecting conversions. Returns analysisId, contour identities, fit errors, topology limitations and eligible registered components. You decide whether a conversion improves the intended result; no automatic drawing or segmentation occurs. List the required receipt IDs in analysisIds when selecting componentMappings; independent reports may be combined. Preserve vectors when no suitable conversion exists.`,
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['imageArtifactId', 'pathIds'],
        properties: {
          imageArtifactId: { type: 'string' },
          pathIds: {
            type: 'array',
            minItems: 1,
            maxItems: limits.pathsPerCall,
            uniqueItems: true,
            items: { type: 'string' }
          }
        }
      }
    }
  ]
  return {
    addReference: (image: {
      dataUrl: string
      mediaType: string
      size: number
    }) => {
      attachments.push(image)
      return attachments.length - 1
    },
    definitions,
    modelActions: (actions: AiProviderInput['actions']) =>
      actions.map((action) => {
        if (action.name === AiActionNames.INSERT_VECTOR_COMPOSITION)
          return {
            ...action,
            description:
              'Insert a directly prepared drawing OR the VTracer imageArtifactId at target bounds, optionally omitting whole path IDs or mapping selected whole single-contour paths to supported native components using componentMappings. Backend constructs the editable drawing.',
            inputSchema: {
              anyOf: [action.inputSchema, LOCAL_VECTOR_REFERENCE_SCHEMA]
            }
          }
        if (action.name === AiActionNames.REPLACE_VECTOR_COMPOSITION)
          return {
            ...action,
            description:
              'Replace the revalidated compositionId with a directly prepared drawing OR a VTracer drawing reference. Backend constructs editable geometry atomically.',
            inputSchema: {
              anyOf: [
                action.inputSchema,
                {
                  type: 'object',
                  additionalProperties: false,
                  required: ['compositionId', 'drawing'],
                  properties: {
                    compositionId: { type: 'string' },
                    drawing: LOCAL_VECTOR_REFERENCE_SCHEMA
                  }
                }
              ]
            }
          }
        return action
      }),
    resolveBatch: (value: unknown) => {
      if (!isRecord(value) || !Array.isArray(value.actions))
        throw new Error('Invalid action batch')
      return {
        ...value,
        actions: value.actions.map((action: unknown) => {
          if (!isRecord(action)) throw new Error('Invalid action')
          const replacing =
            action.name === AiActionNames.REPLACE_VECTOR_COMPOSITION
          if (
            !replacing &&
            action.name !== AiActionNames.INSERT_VECTOR_COMPOSITION
          )
            return action
          const args = action.arguments
          if (!isRecord(args)) throw new Error('Invalid image reference')
          const reference = replacing ? args.drawing : args
          if (!isRecord(reference) || !('imageArtifactId' in reference))
            return action
          if (typeof reference.imageArtifactId !== 'string')
            throw new Error('Invalid image reference')
          const artifact = artifacts.get(reference.imageArtifactId)
          if (!artifact) throw new Error('Unknown image reference')
          if (
            replacing &&
            (typeof args.compositionId !== 'string' ||
              !args.compositionId ||
              Object.keys(args).some(
                (key) => !['compositionId', 'drawing'].includes(key)
              ))
          )
            throw new Error('Invalid replacement')
          const mappings = reference.componentMappings ?? []
          const ovalIds = reference.ovalPathIds ?? []
          if (!Array.isArray(mappings) || !Array.isArray(ovalIds))
            throw new Error('Invalid component selection')
          if (
            mappings.length ||
            ovalIds.length ||
            reference.analysisIds !== undefined
          ) {
            const receiptIds = reference.analysisIds
            if (
              !Array.isArray(receiptIds) ||
              !receiptIds.length ||
              receiptIds.length > limits.callsPerRequest ||
              new Set(receiptIds).size !== receiptIds.length ||
              receiptIds.some((id) => typeof id !== 'string')
            )
              throw new Error('Missing or mismatched component analysis')
            const evidence = receiptIds.map((id) => {
              const report = analyses.get(id)
              if (
                !report ||
                report.imageArtifactId !== artifact.imageArtifactId
              )
                throw new Error('Missing or mismatched component analysis')
              return report
            })
            const selections = [
              ...mappings,
              ...ovalIds.map((pathId) => ({ pathId, componentType: 'oval' }))
            ]
            for (const selection of selections) {
              if (
                !isRecord(selection) ||
                !evidence.some((analysis) =>
                  analysis.paths.some(
                    (path) =>
                      path.pathId === selection.pathId &&
                      path.candidates.some(
                        (candidate) =>
                          candidate.componentType === selection.componentType &&
                          candidate.eligible
                      )
                  )
                )
              )
                throw new Error(
                  'Component selection is not eligible in this analysis'
                )
            }
          }
          const contour = contourSources.get(artifact.imageArtifactId)
          if (contour?.maxDisplacementPx !== undefined) {
            const bounds = isRecord(reference.bounds) ? reference.bounds : {}
            const policy = resolveContourQuality(artifact, {
              mode: 'cleanup',
              targetSize: { width: bounds.width, height: bounds.height }
            })
            if (
              contour.maxDisplacementPx >
              policy.maxSourceDisplacementPx + 1e-9
            )
              throw new Error(
                'Refined contour exceeds the final output budget; review at the intended size or use the original artifact'
              )
          }
          const { analysisIds: _analysisIds, ...preparedReference } = reference
          const drawing = prepareLocalVectorArtifact(
            artifact,
            preparedReference
          )
          return {
            ...action,
            arguments: replacing
              ? { compositionId: args.compositionId, drawing }
              : drawing
          }
        })
      }
    },
    call: async (
      name: string,
      args: unknown,
      signal: AbortSignal
    ): Promise<string> => {
      if (signal.aborted) throw new Error('Image tool cancelled')
      if (name === AiImageToolIds.REVIEW_VECTOR_CONTOURS) {
        if (
          !isRecord(args) ||
          Object.keys(args).length !== 3 ||
          typeof args.imageArtifactId !== 'string' ||
          !Array.isArray(args.pathIds) ||
          !args.pathIds.length ||
          args.pathIds.length > ContourReviewLimits.pathsPerCall ||
          new Set(args.pathIds).size !== args.pathIds.length ||
          args.pathIds.some((id) => typeof id !== 'string')
        )
          throw new Error('Invalid contour review request')
        const artifact = artifacts.get(args.imageArtifactId)
        if (
          !artifact ||
          args.pathIds.some(
            (id) => !artifact.paths.some((path) => path.id === id)
          )
        )
          throw new Error('Unknown contour source')
        if (
          analysisCalls >= limits.callsPerRequest ||
          analysisPathCount + args.pathIds.length > limits.pathsPerRequest
        )
          return JSON.stringify({
            available: false,
            message:
              'Analysis budget reached. Use existing evidence or explain the remaining limitation.'
          })
        const quality = resolveContourQuality(artifact, args.quality)
        analysisCalls++
        analysisPathCount += args.pathIds.length
        const pathIds = args.pathIds as string[]
        const task = analysisQueue.then(async () => {
          const parts: ReturnType<typeof reviewVectorContours>[] = []
          for (const pathId of pathIds) {
            await yieldToEventLoop()
            signal.throwIfAborted()
            parts.push(reviewVectorContours(artifact, [pathId], signal))
          }
          const candidates = parts.flatMap((part) => part.proposals)
          const all =
            quality.mode === 'faithful'
              ? []
              : candidates.filter(
                  (p) =>
                    p.displacementBoundPx <= quality.maxSourceDisplacementPx
                )

          const review = {
            ...parts[0],
            quality,
            reviewId: randomUUID(),
            paths: parts.flatMap((part) => part.paths),
            proposals: all.slice(0, ContourReviewLimits.proposals),
            omittedProposals:
              parts.reduce((n, p) => n + p.omittedProposals, 0) +
              Math.max(0, all.length - ContourReviewLimits.proposals)
          }
          signal.throwIfAborted()
          contourReviews.set(review.reviewId, review)
          return JSON.stringify({
            ...review,
            policyExcludedProposals: candidates.length - all.length,
            limitation:
              quality.mode === 'faithful'
                ? 'Faithful mode preserves source irregularities; cleanup is disabled.'
                : null,
            proposals: review.proposals.map(({ edits, ...proposal }) => ({
              ...proposal,
              displacementBoundOutputPx:
                proposal.displacementBoundPx * quality.outputScale,
              conflictsWith: review.proposals
                .filter(
                  (other) =>
                    other.id !== proposal.id &&
                    other.pathId === proposal.pathId &&
                    other.edits.some((a) =>
                      edits.some(
                        (b) => a.anchor === b.anchor && a.field === b.field
                      )
                    )
                )
                .map((other) => other.id)
            }))
          })
        })
        analysisQueue = task.then(
          () => undefined,
          () => undefined
        )
        return task
      }
      if (name === AiImageToolIds.APPLY_CONTOUR_REFINEMENTS) {
        if (
          !isRecord(args) ||
          Object.keys(args).length !== 2 ||
          typeof args.reviewId !== 'string' ||
          !Array.isArray(args.proposalIds) ||
          args.proposalIds.some((id) => typeof id !== 'string')
        )
          throw new Error('Invalid contour refinement request')
        const review = contourReviews.get(args.reviewId)
        const source = review && artifacts.get(review.imageArtifactId)
        if (!review || !source)
          throw new Error('Unknown contour review receipt')
        const lineage = contourSources.get(source.imageArtifactId) ?? {
          original: source,
          generation: 0
        }
        if (lineage.generation >= ContourReviewLimits.generations)
          return JSON.stringify({
            available: false,
            message:
              'Contour refinement limit reached. Use existing artifacts and report remaining differences.'
          })
        await yieldToEventLoop()
        const result = applyContourRefinements(
          source,
          lineage.original,
          review,
          args.proposalIds as string[],
          signal
        )
        if (
          review.quality.mode !== 'cleanup' ||
          result.maxDisplacementPx >
            review.quality.maxSourceDisplacementPx + 1e-9
        )
          throw new Error(
            'Contour refinement exceeds the output quality budget'
          )
        artifacts.set(result.artifact.imageArtifactId, result.artifact)
        contourSources.set(result.artifact.imageArtifactId, {
          original: lineage.original,
          generation: lineage.generation + 1,
          maxDisplacementPx: result.maxDisplacementPx
        })
        return JSON.stringify({
          ...vectorArtifactSummary(result.artifact),
          sourceBounds: result.artifact.sourceBounds,
          changes: result.changes,
          maxDisplacementPx: result.maxDisplacementPx,
          maxDisplacementOutputPx:
            result.maxDisplacementPx * review.quality.outputScale,
          quality: review.quality,
          requiresVisualReview: true
        })
      }
      if (name === AiImageToolIds.ANALYZE_VECTOR_COMPONENTS) {
        if (
          !isRecord(args) ||
          Object.keys(args).length !== 2 ||
          typeof args.imageArtifactId !== 'string' ||
          !Array.isArray(args.pathIds) ||
          args.pathIds.some((id) => typeof id !== 'string')
        )
          throw new Error('Invalid component analysis request')
        const artifact = artifacts.get(args.imageArtifactId)
        if (!artifact) throw new Error('Unknown image reference')
        if (
          !args.pathIds.length ||
          args.pathIds.length > limits.pathsPerCall ||
          new Set(args.pathIds).size !== args.pathIds.length
        )
          throw new Error('Invalid analysis selection')
        if (
          analysisCalls >= limits.callsPerRequest ||
          analysisPathCount + args.pathIds.length > limits.pathsPerRequest
        )
          return JSON.stringify({
            available: false,
            message:
              'The analysis limit has been reached. Use existing results or explain remaining constraints.'
          })
        // Reserve before any await so parallel submissions cannot oversubscribe.
        analysisCalls++
        analysisPathCount += args.pathIds.length
        const pathIds = [...args.pathIds] as string[]
        const task = analysisQueue.then(async () => {
          let report: ReturnType<typeof analyzeVectorComponents> | undefined
          for (
            let offset = 0;
            offset < pathIds.length;
            offset += limits.pathsPerJob
          ) {
            if (signal.aborted) throw new Error('Image tool cancelled')
            // One bounded CPU job at a time; yield so Stop and I/O stay responsive.
            await yieldToEventLoop()
            if (signal.aborted) throw new Error('Image tool cancelled')
            const partial = analyzeVectorComponents(
              artifact,
              pathIds.slice(offset, offset + limits.pathsPerJob),
              signal
            )
            if (report) report.paths.push(...partial.paths)
            else report = partial
          }
          if (!report || signal.aborted) throw new Error('Image tool cancelled')
          // Publish one complete receipt, never a partially analyzed package.
          analyses.set(report.analysisId, report)
          return JSON.stringify(report)
        })
        analysisQueue = task.then(
          () => undefined,
          () => undefined
        )
        return task
      }
      if (
        (name !== AiImageToolIds.VTRACER &&
          name !== AiImageToolIds.VECTORIZE_IMAGE_LAYERS) ||
        !isRecord(args) ||
        !Number.isSafeInteger(args.attachmentIndex)
      )
        throw new Error('Invalid image tool request')
      let representationPlan: Record<string, unknown> | undefined
      let layerArgs = args
      if (name === AiImageToolIds.VTRACER) {
        const plan = args.plan
        if (
          Object.keys(args).some(
            (key) => !['attachmentIndex', 'plan'].includes(key)
          ) ||
          !isRecord(plan) ||
          typeof plan.reason !== 'string' ||
          !plan.reason.trim() ||
          plan.reason.length > 500 ||
          !['preserve-vectors', 'separate-background'].includes(
            String(plan.strategy)
          ) ||
          Object.keys(plan).some(
            (key) =>
              !(
                plan.strategy === 'preserve-vectors'
                  ? ['strategy', 'reason']
                  : [
                      'strategy',
                      'reason',
                      'background',
                      'colorTolerance',
                      'clipToBackground',
                      'foregroundColors'
                    ]
              ).includes(key)
          )
        )
          throw new Error(
            'An explicit image representation plan is required: choose separate-background with native base parameters, or preserve-vectors with a concrete reason.'
          )
        representationPlan = plan
        const { strategy: _strategy, reason: _reason, ...parameters } = plan
        layerArgs = { ...parameters, attachmentIndex: args.attachmentIndex }
      }
      const attachment = attachments[args.attachmentIndex as number]
      if (
        !isRecord(attachment) ||
        typeof attachment.dataUrl !== 'string' ||
        !['image/png', 'image/jpeg', 'image/webp'].includes(
          String(attachment.mediaType)
        )
      )
        throw new Error('Unavailable attachment')
      const prefix = `data:${attachment.mediaType};base64,`
      const encoded = attachment.dataUrl.slice(prefix.length)
      if (
        !attachment.dataUrl.startsWith(prefix) ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)
      )
        throw new Error('Invalid attachment')
      const bytes = Buffer.from(encoded, 'base64')
      if (
        bytes.length === 0 ||
        bytes.length > 16 * 1024 * 1024 ||
        bytes.length !== attachment.size ||
        bytes.toString('base64') !== encoded
      )
        throw new Error('Invalid attachment')
      if (
        name === AiImageToolIds.VECTORIZE_IMAGE_LAYERS ||
        representationPlan?.strategy === 'separate-background'
      ) {
        if (decompositionCalls >= 4)
          throw new Error(
            'Image separation limit reached. Use existing results or explain the remaining limitation.'
          )
        decompositionCalls++
        const layers = await separateImageBackground(
          bytes,
          String(attachment.mediaType),
          layerArgs,
          signal
        )
        let artifact: LocalVectorArtifact = {
          imageArtifactId: randomUUID(),
          width: layers.width,
          height: layers.height,
          paths: []
        }
        if (layers.separation.foregroundPixelCount) {
          const svg = await convert({
            bytes: layers.foreground,
            contentType: 'image/png',
            profile: 'photo-faithful',
            signal
          })
          if (signal.aborted || Buffer.byteLength(svg) > 8 * 1024 * 1024)
            throw new Error('Image tool unavailable')
          artifact = parseLocalVectorArtifact(svg)
          if (
            artifact.width !== layers.width ||
            artifact.height !== layers.height
          )
            throw new Error('Image layer coordinate frame mismatch')
        }
        artifact.background = layers.background
        artifact.sourceBounds = layers.sourceBounds
        signal.throwIfAborted()
        artifacts.set(artifact.imageArtifactId, artifact)
        return JSON.stringify({
          ...vectorArtifactSummary(artifact),
          representationPlan: representationPlan ?? {
            strategy: 'separate-background',
            ...layerArgs
          },
          separation: layers.separation
        })
      }
      const previous = converted.get(args.attachmentIndex as number)
      if (previous)
        return JSON.stringify({ ...JSON.parse(previous), representationPlan })
      const svg = await convert({
        bytes,
        contentType: String(attachment.mediaType),
        profile: 'photo-faithful',
        signal
      })
      if (signal.aborted || Buffer.byteLength(svg) > 8 * 1024 * 1024)
        throw new Error('Image tool unavailable')
      const artifact = parseLocalVectorArtifact(svg)
      const summary = JSON.stringify({
        ...vectorArtifactSummary(artifact),
        representationPlan
      })
      artifacts.set(artifact.imageArtifactId, artifact)
      converted.set(args.attachmentIndex as number, summary)
      return summary
    }
  }
}
