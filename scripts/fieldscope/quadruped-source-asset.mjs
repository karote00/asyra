import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import {
  readQuadrupedTemplate,
  QUADRUPED_TEMPLATE_FORMAT,
  QUADRUPED_TEMPLATE_ID
} from '../../apps/fieldscope/src/domain/quadruped-source-template.ts'

export { QUADRUPED_TEMPLATE_FORMAT, QUADRUPED_TEMPLATE_ID }
export const validateQuadrupedTemplate = readQuadrupedTemplate
export const sha256 = (bytes) =>
  createHash('sha256').update(bytes).digest('hex')

export async function loadQuadrupedAsset(
  templatePath,
  manifestPath,
  blendPath
) {
  const [templateBytes, manifestBytes, blendBytes] = await Promise.all([
    readFile(templatePath),
    readFile(manifestPath),
    readFile(blendPath)
  ])
  const manifest = JSON.parse(manifestBytes)
  if (
    manifest.format !== 'quadruped-source-manifest/2' ||
    manifest.templateId !== QUADRUPED_TEMPLATE_ID ||
    manifest.templateSha256 !== sha256(templateBytes) ||
    manifest.blendSha256 !== sha256(blendBytes)
  )
    throw new Error('Asset digest mismatch')
  return {
    template: readQuadrupedTemplate(JSON.parse(templateBytes)),
    manifest
  }
}
