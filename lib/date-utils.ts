function safeDate(date: string): Date | null {
  const d = new Date(date)
  return Number.isNaN(d.getTime()) ? null : d
}

export function now(): string {
  return new Date().toISOString()
}

export function todayStamp(): string {
  return now().split('T')[0]
}

export function formatOrderDate(date: string, options?: { includeTime?: boolean }): string {
  const d = safeDate(date)
  if (!d) return date
  return d.toLocaleDateString('ar-EG', {
    month: 'short', day: 'numeric', year: 'numeric',
    ...(options?.includeTime ? { hour: 'numeric', minute: 'numeric' } : {}),
  })
}

export function formatOrderTimestamp(date: string): string {
  return formatOrderDate(date, { includeTime: true })
}
