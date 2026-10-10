export function siteSecurityHeaders(
  environment?: Readonly<Record<string, string | undefined>>
): { key: string; value: string }[]
