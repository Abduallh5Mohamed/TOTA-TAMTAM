import { useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createOrderSchema } from '@tota-tamtam/contracts';
import { z } from 'zod';
import { createOrder, getDeliveryZones, getPublicSettings } from '../lib/api';
import { useCartStore } from '../store/cartStore';
import { useToastStore } from '../store/toastStore';
import type { DeliveryZone, Order, StoreSettings } from '../types';

const checkoutSchema = createOrderSchema.omit({ clientRequestId: true, items: true });
type CheckoutForm = z.infer<typeof checkoutSchema>;
type CheckoutFieldName = Extract<keyof CheckoutForm, string>;

const formatStartsAt = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
};

const closedMessage = (settings?: StoreSettings) => {
  if (!settings || settings.isAcceptingOrders) return '';
  const startsAt = formatStartsAt(settings.acceptingOrdersStartsAt);
  return startsAt ? `${settings.closedMessage} نبدأ استقبال الطلبات الجديدة يوم ${startsAt}.` : settings.closedMessage;
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.getSubtotal());
  const clearCart = useCartStore((state) => state.clearCart);
  const toast = useToastStore((state) => state.addToast);
  const requestId = useRef(crypto.randomUUID());
  const completedOrderRef = useRef(false);

  const { data: zones = [] } = useQuery<DeliveryZone[]>({
    queryKey: ['delivery-zones'],
    queryFn: getDeliveryZones
  });
  const { data: settings, isLoading: isSettingsLoading } = useQuery<StoreSettings>({
    queryKey: ['settings'],
    queryFn: getPublicSettings,
    refetchOnMount: 'always',
    staleTime: 0
  });

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { altPhone: '', floor: '', apartment: '', landmark: '', deliveryNotes: '' }
  });

  const zoneId = watch('deliveryZoneId');
  const zone = zones.find((item) => item.id === zoneId);
  const deliveryFee = Number(zone?.fee || 0);
  const minimumOrder = Number(zone?.minimumOrder || 0);
  const hasUnavailableItems = items.some((item) => item.variant.stock <= 0 || item.quantity > item.variant.stock);
  const isClosed = settings?.isAcceptingOrders === false;
  const pauseMessage = closedMessage(settings);

  const mutation = useMutation<Order, Error, CheckoutForm>({
    mutationFn: (data) => createOrder({
      ...data,
      clientRequestId: requestId.current,
      items: items.map((item) => ({ variantId: item.variant.id, quantity: item.quantity }))
    }),
    onSuccess: (order) => {
      completedOrderRef.current = true;
      navigate(`/order-success/${order.orderNumber}`, { state: { order }, replace: true });
      window.setTimeout(clearCart, 0);
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'تعذر إرسال الطلب';
      toast(message, 'error');
    }
  });

  if ((items.length === 0 || hasUnavailableItems) && !completedOrderRef.current) return <Navigate to="/cart" replace />;

  const field = (name: CheckoutFieldName, label: string, placeholder: string, required = false) => (
    <label className="block" htmlFor={String(name)}>
      <span className="text-sm font-bold">{label}{required ? ' *' : ''}</span>
      <input id={String(name)} className="form-input mt-2" placeholder={placeholder} aria-invalid={Boolean(errors[name])} {...register(name)} />
      {errors[name] && <span className="text-error text-xs mt-1 block">{String(errors[name]?.message)}</span>}
    </label>
  );

  const submitOrder = (data: CheckoutForm) => {
    if (isClosed) {
      toast(pauseMessage || 'المتجر لا يستقبل طلبات جديدة حاليًا', 'error');
      return;
    }
    mutation.mutate(data);
  };

  return (
    <div className="checkout-page max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="text-secondary font-bold">خطوة أخيرة</p>
        <h1 className="text-3xl font-black">بيانات التوصيل</h1>
      </div>

      {isClosed && (
        <div className="checkout-closed-banner mb-6">
          <span aria-hidden="true">⏸</span>
          <div>
            <strong>استقبال الطلبات متوقف مؤقتًا</strong>
            <p>{pauseMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(submitOrder)} className="grid lg:grid-cols-[1fr_360px] gap-7 items-start" noValidate>
        <div className="card p-5 sm:p-7 space-y-6">
          <h2 className="text-xl font-black">بيانات التواصل</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {field('customerName', 'الاسم بالكامل', 'مثال: منى أحمد', true)}
            {field('phone', 'رقم الموبايل', '01xxxxxxxxx', true)}
            {field('altPhone', 'رقم بديل', 'اختياري')}
            <label className="block">
              <span className="text-sm font-bold">منطقة التوصيل *</span>
              <select id="deliveryZoneId" className="form-input mt-2" aria-invalid={Boolean(errors.deliveryZoneId)} {...register('deliveryZoneId')}>
                <option value="">-- اختاري المنطقة --</option>
                {zones.map((item) => <option key={item.id} value={item.id}>{item.name} · {Number(item.fee).toFixed(2)} ج.م</option>)}
              </select>
              {errors.deliveryZoneId && <span className="text-error text-xs">{errors.deliveryZoneId.message}</span>}
            </label>
          </div>

          <h2 className="text-xl font-black border-t border-border pt-6">العنوان بالتفصيل</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {field('area', 'المنطقة / الحي', 'المعادي', true)}
            {field('street', 'اسم الشارع', 'شارع 9', true)}
            {field('building', 'رقم المبنى', '15', true)}
            {field('floor', 'الدور', 'الثاني')}
            {field('apartment', 'الشقة', '4')}
            {field('landmark', 'علامة مميزة', 'بجوار...')}
          </div>

          <label className="block">
            <span className="text-sm font-bold">ملاحظات التوصيل</span>
            <textarea className="form-input mt-2 min-h-24" {...register('deliveryNotes')} placeholder="أي تفاصيل تساعد المندوب..." />
            {errors.deliveryNotes && <span className="text-error text-xs">{errors.deliveryNotes.message}</span>}
          </label>

          <div className="rounded-xl bg-success/10 border border-success/20 text-success p-4 font-bold">💵 الدفع نقدًا عند الاستلام</div>
        </div>

        <aside className="card p-6 lg:sticky lg:top-24">
          <h2 className="text-xl font-black">ملخص الطلب</h2>
          <div className="max-h-64 overflow-y-auto mt-4 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3 text-sm">
                <span>{item.productName} × {item.quantity}<small className="block text-text-secondary">{item.variant.color} · {item.variant.size}</small></span>
                <strong>{(item.unitPrice * item.quantity).toFixed(2)}</strong>
              </div>
            ))}
          </div>

          <div className="border-t border-border mt-5 pt-4 space-y-3 text-sm">
            <div className="flex justify-between"><span>المنتجات</span><strong>{subtotal.toFixed(2)} ج.م</strong></div>
            <div className="flex justify-between"><span>التوصيل</span><strong>{zone ? `${deliveryFee.toFixed(2)} ج.م` : '—'}</strong></div>
            <div className="flex justify-between text-lg border-t border-border pt-4"><span className="font-black">الإجمالي</span><strong className="text-primary">{(subtotal + deliveryFee).toFixed(2)} ج.م</strong></div>
          </div>

          {zone && subtotal < minimumOrder && <p className="bg-warning/10 text-warning rounded-xl p-3 text-xs font-bold mt-4">الحد الأدنى لمنطقة {zone.name}: {minimumOrder.toFixed(2)} ج.م</p>}
          {isClosed && <p className="bg-error/10 text-error rounded-xl p-3 text-xs font-bold mt-4">{pauseMessage}</p>}

          <button
            type="submit"
            className="btn-primary w-full mt-6"
            disabled={mutation.isPending || isSettingsLoading || isClosed || !zone || subtotal < minimumOrder}
          >
            {mutation.isPending ? 'جاري تأكيد الطلب...' : isClosed ? 'استقبال الطلبات متوقف' : 'تأكيد الطلب والدفع عند الاستلام'}
          </button>
        </aside>
      </form>
    </div>
  );
}
