import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { OrderStatus } from '@tota-tamtam/contracts';
import { assetUrl, getAdminOrder, updateAdminOrderStatus } from '../../lib/api';
import { getStatusLabelAr } from '../../utils/status';
import { useToastStore } from '../../store/toastStore';
import type { Order } from '../../types';

const nextStatuses: Record<OrderStatus, OrderStatus[]> = { pending: ['confirmed', 'rejected', 'cancelled'], confirmed: ['preparing', 'cancelled'], preparing: ['ready', 'cancelled'], ready: ['out_for_delivery', 'cancelled'], out_for_delivery: ['delivered', 'cancelled'], delivered: [], cancelled: [], rejected: [] };

export default function OrderDetailPage() {
  const { id = '' } = useParams();
  const toast = useToastStore((state) => state.addToast);
  const [reasonStatus, setReasonStatus] = useState<OrderStatus | null>(null);
  const [reason, setReason] = useState('');
  const { data: order, isLoading, isError, refetch } = useQuery<Order>({ queryKey: ['admin-order', id], queryFn: () => getAdminOrder(id) });
  const mutation = useMutation({ mutationFn: ({ status, note }: { status: OrderStatus; note?: string }) => updateAdminOrderStatus(id, { status, note }), onSuccess: (_, variables) => { toast(variables.status === 'rejected' ? 'تم رفض الطلب وإظهار السبب للعميل.' : 'تم تحديث حالة الطلب.', 'success'); setReasonStatus(null); setReason(''); refetch(); }, onError: (error: unknown) => toast((error as { response?: { data?: { error?: string } } }).response?.data?.error || 'تعذر تحديث الطلب.', 'error') });
  if (isLoading) return <p className="admin-loading">جاري تحميل الطلب...</p>;
  if (isError || !order) return <div className="admin-panel">الطلب غير موجود. <Link className="text-primary" to="/admin/orders">العودة للطلبات</Link></div>;
  const changeStatus = (status: OrderStatus) => { if (status === 'cancelled' || status === 'rejected') { setReasonStatus(status); setReason(''); return; } mutation.mutate({ status }); };
  const submitReason = () => { if (!reason.trim()) { toast('اكتب سبب الرفض أو الإلغاء أولًا.', 'error'); return; } if (reasonStatus) mutation.mutate({ status: reasonStatus, note: reason.trim() }); };
  const address = `${order.area}، ${order.street}، مبنى ${order.building}${order.floor ? `، الدور ${order.floor}` : ''}${order.apartment ? `، شقة ${order.apartment}` : ''}`;
  return <div className="admin-order-detail">
    <div className="admin-page-heading"><div><Link className="admin-back-link" to="/admin/orders">كل الطلبات</Link><p className="mt-3">تفاصيل الطلب</p><h1 dir="ltr">{order.orderNumber}</h1><span>{new Date(order.createdAt).toLocaleString('ar-EG')}</span></div><div className="admin-order-actions print-hidden"><button type="button" className="btn-soft" onClick={() => window.print()}>طباعة</button><span className="admin-status is-primary">{getStatusLabelAr(order.status)}</span></div></div>
    {nextStatuses[order.status].length > 0 && <section className="admin-status-change print-hidden"><div><strong>تحديث حالة الطلب</strong><span>اختاري المرحلة التالية للطلب. الرفض أو الإلغاء يتطلبان كتابة سبب واضح للعميل.</span></div><div>{nextStatuses[order.status].map((status) => <button key={status} type="button" disabled={mutation.isPending} onClick={() => changeStatus(status)} className={status === 'rejected' || status === 'cancelled' ? 'is-danger' : ''}>{getStatusLabelAr(status)}</button>)}</div></section>}
    <div className="admin-order-grid"><section className="admin-panel admin-order-items"><h2>المنتجات</h2>{order.items.map((item) => <article key={item.id}><div className="admin-order-image">{item.imageSnapshot && <img src={assetUrl(item.imageSnapshot)} alt="" />}</div><div><strong>{item.productNameSnapshot}</strong><p>{item.colorSnapshot} · مقاس {item.sizeSnapshot} · {item.skuSnapshot}</p><small>{Number(item.unitPrice).toFixed(2)} × {item.quantity}</small></div><b>{Number(item.totalPrice).toFixed(2)} ج.م</b></article>)}<div className="admin-order-total"><div><span>المنتجات</span><strong>{Number(order.subtotal).toFixed(2)} ج.م</strong></div><div><span>التوصيل</span><strong>{Number(order.deliveryFee).toFixed(2)} ج.م</strong></div><div><span>الإجمالي</span><strong>{Number(order.total).toFixed(2)} ج.م</strong></div></div></section>
      <aside className="admin-order-side"><section className="admin-panel"><h2>بيانات العميل</h2><strong>{order.customerName}</strong><p dir="ltr">{order.phone}</p>{order.altPhone && <p dir="ltr">{order.altPhone}</p>}</section><section className="admin-panel"><h2>عنوان التوصيل</h2><p>{address}</p>{order.landmark && <p><b>علامة مميزة:</b> {order.landmark}</p>}{order.deliveryNotes && <p><b>ملاحظات:</b> {order.deliveryNotes}</p>}</section><section className="admin-panel"><h2>سجل حالة الطلب</h2><div className="admin-order-history">{order.statusHistory.map((item) => <article key={item.id}><span /><div><strong>{getStatusLabelAr(item.toStatus)}</strong><time>{new Date(item.changedAt).toLocaleString('ar-EG')}</time>{item.note && <p>{item.note}</p>}</div></article>)}</div></section></aside>
    </div>
    {reasonStatus && <div className="admin-dialog-backdrop" role="presentation"><section className="admin-reason-dialog" role="dialog" aria-modal="true" aria-labelledby="order-reason-title"><button type="button" className="admin-dialog-close" onClick={() => setReasonStatus(null)} aria-label="إغلاق">×</button><p>{reasonStatus === 'rejected' ? 'رفض الطلب' : 'إلغاء الطلب'}</p><h2 id="order-reason-title">اكتب السبب الذي سيظهر للعميل</h2><span>سيظهر هذا السبب في صفحة تتبع الطلب حتى يعرف العميل ما حدث بوضوح.</span><label htmlFor="order-status-reason">سبب {reasonStatus === 'rejected' ? 'الرفض' : 'الإلغاء'}</label><textarea id="order-status-reason" className="form-input" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} placeholder="مثال: المقاس المطلوب غير متاح حاليًا." autoFocus /><small>{reason.length}/500</small><div><button type="button" className="btn-soft" onClick={() => setReasonStatus(null)}>رجوع</button><button type="button" className="btn-primary" disabled={mutation.isPending || !reason.trim()} onClick={submitReason}>{mutation.isPending ? 'جاري الحفظ...' : 'تأكيد وإظهار السبب للعميل'}</button></div></section></div>}
  </div>;
}
