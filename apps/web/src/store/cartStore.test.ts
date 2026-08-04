import { beforeEach, describe, expect, it } from 'vitest';
import { useCartStore } from './cartStore';
import type { Product, ProductVariant } from '../types';

const variant: ProductVariant = {
  id: 'variant-1',
  productId: 'product-1',
  sku: 'TT-001',
  size: 'M',
  color: 'وردي',
  colorHex: '#ff99bb',
  price: null,
  stock: 3,
  isActive: true
};

const product: Product = {
  id: 'product-1',
  name: 'فستان',
  slug: 'dress',
  description: null,
  basePrice: 250,
  categoryId: 'category-1',
  isActive: true,
  isFeatured: false,
  sortOrder: 0,
  images: [],
  variants: [variant]
};

describe('cart store', () => {
  beforeEach(() => {
    localStorage.clear();
    useCartStore.setState({ items: [] });
  });

  it('merges the same variant and calculates totals', () => {
    useCartStore.getState().addItem(product, variant, 1);
    useCartStore.getState().addItem(product, variant, 1);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(2);
    expect(useCartStore.getState().getSubtotal()).toBe(500);
  });

  it('never allows quantity to exceed available stock', () => {
    useCartStore.getState().addItem(product, variant, 20);
    expect(useCartStore.getState().items[0].quantity).toBe(3);
    useCartStore.getState().updateQuantity(variant.id, 99);
    expect(useCartStore.getState().items[0].quantity).toBe(3);
  });

  it('does not add variants that are out of stock', () => {
    useCartStore.getState().addItem(product, { ...variant, stock: 0 }, 1);
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
