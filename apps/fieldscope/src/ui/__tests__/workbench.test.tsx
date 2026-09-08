// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { CrossSection } from '../workbench'
import {
  DEFAULT_CONFIGURATION,
  configurationSite
} from '../../domain/farm-configuration'
import { createLayout } from '../../domain/greenhouse'

it('centers section labels on their strip widths independently of drain depth', async () => {
  const host = document.createElement('div')
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const root = createRoot(host)
  await act(async () => root.render(<CrossSection />))
  try {
    const labels = host.querySelectorAll('svg[role="img"] text')
    const strips = createLayout(
      configurationSite(DEFAULT_CONFIGURATION),
      DEFAULT_CONFIGURATION.strips
    ).strips.filter((strip) => strip.bay === 0)
    expect(labels.length).toBe(strips.length)
    strips.forEach((strip, index) => {
      expect(Number(labels[index].getAttribute('x'))).toBeCloseTo(
        strip.x + strip.width / 2
      )
      expect(labels[index].textContent).toBe(String(strip.width))
    })
  } finally {
    await act(async () => root.unmount())
    vi.unstubAllGlobals()
  }
})
