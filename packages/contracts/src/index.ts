import { z } from 'zod';

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'rejected'
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const egyptianPhoneSchema = z
  .string()
  .trim()
  .regex(/^01[0125][0-9]{8}$/, 'رقم الهاتف المصري غير صحيح');

export const adminLoginSchema = z.object({
  email: z.string().trim().email('البريد الإلكتروني غير صحيح').max(160),
  password: z.string().min(8, 'كلمة المرور لا تقل عن 8 أحرف').max(128)
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'اسم القسم مطلوب').max(80),
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'الرابط المختصر يجب أن يكون حروفًا إنجليزية وأرقامًا'),
  image: z.string().trim().max(500).optional().nullable(),
  sortOrder: z.number().int().min(0).max(10000).default(0),
  isActive: z.boolean().default(true)
});

export const variantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().trim().min(2, 'كود SKU مطلوب').max(80),
  size: z.string().trim().min(1, 'المقاس مطلوب').max(40),
  color: z.string().trim().min(1, 'اللون مطلوب').max(60),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'كود اللون غير صحيح').optional().nullable(),
  price: z.number().positive('سعر التنويعة يجب أن يكون أكبر من صفر').max(1_000_000).optional().nullable(),
  stock: z.number().int().min(0, 'المخزون لا يمكن أن يكون سالبًا').max(1_000_000),
  isActive: z.boolean().default(true)
});

export const productSchema = z.object({
  name: z.string().trim().min(2, 'اسم المنتج مطلوب').max(160),
  slug: z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'الرابط المختصر يجب أن يكون حروفًا إنجليزية وأرقامًا'),
  description: z.string().trim().max(5000).optional().nullable(),
  basePrice: z.number().positive('السعر يجب أن يكون أكبر من صفر').max(1_000_000),
  categoryId: z.string().min(1, 'القسم مطلوب'),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(10000).default(0),
  variants: z.array(variantSchema).min(1, 'أضف مقاسًا ولونًا واحدًا على الأقل').max(200)
});

export const deliveryZoneSchema = z.object({
  name: z.string().trim().min(2, 'اسم المنطقة مطلوب').max(100),
  fee: z.number().min(0, 'رسوم التوصيل لا يمكن أن تكون سالبة').max(100_000),
  minimumOrder: z.number().min(0, 'الحد الأدنى لا يمكن أن يكون سالبًا').max(1_000_000),
  isActive: z.boolean().default(true)
});

export const storeSettingsSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: egyptianPhoneSchema,
  whatsapp: z.string().trim().regex(/^20?1[0125][0-9]{8}$/, 'رقم واتساب غير صحيح'),
  address: z.string().trim().min(5).max(500),
  isAcceptingOrders: z.boolean(),
  closedMessage: z.string().trim().min(5).max(500),
  acceptingOrdersStartsAt: z.preprocess(
    (value) => value === '' ? null : value,
    z.coerce.date().nullable().optional()
  )
});

export const orderItemInputSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(99)
});

export const createOrderSchema = z.object({
  customerName: z.string().trim().min(2, 'الاسم مطلوب').max(120),
  phone: egyptianPhoneSchema,
  altPhone: z.union([egyptianPhoneSchema, z.literal('')]).optional(),
  deliveryZoneId: z.string().min(1, 'منطقة التوصيل مطلوبة'),
  area: z.string().trim().min(2, 'المنطقة أو الحي مطلوب').max(120),
  street: z.string().trim().min(2, 'اسم الشارع مطلوب').max(160),
  building: z.string().trim().min(1, 'رقم المبنى مطلوب').max(60),
  floor: z.string().trim().max(30).optional(),
  apartment: z.string().trim().max(30).optional(),
  landmark: z.string().trim().max(250).optional(),
  deliveryNotes: z.string().trim().max(500).optional(),
  clientRequestId: z.string().uuid('معرف الطلب غير صحيح'),
  items: z.array(orderItemInputSchema).min(1, 'السلة فارغة').max(100)
});

export const hasUniqueOrderVariants = (items: Array<{ variantId: string }>) =>
  new Set(items.map((item) => item.variantId)).size === items.length;

export const trackOrderSchema = z.object({
  orderNumber: z.string().trim().min(5).max(40),
  phoneLastFour: z.string().regex(/^[0-9]{4}$/, 'أدخل آخر 4 أرقام من الهاتف')
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(500).optional()
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type VariantInput = z.infer<typeof variantSchema>;
export type DeliveryZoneInput = z.infer<typeof deliveryZoneSchema>;
export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
