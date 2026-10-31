import {
  referenceUseReceiptSchema,
  referenceUseDependency,
  type ReferenceUseReceipt
} from './local-reference-decisions'
import sharp from 'sharp'
import { setImmediate as yieldToEventLoop } from 'node:timers/promises'
import { AiDesignToolIds } from '../src/constants/ai-design'
import {
  toolResultObject,
  toolResultString,
  toolResultCount,
  toolSemantics
} from '../src/ai/tool-contract'
import { LocalToolAccess } from './local-tool-scheduler'
import { operationInputIssue } from './operation-input-schema'
import { imageRegionSchema } from './local-image-tools'
import type { createDesignCheckResults } from './design-check-results'

interface Region {
  x: number
  y: number
  width: number
  height: number
}
export interface ImageCheckInspection {
  dataUrl: string
  target: string
  region?: unknown
  imageScope?: unknown
  background?: unknown
}
interface ImageCheckInput {
  checkId: string
  inspectionId: string
  referenceUse: ReferenceUseReceipt
  referenceImageIndex: number
  referenceRegion: Region
  channelTolerance: number
  maxDifferentFraction: number
}
const regionSchema = {
  ...imageRegionSchema,
  properties: {
    ...imageRegionSchema.properties,
    width: { type: 'integer', minimum: 1, maximum: 1024 },
    height: { type: 'integer', minimum: 1, maximum: 1024 }
  }
}
const imageCheckFields = toolResultObject(
  {
    checkId: toolResultString,
    resultId: toolResultString,
    mapping: { const: 'caller-aligned-native' },
    inspectionId: toolResultString,
    referenceId: toolResultString,
    status: { enum: ['pass', 'fail', 'unverified'] },
    appearance: { const: 'unverified' },
    reused: { type: 'boolean' },
    pixelReads: toolResultCount,
    comparedPixels: toolResultCount,
    differentPixels: toolResultCount,
    differentFraction: { type: 'number', minimum: 0, maximum: 1 },
    maxChannelError: { type: 'integer', minimum: 0, maximum: 255 },
    differenceBounds: { anyOf: [regionSchema, { type: 'null' }] },
    reason: toolResultString
  },
  [
    'checkId',
    'resultId',
    'mapping',
    'inspectionId',
    'referenceId',
    'status',
    'appearance',
    'reused',
    'pixelReads'
  ]
)

export const imageCheckResultSchema = {
  oneOf: [
    toolResultObject(
      { ...imageCheckFields.properties, status: { enum: ['pass', 'fail'] } },
      [
        ...imageCheckFields.required,
        'comparedPixels',
        'differentPixels',
        'differentFraction',
        'maxChannelError',
        'differenceBounds'
      ]
    ),
    toolResultObject(
      { ...imageCheckFields.properties, status: { const: 'unverified' } },
      [...imageCheckFields.required, 'reason']
    )
  ]
}

export const imageCheckDefinition = {
  type: 'function',
  name: AiDesignToolIds.CHECK_DRAWING_IMAGE,
  ...toolSemantics(imageCheckResultSchema, 'read', ['request-artifacts']),
  revision: 2,
  executionAccess: LocalToolAccess.EXCLUSIVE,
  description:
    'Check an explicitly aligned native-pixel reference crop against an existing inspect_drawing region, without AI. Supply the retained inspectionId, reference attachment index/crop and fixed tolerances. Same-size, same-view correspondence is YOUR assertion; this tool cannot align a photo, infer perspective or certify appearance. Captures isolate the target subtree on white, not other canvas occluders. No scaling. Returns compact differences in target-local coordinates and saves a tool check in read_design_checks using resultId. Reuse checkId after a correction with a fresh inspectionId; baseline, target region and tolerances cannot change. Unsupported images stay unverified. Primary-agent visual review remains required.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: [
      'checkId',
      'inspectionId',
      'referenceUse',
      'referenceImageIndex',
      'referenceRegion',
      'channelTolerance',
      'maxDifferentFraction'
    ],
    properties: {
      checkId: { type: 'string', minLength: 1, maxLength: 128 },
      inspectionId: { type: 'string', minLength: 1 },
      referenceUse: referenceUseReceiptSchema,
      referenceImageIndex: { type: 'integer', minimum: 0 },
      referenceRegion: regionSchema,
      channelTolerance: { type: 'integer', minimum: 0, maximum: 255 },
      maxDifferentFraction: { type: 'number', minimum: 0, maximum: 1 }
    }
  }
}

/** Native aligned crops only. The existing check store owns results and invalidation. */
export const createLocalImageCheck = (options: {
  results: ReturnType<typeof createDesignCheckResults>
  inspection: (id: string) => ImageCheckInspection | undefined
  reference: (
    index: number,
    use: ReferenceUseReceipt,
    region: Region
  ) => { referenceId: string; dataUrl: string }
  validate: (id: string, signal: AbortSignal) => Promise<boolean>
}) => {
  const decode = async (
    dataUrl: string,
    region: Region,
    signal: AbortSignal,
    exact: boolean
  ) => {
    signal.throwIfAborted()
    if (
      !/^data:image\/(png|jpeg|webp);base64,/.test(dataUrl) ||
      dataUrl.length > 12 * 1024 * 1024
    ) {
      throw new Error('Image encoding or byte bound is unsupported.')
    }
    const bytes = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64')
    const source = sharp(bytes, {
      failOn: 'warning',
      limitInputPixels: 64 * 1024 * 1024
    }).timeout({ seconds: 10 })
    const metadata = await source.metadata()
    if ((metadata.pages ?? 1) !== 1) {
      throw new Error('Multi-frame images are unsupported.')
    }
    const oriented = (metadata.orientation ?? 1) >= 5
    const width = oriented ? metadata.height : metadata.width
    const height = oriented ? metadata.width : metadata.height
    if (
      !width ||
      !height ||
      region.x + region.width > width ||
      region.y + region.height > height ||
      (exact && (width !== region.width || height !== region.height))
    ) {
      throw new Error('Native dimensions do not match the declared alignment.')
    }
    const pixels = await source
      .autoOrient()
      .extract({
        left: region.x,
        top: region.y,
        width: region.width,
        height: region.height
      })
      .flatten({ background: '#ffffff' })
      .toColourspace('srgb')
      .removeAlpha()
      .raw()
      .toBuffer()
    signal.throwIfAborted()
    if (pixels.length !== region.width * region.height * 3) {
      throw new Error('Unsupported decoded color channels.')
    }
    return pixels
  }
  return {
    async call(input: unknown, signal: AbortSignal) {
      const issue = operationInputIssue(input, imageCheckDefinition.inputSchema)
      if (issue) {
        throw new Error(issue)
      }
      const args = input as ImageCheckInput
      signal.throwIfAborted()
      const image = options.inspection(args.inspectionId)
      if (!image || !(await options.validate(args.inspectionId, signal))) {
        throw new Error(
          'Inspection evidence is unavailable or stale; capture the affected region again.'
        )
      }
      signal.throwIfAborted()
      const reference = options.reference(
        args.referenceImageIndex,
        args.referenceUse,
        args.referenceRegion
      )
      const useKey = referenceUseDependency(args.referenceUse)
      const id = `image:${args.checkId}`
      const configKey = `image-config:${args.checkId}`
      const regionKey = `image-region:${args.checkId}`
      const regionConfig = operationInputIssue(image.region, regionSchema)
        ? undefined
        : JSON.stringify(
            ['x', 'y', 'width', 'height'].map(
              (key) => (image.region as Record<string, unknown>)[key]
            )
          )
      const config = JSON.stringify([
        image.target,
        reference.referenceId,
        args.referenceRegion.x,
        args.referenceRegion.y,
        args.referenceRegion.width,
        args.referenceRegion.height,
        args.channelTolerance,
        args.maxDifferentFraction
      ])
      const previous = options.results.read({ ids: [id], includePassed: true })
        .items[0]
      if (
        previous &&
        (previous.dependencies[configKey] !== config ||
          (previous.dependencies[regionKey] !== undefined &&
            previous.dependencies[regionKey] !== regionConfig))
      ) {
        throw new Error(
          'Image check baseline, target region and tolerance configuration must remain fixed.'
        )
      }
      if (
        previous &&
        previous.dependencies[useKey] === String(args.referenceUse.revision) &&
        previous.status !== 'stale' &&
        previous.status !== 'unverified' &&
        Object.hasOwn(previous.dependencies, `inspection:${args.inspectionId}`)
      ) {
        return { ...JSON.parse(previous.evidence), reused: true, pixelReads: 0 }
      }

      const result: Record<string, unknown> = {
        checkId: args.checkId,
        resultId: id,
        mapping: 'caller-aligned-native',
        inspectionId: args.inspectionId,
        referenceId: reference.referenceId,
        status: 'unverified',
        appearance: 'unverified',
        reused: false,
        pixelReads: 0
      }
      try {
        if (
          image.imageScope !== 'region' ||
          image.background !== '#ffffff' ||
          operationInputIssue(image.region, regionSchema)
        ) {
          throw new Error(
            'Use an explicit integer native inspection region on the supported white background.'
          )
        }
        const region = image.region as Region
        if (
          region.width !== args.referenceRegion.width ||
          region.height !== args.referenceRegion.height
        ) {
          throw new Error(
            'Aligned native regions must have equal dimensions; resampling is unsupported.'
          )
        }
        const actual = await decode(
          image.dataUrl,
          { ...region, x: 0, y: 0 },
          signal,
          true
        )
        const baseline = await decode(
          reference.dataUrl,
          args.referenceRegion,
          signal,
          false
        )
        let differentPixels = 0
        let maxChannelError = 0
        let minX = region.width,
          minY = region.height,
          maxX = -1,
          maxY = -1
        for (let y = 0; y < region.height; y++) {
          if (y % 32 === 0) {
            await yieldToEventLoop()
            signal.throwIfAborted()
          }
          for (let x = 0; x < region.width; x++) {
            const offset = (y * region.width + x) * 3
            const error = Math.max(
              Math.abs(actual[offset] - baseline[offset]),
              Math.abs(actual[offset + 1] - baseline[offset + 1]),
              Math.abs(actual[offset + 2] - baseline[offset + 2])
            )
            maxChannelError = Math.max(maxChannelError, error)
            if (error <= args.channelTolerance) {
              continue
            }
            differentPixels++
            minX = Math.min(minX, x)
            maxX = Math.max(maxX, x)
            minY = Math.min(minY, y)
            maxY = Math.max(maxY, y)
          }
        }
        const comparedPixels = region.width * region.height
        const differentFraction = differentPixels / comparedPixels
        Object.assign(result, {
          status:
            differentFraction <= args.maxDifferentFraction ? 'pass' : 'fail',
          pixelReads: comparedPixels,
          comparedPixels,
          differentPixels,
          differentFraction,
          maxChannelError,
          differenceBounds: differentPixels
            ? {
                x: region.x + minX,
                y: region.y + minY,
                width: maxX - minX + 1,
                height: maxY - minY + 1
              }
            : null
        })
      } catch (error) {
        signal.throwIfAborted()
        result.reason =
          error instanceof Error
            ? error.message
            : 'Image comparison is unavailable.'
      }
      if (!(await options.validate(args.inspectionId, signal))) {
        throw new Error(
          'Inspection dependencies changed during comparison; capture only the affected region again.'
        )
      }
      signal.throwIfAborted()
      options.reference(
        args.referenceImageIndex,
        args.referenceUse,
        args.referenceRegion
      )
      options.results.record({
        id,
        origin: 'tool',
        status: result.status as 'pass' | 'fail' | 'unverified',
        evidence: JSON.stringify(result),
        scope: [image.target],
        dependencies: {
          [useKey]: String(args.referenceUse.revision),
          [configKey]: config,
          ...(regionConfig ? { [regionKey]: regionConfig } : {}),
          [`inspection:${args.inspectionId}`]: args.inspectionId
        }
      })
      return result
    }
  }
}
