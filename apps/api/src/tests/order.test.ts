import { createOrderSchema, hasUniqueOrderVariants, productSchema } from '@tota-tamtam/contracts';
import { canAcceptNewOrders, getOrderPauseMessage } from '../utils/orderAcceptance';
import { createOrderNumber, getStatusLabelAr, validateStatusTransition } from '../utils/orderHelpers';

describe('TOTA & TAMTAM order rules', () => {
  it('accepts valid Egyptian checkout data', () => {
    const result = createOrderSchema.safeParse({
      customerName: 'منى أحمد',
      phone: '01012345678',
      altPhone: '',
      deliveryZoneId: 'zone_1',
      area: 'المعادي',
      street: 'شارع 9',
      building: '15',
      floor: '',
      apartment: '',
      landmark: '',
      deliveryNotes: '',
      clientRequestId: '7571863c-683a-4f5d-8272-f57e7dbb1188',
      items: [{ variantId: 'variant_1', quantity: 2 }]
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid phone, empty cart and excessive quantity', () => {
    const result = createOrderSchema.safeParse({
      customerName: 'منى',
      phone: '01912345678',
      deliveryZoneId: 'zone_1',
      area: 'المعادي',
      street: 'شارع 9',
      building: '15',
      clientRequestId: '7571863c-683a-4f5d-8272-f57e7dbb1188',
      items: [{ variantId: 'variant_1', quantity: 100 }]
    });
    expect(result.success).toBe(false);
  });

  it('rejects duplicate variants in one order', () => {
    expect(hasUniqueOrderVariants([{ variantId: 'variant_1' }, { variantId: 'variant_1' }])).toBe(false);
    expect(hasUniqueOrderVariants([{ variantId: 'variant_1' }, { variantId: 'variant_2' }])).toBe(true);
  });

  it('requires at least one size/color variant and non-negative stock', () => {
    expect(productSchema.safeParse({
      name: 'فستان صيفي',
      slug: 'summer-dress',
      basePrice: 500,
      categoryId: 'category_1',
      variants: []
    }).success).toBe(false);

    expect(productSchema.safeParse({
      name: 'فستان صيفي',
      slug: 'summer-dress',
      basePrice: 500,
      categoryId: 'category_1',
      variants: [{ sku: 'TT-001', size: 'M', color: 'وردي', stock: -1, isActive: true }]
    }).success).toBe(false);
  });

  it('enforces the order status workflow', () => {
    expect(validateStatusTransition('pending', 'confirmed')).toBe(true);
    expect(validateStatusTransition('confirmed', 'preparing')).toBe(true);
    expect(validateStatusTransition('ready', 'out_for_delivery')).toBe(true);
    expect(validateStatusTransition('out_for_delivery', 'delivered')).toBe(true);
    expect(validateStatusTransition('pending', 'delivered')).toBe(false);
    expect(validateStatusTransition('delivered', 'cancelled')).toBe(false);
    expect(getStatusLabelAr('ready')).toBe('جاهز للتوصيل');
  });

  it('creates branded unique order numbers', () => {
    const first = createOrderNumber();
    const second = createOrderNumber();
    expect(first).toMatch(/^TT-\d{8}-[A-Z0-9]+$/);
    expect(first).not.toBe(second);
  });

  it('blocks new orders while accepting orders is off', () => {
    const settings = {
      isAcceptingOrders: false,
      closedMessage: 'الطلبات متوقفة الآن',
      acceptingOrdersStartsAt: null
    };

    expect(canAcceptNewOrders(settings)).toBe(false);
    expect(getOrderPauseMessage(settings)).toBe('الطلبات متوقفة الآن');
  });

  it('shows restart time and automatically accepts orders after it passes', () => {
    const now = new Date('2026-08-04T10:00:00.000Z');
    const futureSettings = {
      isAcceptingOrders: false,
      closedMessage: 'الطلبات متوقفة الآن',
      acceptingOrdersStartsAt: new Date('2026-08-04T12:00:00.000Z')
    };
    const pastSettings = {
      ...futureSettings,
      acceptingOrdersStartsAt: new Date('2026-08-04T09:00:00.000Z')
    };

    expect(canAcceptNewOrders(futureSettings, now)).toBe(false);
    expect(getOrderPauseMessage(futureSettings, now)).toContain('نبدأ استقبال الطلبات الجديدة');
    expect(canAcceptNewOrders(pastSettings, now)).toBe(true);
    expect(getOrderPauseMessage(pastSettings, now)).toBeNull();
  });
});
