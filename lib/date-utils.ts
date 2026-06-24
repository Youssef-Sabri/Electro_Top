export function now(): string {
  return new Date().toISOString()
}

export function todayStamp(): string {
  return now().split('T')[0]
}

export function formatOrderDate(date: string): string {
  return new Date(date).toLocaleDateString('ar-EG', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function formatOrderTimestamp(date: string): string {
  return new Date(date).toLocaleDateString('ar-EG', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: 'numeric',
  })
}
