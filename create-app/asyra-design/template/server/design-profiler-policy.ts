import type { ExecutionReportPolicy } from '@asyra/ai-agent-runtime'
import { AiActionNames } from '../src/constants/ai-actions'
import { AiDesignToolIds } from '../src/constants/ai-design'

export const designReportPolicy: ExecutionReportPolicy = {
  readTools: [
    AiActionNames.READ_DESIGN_CONTEXT,
    AiDesignToolIds.DESCRIBE_DESIGN_APIS
  ],
  reviewTool: AiDesignToolIds.REVIEW_DRAWING,
  validateEvidenceTool: AiActionNames.VALIDATE_INSPECTION_EVIDENCE
}
