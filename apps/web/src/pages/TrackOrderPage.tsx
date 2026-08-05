import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { getStatusLabelAr } from '../utils/status';
import { trackOrder } from '../lib/api';
import type { Order } from '../types';
import { money } from '../lib/pricing';

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phoneLastFour, setPhoneLastFour] = useState('');
  const mutation = useMutation<Order, Error>({ mutationFn: () => trackOrder({ orderNumber: orderNumber.trim(), phoneLastFour }) });
  const apiError = (mutation.error as { response?: { data?: { error?: string } } } | null)?.response?.data?.error;
  return <main className="track-page">
    <header className="track-heading"><p>نحن معك خطوة بخطوة</p><h1>تتبّع طلبك</h1><span>اكتبي رقم الطلب، ثم آخر 4 أرقام من نفس رقم الهاتف الذي سجلتِ به الطلب.</span></header>
    <form onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }} className="track-form" noValidate>
      <label className="admin-field"><span>رقم الطلب</span><small>ستجدينه في رسالة تأكيد الطلب. يبدأ عادةً بـ TT-</small><input className="form-input" dir="ltr" value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="TT-20260804-..." required /></label>
      <label className="admin-field"><span>آخر 4 أرقام من رقم الهاتف</span><small>مثال: رقم 01012345678، اكتبي 5678.</small><input className="form-input" dir="ltr" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} value={phoneLastFour} onChange={(event) => setPhoneLastFour(event.target.value.replace(/\D/g, ''))} placeholder="5678" required /></label>
      <button className="btn-primary track-submit" disabled={mutation.isPending || !orderNumber.trim() || phoneLastFour.length !== 4}>{mutation.isPending ? 'جاري البحث...' : 'عرض حالة الطلب'}</button>
    </form>
    {mutation.isError && <p className="track-error">{apiError || 'لم نعثر على الطلب. راجعي رقم الطلب وآخر 4 أرقام من الهاتف.'}</p>}
    {mutation.data && <section className="track-result"><div className="track-summary"><div><p>رقم الطلب</p><strong dir="ltr">{mutation.data.orderNumber}</strong></div><span className="admin-status is-primary">{getStatusLabelAr(mutation.data.status)}</span></div><div className="track-timeline"><h2>مراحل الطلب</h2><div className="track-steps">{mutation.data.statusHistory.map((history) => <article key={history.id} className="track-step"><span aria-hidden="true" /><div><strong>{getStatusLabelAr(history.toStatus)}</strong><time>{new Date(history.changedAt).toLocaleString('ar-EG')}</time>{history.note && <p>{history.note}</p>}</div></article>)}</div></div><div className="track-total"><span>الإجمالي عند الاستلام</span><strong>{money(Number(mutation.data.total))}</strong></div></section>}
  </main>;
}
