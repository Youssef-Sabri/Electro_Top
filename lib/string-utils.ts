export function getInitials(name: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function translateStatus(status: string, isPublic = false): string {
  let displayStatus = status;
  if (isPublic && status === 'Check Internal Note') {
    displayStatus = 'Pending Review';
  }
  
  const dict: Record<string, string> = {
    'Pending Review': 'قيد المراجعة',
    'Accepted': 'مقبول',
    'Processing': 'قيد التحضير',
    'Delivered': 'تم التوصيل',
    'Declined': 'مرفوض',
    'Check Internal Note': 'قيد الفحص'
  };
  return dict[displayStatus] || displayStatus;
}

export function translateHistoryStatus(status: string): string {
  const dict: Record<string, string> = {
    'Pending Review': 'تم تسجيل الطلب والدفع',
    'Accepted': 'تم قبول وتأكيد الطلب',
    'Processing': 'جاري تحضير الشحنة',
    'Delivered': 'تم توصيل الطلب بنجاح',
    'Declined': 'تم رفض الطلب',
    'Check Internal Note': 'قيد الفحص الداخلي'
  };
  return dict[status] || status;
}
