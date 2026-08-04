import { Link } from 'react-router-dom';
import type { Product, ProductSummary } from '../types';
import { assetUrl } from '../lib/api';
import { getProductPricing, money } from '../lib/pricing';

export default function ProductCard({ product }: { product: Product | ProductSummary }) {
  const image = product.images.find((item) => item.isPrimary)?.path || product.images[0]?.path;
  const inStock = product.variants.some((variant) => variant.stock > 0);
  const { originalPrice, currentPrice, hasDiscount, discountPercent } = getProductPricing(product);

  return <Link to={`/product/${product.slug}`} className={`card product-card overflow-hidden group block ${!inStock ? 'product-card-out' : ''}`}>
    <div className="aspect-[4/5] product-media overflow-hidden relative">
      {image ? <img src={assetUrl(image)} alt={product.name} className="product-card-image w-full h-full object-contain p-4 group-hover:scale-[1.03] transition duration-500" width={280} height={350} loading="lazy" decoding="async" /> : <div className="product-image-placeholder w-full h-full grid place-items-center">لا توجد صورة للمنتج</div>}
      {product.category?.name && <span className="absolute top-3 right-3 bg-white/92 backdrop-blur text-primary text-xs font-black rounded-md px-3 py-1 shadow-sm">{product.category.name}</span>}
      {hasDiscount && inStock && <span className="absolute top-3 left-3 bg-secondary text-white text-xs font-black rounded-md px-3 py-1 shadow-sm">خصم {discountPercent}%</span>}
      {!inStock && <span className="absolute top-3 left-3 bg-stone-900 text-white text-xs font-bold rounded-md px-3 py-1">نفدت الكمية</span>}
    </div>
    <div className="p-4 sm:p-5">
      <h3 className="font-black text-base sm:text-lg leading-7 line-clamp-2 min-h-14">{product.name}</h3>
      <div className="mt-4 flex items-end justify-between gap-3"><div>{hasDiscount && <del className="block text-xs text-text-secondary font-bold">{money(originalPrice)}</del>}<p className="text-primary font-black">{money(currentPrice)}</p></div><span className={`text-xs font-black rounded-md px-3 py-1 transition ${inStock ? 'text-text-secondary bg-background group-hover:bg-primary group-hover:text-white' : 'bg-stone-100 text-stone-500'}`}>{inStock ? (hasDiscount ? 'عرض خاص' : 'عرض المنتج') : 'نفد'}</span></div>
    </div>
  </Link>;
}
