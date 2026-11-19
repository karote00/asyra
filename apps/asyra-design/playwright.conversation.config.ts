import { defineConfig } from '@playwright/test'
import ordinary from './playwright.config'

// Complete conversation evidence must use services built from this checkout.
// Preserve the ordinary server commands and resource/failure policies.
const servers = ordinary.webServer

if (!Array.isArray(servers)) {
  throw new Error(
    'Conversation verification requires the ordinary owned services'
  )
}

export default defineConfig({
  ...ordinary,
  webServer: servers.map((server) => ({
    ...server,
    reuseExistingServer: false
  }))
})
