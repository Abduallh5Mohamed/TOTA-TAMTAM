import { Link } from 'react-router-dom';
import { assetUrl } from '../lib/api';
import { useCartStore } from '../store/cartStore';
import { money } from '../lib/pricing';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, getSubtotal } = useCartStore();
  const subtotal = getSubtotal();
  const hasUnavailableItems = items.some((item) => item.variant.stock <= 0 || item.quantity > item.variant.stock);
  if (items.length === 0) return <div className="cart-empty page-shell"><span>سلتك جاهزة لاختياراتك</span><h1>السلة فارغة</h1><p>اختاري القطع التي تحبيها وارجعي هنا لإتمام طلبك.</p><Link className="btn-primary" to="/shop">ابدئي التسوق</Link></div>;
  return <div className="cart-page page-shell"><header className="cart-heading"><div><p>اختياراتك الحالية</p><h1>سلة التسوق</h1><span>{items.length} {items.length === 1 ? 'منتج' : 'منتجات'} في السلة</span></div><button type="button" onClick={() => window.confirm('هل تريدين إفراغ السلة بالكامل؟') && clearCart()}>إفراغ السلة</button></header>
    {hasUnavailableItems && <div className="cart-stock-alert"><strong>بعض اختياراتك غير متاحة بالكمية المطلوبة.</strong><span>عدّلي الكمية أو احذفي القطعة قبل إتمام الطلب.</span></div>}
    <div className="cart-layout"><div className="cart-items">{items.map((item) => { const isSoldOut = item.variant.stock <= 0; const exceedsStock = item.quantity > item.variant.stock; return <article key={item.id} className={`cart-item ${isSoldOut ? 'is-sold-out' : ''}`}><Link to={`/product/${item.productSlug}`} className="cart-image">{item.image ? <img src={assetUrl(item.image)} alt={item.productName} width={120} height={145} loading="lazy" /> : <span>لا توجد صورة</span>}</Link><div className="cart-item-info"><div className="cart-item-top"><div><Link to={`/product/${item.productSlug}`}><h2>{item.productName}</h2></Link><p>{item.variant.color} · المقاس {item.variant.size}</p><small className={isSoldOut || exceedsStock ? 'is-error' : ''}>{isSoldOut ? 'نفدت الكمية' : `المتاح حاليًا: ${item.variant.stock}`}</small></div><button type="button" onClick={() => removeItem(item.id)}>حذف</button></div><div className="cart-item-bottom"><div className="cart-quantity"><button type="button" disabled={item.quantity <= 1 || isSoldOut} aria-label={`تقليل كمية ${item.productName}`} onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button><strong>{item.quantity}</strong><button type="button" disabled={isSoldOut || item.quantity >= item.variant.stock} aria-label={`زيادة كمية ${item.productName}`} onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button></div><div><span>{money(item.unitPrice)} للقطعة</span><strong>{money(item.unitPrice * item.quantity)}</strong></div></div></div></article>; })}</div>
      <aside className="cart-summary"><h2>ملخص الطلب</h2><div><span>إجمالي المنتجات</span><strong>{money(subtotal)}</strong></div><div><span>رسوم التوصيل</span><small>تظهر بعد اختيار المنطقة</small></div><div className="cart-summary-total"><span>الإجمالي الحالي</span><strong>{money(subtotal)}</strong></div>{hasUnavailableItems ? <button type="button" className="btn-primary" disabled>عدلي الكمية أولًا</button> : <Link className="btn-primary" to="/checkout">استكمال بيانات الطلب</Link>}<Link className="cart-continue" to="/shop">إضافة منتجات أخرى</Link></aside>
    </div>
  </div>;
}
