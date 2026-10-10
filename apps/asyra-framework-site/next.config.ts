import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'
import { siteSecurityHeaders } from './lib/site-security-headers.mjs'

const appRoot = path.dirname(fileURLToPath(import.meta.url))
if (process.env.SITE_OUTPUT === 'export' && !process.env.NEXT_PUBLIC_SITE_URL) {
  throw new Error('Static export requires NEXT_PUBLIC_SITE_URL')
}

const nextConfig: NextConfig = {
  distDir: process.env.SITE_OUTPUT === 'export' ? 'out' : 'dist',
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  ...(process.env.SITE_OUTPUT === 'export'
    ? { output: 'export' as const }
    : {
        async headers() {
          return [{ source: '/(.*)', headers: siteSecurityHeaders() }]
        }
      }),
  turbopack: {
    root: path.resolve(appRoot, '../..')
  }
}

export default nextConfig
