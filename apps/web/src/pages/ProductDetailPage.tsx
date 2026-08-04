import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { assetUrl, getProduct } from '../lib/api';
import { getVariantSalePrice, money } from '../lib/pricing';
import { useCartStore } from '../store/cartStore';
import { useToastStore } from '../store/toastStore';
import type { Product } from '../types';

export default function ProductDetailPage() {
  const { slug = '' } = useParams();
  const { data: product, isLoading, isError } = useQuery<Product>({
    queryKey: ['product', slug],
    queryFn: () => getProduct(slug)
  });
  const [variantId, setVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const addItem = useCartStore((state) => state.addItem);
  const toast = useToastStore((state) => state.addToast);

  const selected = useMemo(
    () => product?.variants.find((variant) => variant.id === variantId),
    [product, variantId]
  );
  const availableVariants = product?.variants.filter((variant) => variant.stock > 0) || [];
  const allOutOfStock = Boolean(product && availableVariants.length === 0);
  const originalPrice = Number(product?.basePrice || 0);
  const selectedPrice = product ? getVariantSalePrice(product, selected) : originalPrice;
  const hasDiscount = Boolean(selected && selectedPrice < originalPrice);

  useEffect(() => {
    if (!product) return;

    const firstAvailable = product.variants.find((variant) => variant.stock > 0);
    const currentIsAvailable = product.variants.some((variant) => variant.id === variantId && variant.stock > 0);

    if (!firstAvailable) {
      setVariantId('');
      setQuantity(1);
      return;
    }

    if (!currentIsAvailable) {
      setVariantId(firstAvailable.id);
      setQuantity(1);
    }
  }, [product, variantId]);

  useEffect(() => {
    if (!selected || selected.stock <= 0) {
      setQuantity(1);
      return;
    }
    setQuantity((value) => Math.min(Math.max(1, value), selected.stock));
  }, [selected]);

  if (isLoading) return <p className="text-center py-24">جاري تحميل المنتج...</p>;
  if (isError || !product) {
    return (
      <div className="text-center py-24">
        <p>المنتج غير موجود.</p>
        <Link className="text-primary font-bold" to="/shop">العودة للمتجر</Link>
      </div>
    );
  }

  const image = product.images[activeImage]?.path;
  const addToCart = () => {
    if (!selected || selected.stock <= 0) {
      toast('الاختيار ده خلص من المخزون حاليًا.', 'error');
      return;
    }
    if (quantity > selected.stock) {
      toast(`المتاح حاليًا ${selected.stock} فقط من هذا الاختيار.`, 'error');
      return;
    }

    addItem(product, selected, quantity);
    toast('تمت إضافة المنتج للسلة', 'success');
  };

  return (
    <div className="product-detail-page max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-8 lg:gap-14">
      <div>
        <div className="product-main-image card overflow-hidden aspect-[4/5] relative">
          {image ? (
            <img src={assetUrl(image)} alt={product.name} className="w-full h-full object-contain" width={600} height={750} fetchPriority="high" />
          ) : (
            <div className="w-full h-full grid place-items-center text-7xl" aria-hidden="true">👗</div>
          )}
          {hasDiscount && !allOutOfStock && <span className="absolute top-4 left-4 rounded-md bg-secondary px-4 py-2 text-sm font-black text-white">عرض خاص</span>}
          {allOutOfStock && <span className="absolute top-4 right-4 rounded-md bg-stone-900 px-4 py-2 text-sm font-black text-white">نفدت الكمية</span>}
        </div>

        {product.images.length > 1 && (
          <div className="flex gap-3 mt-3 overflow-x-auto">
            {product.images.map((item, index) => (
              <button type="button" key={item.id} onClick={() => setActiveImage(index)} aria-label={`عرض الصورة ${index + 1}`} aria-pressed={index === activeImage} className={`w-20 h-20 rounded-xl overflow-hidden border-2 ${index === activeImage ? 'border-primary' : 'border-transparent'}`}>
                <img src={assetUrl(item.path)} alt="" className="w-full h-full object-cover" width={80} height={80} loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="py-3">
        <p className="text-secondary font-bold">{product.category?.name}</p>
        <h1 className="text-3xl sm:text-4xl font-black mt-2">{product.name}</h1>

        <div className="mt-5">
          {hasDiscount && <del className="block text-text-secondary font-black">{money(originalPrice)}</del>}
          <p className="text-3xl text-primary font-black">{money(selectedPrice)}</p>
          {hasDiscount && <span className="inline-flex mt-2 rounded-full bg-secondary/10 text-secondary px-3 py-1 text-xs font-black">السعر بعد الخصم</span>}
        </div>

        <p className="text-text-secondary leading-8 mt-5 whitespace-pre-line">{product.description || 'قطعة مختارة بعناية لتجمع بين الأناقة والراحة.'}</p>

        {allOutOfStock && (
          <div className="mt-6 rounded-xl border border-error/20 bg-error/10 p-4 text-error font-black">
            المنتج ده خلص حاليًا. تقدري تشوفي منتجات تانية من نفس القسم.
          </div>
        )}

        <div className="mt-7">
          <span className="font-extrabold block mb-3">اختاري المقاس واللون</span>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="التنوعات المتاحة">
            {product.variants.map((variant) => {
              const isSoldOut = variant.stock <= 0;
              const salePrice = getVariantSalePrice(product, variant);
              const variantHasDiscount = salePrice < originalPrice;
              return (
                <button
                  type="button"
                  key={variant.id}
                  disabled={isSoldOut}
                  aria-pressed={variant.id === variantId}
                  onClick={() => { setVariantId(variant.id); setQuantity(1); }}
                  className={`text-right rounded-xl border px-3 py-3 transition ${variant.id === variantId ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-white'} ${isSoldOut ? 'opacity-55 line-through cursor-not-allowed bg-stone-50' : 'hover:border-primary-light'}`}
                >
                  <strong className="block">{variant.color} · {variant.size}</strong>
                  <small className="block mt-1 text-text-secondary">{isSoldOut ? 'نفدت الكمية' : `متاح ${variant.stock}`}</small>
                  {variantHasDiscount && <small className="block mt-1 text-secondary font-black">بعد الخصم: {money(salePrice)}</small>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <span className="font-extrabold">الكمية</span>
          <div className="flex items-center border border-border rounded-full p-1">
            <button type="button" aria-label="تقليل الكمية" disabled={!selected || allOutOfStock} className="w-9 h-9 rounded-full bg-background disabled:opacity-40" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
            <span className="w-10 text-center font-black">{quantity}</span>
            <button type="button" aria-label="زيادة الكمية" disabled={!selected || allOutOfStock || quantity >= selected.stock} className="w-9 h-9 rounded-full bg-background disabled:opacity-40" onClick={() => setQuantity((value) => Math.min(selected?.stock || 1, value + 1))}>+</button>
          </div>
          {selected && !allOutOfStock && <small className="text-text-secondary font-bold">المتاح: {selected.stock}</small>}
        </div>

        <div className="product-actions lg:sticky lg:top-24 lg:bg-transparent lg:pb-1">
          <button className="btn-primary w-full mt-8 py-4" disabled={!selected || selected.stock <= 0} onClick={addToCart}>
            {allOutOfStock ? 'نفدت الكمية' : 'إضافة إلى السلة'}
          </button>
        </div>
        <p className="text-center text-xs text-text-secondary mt-3">الدفع نقدًا عند الاستلام</p>
      </div>
    </div>
  );
}
