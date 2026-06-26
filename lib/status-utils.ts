import type { OrderStatus } from '@/types'
import { VALID_ORDER_STATUSES } from '@/lib/db-constants'

const STATUS_LABELS: Record<OrderStatus, string> = {
  'Pending Review': 'قيد المراجعة',
  'Accepted': 'مقبول',
  'Processing': 'قيد التحضير',
  'Delivered': 'تم التوصيل',
  'Declined': 'مرفوض',
  'Check Internal Note': 'قيد الفحص',
}

const HISTORY_LABELS: Record<OrderStatus, string> = {
  'Pending Review': 'تم تسجيل الطلب والدفع',
  'Accepted': 'تم قبول وتأكيد الطلب',
  'Processing': 'جاري تحضير الشحنة',
  'Delivered': 'تم توصيل الطلب بنجاح',
  'Declined': 'تم رفض الطلب',
  'Check Internal Note': 'قيد الفحص الداخلي',
}

export const STATUS_OPTIONS = [
  { value: 'All', label: 'الكل' },
  ...VALID_ORDER_STATUSES.map(status => ({
    value: status,
    label: STATUS_LABELS[status as OrderStatus]
  }))
]

export function translateStatus(status: string, isPublic = false): string {
  let displayStatus = status
  if (isPublic && status === 'Check Internal Note') {
    displayStatus = 'Pending Review'
  }
  return STATUS_LABELS[displayStatus as OrderStatus] || displayStatus
}

export function translateHistoryStatus(status: string): string {
  return HISTORY_LABELS[status as OrderStatus] || status
}

export function publicStatus(status: string): OrderStatus {
  return (status === 'Check Internal Note' ? 'Pending Review' : status) as OrderStatus
}
