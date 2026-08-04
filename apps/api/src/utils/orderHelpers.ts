import type { OrderStatus } from '@prisma/client';

const transitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled', 'rejected'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
  rejected: []
};

export function validateStatusTransition(from: OrderStatus, to: OrderStatus) {
  return transitions[from].includes(to);
}

export function getStatusLabelAr(status: OrderStatus) {
  return {
    pending: 'طلب جديد',
    confirmed: 'تم التأكيد',
    preparing: 'قيد التجهيز',
    ready: 'جاهز للتوصيل',
    out_for_delivery: 'خرج للتوصيل',
    delivered: 'تم التسليم',
    cancelled: 'ملغي',
    rejected: 'مرفوض'
  }[status];
}

export function createOrderNumber() {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const unique = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
  return `TT-${stamp}-${unique}`;
}
