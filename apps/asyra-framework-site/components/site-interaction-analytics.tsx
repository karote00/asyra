'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { installSiteAnalytics } from '@/lib/site-interaction-analytics.mjs'

export function SiteInteractionAnalytics({
  pagePaths,
  caseIds
}: {
  pagePaths: readonly string[]
  caseIds: readonly string[]
}) {
  const pathname = usePathname()
  const tracker = useRef<ReturnType<typeof installSiteAnalytics> | null>(null)

  useEffect(() => {
    const current = installSiteAnalytics(window, { pagePaths, caseIds })
    tracker.current = current
    return () => {
      current.dispose()
      tracker.current = null
    }
  }, [pagePaths, caseIds])

  useEffect(() => {
    tracker.current?.pageChanged()
  }, [pathname])

  return null
}
