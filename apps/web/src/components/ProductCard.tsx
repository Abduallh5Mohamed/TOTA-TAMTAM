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
      {image ? <img src={assetUrl(image)} alt={product.name} className="product-card-image w-full h-full object-contain p-4 group-hover:scale-[1.03] transition duration-500" width={280} height={350} loading="lazy" decoding="async" /> : <div className="product-image-placeholder w-full h-full grid place-items-center"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 7.5 10 5l2 2 2-2 3.5 2.5-2 3V20h-7v-9.5l-2-3Z" /></svg><span>الصورة قيد التجهيز</span></div>}
      {product.category?.name && <span className="product-category-badge">{product.category.name}</span>}
      {hasDiscount && inStock && <span className="product-sale-badge">خصم {discountPercent}%</span>}
      {!inStock && <span className="product-stock-badge">نفدت الكمية</span>}
    </div>
    <div className="product-card-body">
      <div><p className="product-card-label">قطعة مختارة</p><h3>{product.name}</h3></div>
      <div className="product-card-footer"><div>{hasDiscount && <del>{money(originalPrice)}</del>}<p>{money(currentPrice)}</p></div><span className={inStock ? '' : 'is-disabled'} aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6" /></svg></span></div>
    </div>
  </Link>;
}
