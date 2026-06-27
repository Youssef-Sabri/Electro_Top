export const MAX_FILE_SIZE_MB = 5
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

export const ADMIN_SESSION_TIMEOUT_MS = 55 * 60 * 1000

export const TRACKING_ID_REGEX = /^ET-[A-Z0-9]{10}$/i

export function normalizeTrackingId(id: string): string {
  return id.trim().toUpperCase()
}

export function isValidTrackingId(id: string): boolean {
  return TRACKING_ID_REGEX.test(id)
}
