import type { Product, ProductSummary, ProductVariant, ProductVariantSummary } from '../types';

type ProductWithPrice = Product | ProductSummary;
type VariantWithPrice = ProductVariant | ProductVariantSummary;

export const money = (value: number) => `${value.toFixed(2)} ج.م`;

export const getVariantSalePrice = (product: ProductWithPrice, variant?: VariantWithPrice | null) =>
  Number(variant?.price ?? product.basePrice);

export const getProductPricing = (product: ProductWithPrice) => {
  const originalPrice = Number(product.basePrice);
  const variantPrices = product.variants.map((variant) => getVariantSalePrice(product, variant));
  const currentPrice = variantPrices.length ? Math.min(...variantPrices) : originalPrice;
  const hasDiscount = currentPrice < originalPrice;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;

  return { originalPrice, currentPrice, hasDiscount, discountPercent };
};
