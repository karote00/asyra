export function resolveAppEnvironment(
  environment?: Record<string, string | undefined>,
  options?: { allowHosted?: boolean }
): Readonly<{ url: string; host: string; port: number }>
