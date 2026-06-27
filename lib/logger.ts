export function logError(context: string, error: unknown, meta?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'production') {
    console.error(JSON.stringify({
      level: 'error',
      context,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      ...meta,
    }))
  } else {
    console.error(`[${context}]`, error, meta || '')
  }
}

export function logWarn(context: string, message: string, meta?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'production') {
    console.warn(JSON.stringify({
      level: 'warn',
      context,
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    }))
  } else {
    console.warn(`[${context}]`, message, meta || '')
  }
}
