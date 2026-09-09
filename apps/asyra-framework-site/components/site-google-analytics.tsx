import Script from 'next/script'
import publicManifest from '../../../docs/public/content-manifest.json'
import { SiteInteractionAnalytics } from '@/components/site-interaction-analytics'
import { publicPageHref } from '@/lib/content.mjs'
import { ATLAS_CASES } from '@/lib/runtime-atlas/case-definitions.mjs'
import { googleAnalyticsBootstrap } from '@/lib/site-google-services.mjs'

// Build-time public identities only; do not ship the manifest or runtime cases.
const pagePaths = [
  '/',
  '/atlas',
  '/asyra-design',
  '/releases',
  '/roadmap',
  ...publicManifest.pages.map(({ id }) => publicPageHref(id))
]
const caseIds = ATLAS_CASES.map(({ id }) => id)

export function SiteGoogleAnalytics({
  measurementId
}: {
  measurementId?: string
}) {
  if (!measurementId) return null

  return (
    <>
      <Script id="asyra-ga-init" strategy="afterInteractive">
        {googleAnalyticsBootstrap(measurementId)}
      </Script>
      <Script
        id="asyra-ga-library"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <SiteInteractionAnalytics pagePaths={pagePaths} caseIds={caseIds} />
    </>
  )
}
