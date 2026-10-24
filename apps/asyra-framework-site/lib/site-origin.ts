import { isProductionSite } from './site-environment.mjs'

type SiteEnvironment = Readonly<Record<string, string | undefined>>

const normalizeOrigin = (value: string, allowLocalHttp = false) => {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('Site URL must be a valid HTTPS origin')
  }

  const localHttp =
    allowLocalHttp &&
    url.protocol === 'http:' &&
    (url.hostname === '127.0.0.1' || url.hostname === 'localhost')
  if (
    (!localHttp && url.protocol !== 'https:') ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error('Site URL must be a valid HTTPS origin')
  }

  return url.origin
}

export const resolveSiteOrigin = (
  environment: SiteEnvironment = process.env
) => {
  if (environment.NEXT_PUBLIC_SITE_URL) {
    return normalizeOrigin(environment.NEXT_PUBLIC_SITE_URL)
  }
  return normalizeOrigin('https://asyra-framework.pages.dev')
}

export const isIndexingAuthorized = (
  environment: SiteEnvironment = process.env
) =>
  isProductionSite(environment) &&
  environment.NEXT_PUBLIC_SITE_INDEXING === 'true'
