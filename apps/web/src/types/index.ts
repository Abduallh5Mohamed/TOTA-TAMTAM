import type { OrderStatus } from '@tota-tamtam/contracts';

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
}

export interface ProductImage {
  id: string;
  path: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  size: string;
  color: string;
  colorHex: string | null;
  price: string | number | null;
  stock: number;
  isActive: boolean;
}

export interface ProductVariantSummary {
  id: string;
  price: string | number | null;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: string | number;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  category?: Category;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: string | number;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  category?: Pick<Category, 'id' | 'name' | 'slug'>;
  images: ProductImage[];
  variants: ProductVariantSummary[];
}

export interface ProductListResponse {
  items: ProductSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DeliveryZone {
  id: string;
  name: string;
  fee: string | number;
  minimumOrder: string | number;
  isActive: boolean;
}

export interface StoreSettings {
  name: string;
  phone: string;
  whatsapp: string;
  address: string;
  isAcceptingOrders: boolean;
  closedMessage: string;
  acceptingOrdersStartsAt: string | null;
}

export interface CartItem {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  image: string | null;
  variant: ProductVariant;
  unitPrice: number;
  quantity: number;
}

export interface OrderItem {
  id: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  sizeSnapshot: string;
  colorSnapshot: string;
  imageSnapshot: string | null;
  quantity: number;
  unitPrice: string | number;
  totalPrice: string | number;
}

export interface OrderStatusHistory {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  note: string | null;
  changedAt: string;
  changedBy?: { name: string } | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customerName: string;
  phone: string;
  altPhone: string | null;
  deliveryZoneId: string;
  deliveryZoneName: string;
  area: string;
  street: string;
  building: string;
  floor: string | null;
  apartment: string | null;
  landmark: string | null;
  deliveryNotes: string | null;
  subtotal: string | number;
  deliveryFee: string | number;
  total: string | number;
  paymentMethod: 'cash_on_delivery';
  paymentStatus: 'unpaid' | 'paid';
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  statusHistory: OrderStatusHistory[];
  deliveryZone?: DeliveryZone;
}

export interface DashboardStats {
  newOrders: number;
  activeOrders: number;
  completedOrders: number;
  todayRevenue: number;
  avgOrderValue: number;
  lowStock: number;
}
