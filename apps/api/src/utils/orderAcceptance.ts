export type OrderAcceptanceSettings = {
  isAcceptingOrders: boolean;
  closedMessage: string;
  acceptingOrdersStartsAt: Date | null;
};

export function canAcceptNewOrders(settings: OrderAcceptanceSettings | null, now = new Date()) {
  if (!settings) return true;
  if (settings.isAcceptingOrders) return true;
  if (settings.acceptingOrdersStartsAt && settings.acceptingOrdersStartsAt <= now) return true;
  return false;
}

export function formatAcceptingStartsAt(date: Date) {
  return date.toLocaleString('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Cairo'
  });
}

export function getOrderPauseMessage(settings: OrderAcceptanceSettings | null, now = new Date()) {
  if (canAcceptNewOrders(settings, now)) return null;
  const message = settings?.closedMessage || 'عذرًا، المتجر لا يستقبل طلبات جديدة حاليًا';
  if (settings?.acceptingOrdersStartsAt) {
    return `${message} نبدأ استقبال الطلبات الجديدة يوم ${formatAcceptingStartsAt(settings.acceptingOrdersStartsAt)}.`;
  }
  return message;
}
