/**
 * Single logging sink. Console for now — swap in Sentry / Logtail / Vercel
 * observability by changing this one file. Every unexpected error in the app
 * should reach here; nothing should be swallowed.
 */

export function logError(err: unknown, context: Record<string, unknown> = {}): void {
  const payload = {
    ...context,
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  }
  console.error('[app]', payload)
}

/** Typed error for anything crossing a network or storage boundary. */
export class DataError extends Error {
  code: 'timeout' | 'network' | 'http' | 'schema' | 'storage' | 'unknown'
  status?: number

  constructor(
    code: DataError['code'],
    message: string,
    opts?: { cause?: unknown; status?: number },
  ) {
    super(message, opts?.cause ? { cause: opts.cause } : undefined)
    this.name = 'DataError'
    this.code = code
    if (opts?.status !== undefined) this.status = opts.status
  }
}
