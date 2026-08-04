import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useToastStore } from '../store/toastStore';
import type { Order } from '../types';

export default function OrderSuccessPage() {
  const { orderNumber = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToastStore((state) => state.addToast);
  const order = (location.state as { order?: Order } | null)?.order;
  const acknowledgementKey = `tota-tamtam-order-number-saved:${orderNumber}`;
  const [hasAcknowledged, setHasAcknowledged] = useState(() => sessionStorage.getItem(acknowledgementKey) === 'true');
  const [leavePromptOpen, setLeavePromptOpen] = useState(false);
  const [destination, setDestination] = useState<string | null>(null);
  const acknowledgedRef = useRef(hasAcknowledged);
  const restoringHistoryRef = useRef(false);

  useEffect(() => {
    acknowledgedRef.current = hasAcknowledged;
  }, [hasAcknowledged]);

  useEffect(() => {
    const guardLinks = (event: MouseEvent) => {
      if (acknowledgedRef.current || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;

      const link = event.target.closest('a[href]') as HTMLAnchorElement | null;
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;

      const targetUrl = new URL(link.href, window.location.href);
      if (targetUrl.origin !== window.location.origin || targetUrl.pathname === location.pathname) return;

      event.preventDefault();
      event.stopPropagation();
      setDestination(`${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`);
      setLeavePromptOpen(true);
    };

    document.addEventListener('click', guardLinks, true);
    return () => document.removeEventListener('click', guardLinks, true);
  }, [location.pathname]);

  useEffect(() => {
    const guardBackNavigation = () => {
      if (acknowledgedRef.current) return;
      if (restoringHistoryRef.current) {
        restoringHistoryRef.current = false;
        return;
      }

      restoringHistoryRef.current = true;
      window.history.go(1);
      setDestination(null);
      setLeavePromptOpen(true);
    };

    window.addEventListener('popstate', guardBackNavigation);
    return () => window.removeEventListener('popstate', guardBackNavigation);
  }, []);

  useEffect(() => {
    if (hasAcknowledged) return;

    const guardUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', guardUnload);
    return () => window.removeEventListener('beforeunload', guardUnload);
  }, [hasAcknowledged]);

  const acknowledgeOrderNumber = () => {
    sessionStorage.setItem(acknowledgementKey, 'true');
    setHasAcknowledged(true);
    toast('تمام، كده رقم الطلب محفوظ وممكن تخرجي بأمان.', 'success');
  };

  const copyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      toast('تم نسخ رقم الطلب. خدي لقطة شاشة أو احفظيه عندك قبل الخروج.', 'success');
    } catch {
      toast('حددي رقم الطلب وانسخيه يدويًا أو خدي لقطة شاشة للرقم.', 'info');
    }
  };

  const confirmLeave = () => {
    sessionStorage.setItem(acknowledgementKey, 'true');
    setHasAcknowledged(true);
    setLeavePromptOpen(false);
    if (destination) navigate(destination);
  };

  const stayHere = () => {
    setLeavePromptOpen(false);
    setDestination(null);
  };

  return (
    <main className="order-success-page">
      <section className="order-success-hero">
        <div className="order-success-mark" aria-hidden="true">✓</div>
        <p className="eyebrow">تم تأكيد طلبك</p>
        <h1>رقم تتبع طلبك جاهز</h1>
        <p className="order-success-intro">
          احتفظي بالرقم ده قبل ما تخرجي من الصفحة، لأنك هتحتاجيه في متابعة حالة الطلب.
        </p>

        <div className="order-number-panel" aria-label="رقم تتبع الطلب">
          <span className="order-number-label">رقم الطلب للتتبع</span>
          <strong className="order-number" dir="ltr">{orderNumber}</strong>
          <div className="order-number-actions">
            <button type="button" className="order-copy-button" onClick={copyOrderNumber}>
              نسخ الرقم
            </button>
            <button type="button" className="order-saved-button" onClick={acknowledgeOrderNumber} disabled={hasAcknowledged}>
              {hasAcknowledged ? 'تم حفظ الرقم' : 'صورت أو حفظت الرقم'}
            </button>
          </div>
        </div>

        {!hasAcknowledged && (
          <div className="order-safety-note" role="status">
            <span aria-hidden="true">!</span>
            <p>
              قبل مغادرة الصفحة لازم تصوري رقم الطلب أو تحفظيه. لو حاولتي تخرجي هنوقفك برسالة تأكيد عشان الرقم مايضيعش.
            </p>
          </div>
        )}

        {hasAcknowledged && (
          <div className="order-safe-state" role="status">
            الرقم اتأكد حفظه. تقدري تتابعي الطلب أو ترجعي للتسوق عادي.
          </div>
        )}

        {order && (
          <div className="order-total-summary" aria-label="ملخص الطلب">
            <div><span>المنتجات</span><strong>{Number(order.subtotal).toFixed(2)} ج.م</strong></div>
            <div><span>التوصيل</span><strong>{Number(order.deliveryFee).toFixed(2)} ج.م</strong></div>
            <div><span>الإجمالي</span><strong>{Number(order.total).toFixed(2)} ج.م</strong></div>
          </div>
        )}

        <div className="order-success-links">
          <Link className="btn-primary text-center" to="/track-order">تتبع الطلب</Link>
          <Link className="btn-soft text-center" to="/shop">متابعة التسوق</Link>
        </div>
      </section>

      {leavePromptOpen && (
        <div className="order-leave-overlay" role="presentation">
          <section className="order-leave-dialog" role="dialog" aria-modal="true" aria-labelledby="leave-dialog-title">
            <div className="order-leave-icon" aria-hidden="true">!</div>
            <p className="eyebrow">استني لحظة</p>
            <h2 id="leave-dialog-title">هل صورتي رقم الطلب؟</h2>
            <p>
              رقم الطلب ده هو طريقة متابعة طلبك. خدي لقطة شاشة أو انسخيه الأول، وبعدها اضغطي تأكيد للخروج.
            </p>
            <div className="leave-order-number" dir="ltr">{orderNumber}</div>
            <div className="order-leave-actions">
              <button type="button" className="btn-soft" onClick={stayHere}>إلغاء، هصور الرقم</button>
              <button type="button" className="btn-primary" onClick={confirmLeave}>موافق، حفظت الرقم</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
