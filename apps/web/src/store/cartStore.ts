import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product, ProductVariant } from '../types';

interface CartState {
  items: CartItem[];
  addItem: (product: Product, variant: ProductVariant, quantity: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const variantPrice = (product: Product, variant: ProductVariant) =>
  Number(variant.price ?? product.basePrice);

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, variant, quantity) => {
        if (variant.stock <= 0 || quantity <= 0) return;
        const safeQuantity = Math.max(1, Math.min(quantity, variant.stock));
        set((state) => {
          const existing = state.items.find((item) => item.variant.id === variant.id);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.id === existing.id
                  ? { ...item, quantity: Math.min(item.quantity + safeQuantity, variant.stock), variant }
                  : item
              )
            };
          }
          const image = product.images.find((item) => item.isPrimary)?.path || product.images[0]?.path || null;
          return {
            items: [
              ...state.items,
              {
                id: variant.id,
                productId: product.id,
                productSlug: product.slug,
                productName: product.name,
                image,
                variant,
                unitPrice: variantPrice(product, variant),
                quantity: safeQuantity
              }
            ]
          };
        });
      },
      removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items
            .filter((item) => item.id !== id || item.variant.stock > 0)
            .map((item) =>
              item.id === id
                ? { ...item, quantity: Math.max(1, Math.min(quantity, item.variant.stock)) }
                : item
            )
        })),
      clearCart: () => set({ items: [] }),
      getSubtotal: () =>
        Number(get().items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2)),
      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0)
    }),
    { name: 'tota-tamtam-cart' }
  )
);
