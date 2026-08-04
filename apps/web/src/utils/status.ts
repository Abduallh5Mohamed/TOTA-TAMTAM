import type { OrderStatus } from '@tota-tamtam/contracts';

export const statusLabels: Record<OrderStatus, string> = {
  pending: 'طلب جديد',
  confirmed: 'تم التأكيد',
  preparing: 'قيد التجهيز',
  ready: 'جاهز للتوصيل',
  out_for_delivery: 'خرج للتوصيل',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
  rejected: 'مرفوض'
};

export const getStatusLabelAr = (status: OrderStatus) => statusLabels[status];
