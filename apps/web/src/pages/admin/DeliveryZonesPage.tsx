import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createAdminDeliveryZone, deleteAdminDeliveryZone, getAdminDeliveryZones, updateAdminDeliveryZone } from '../../lib/api';
import { useToastStore } from '../../store/toastStore';
import type { DeliveryZone } from '../../types';

const empty = { name: '', fee: 0, minimumOrder: 0, isActive: true };

export default function DeliveryZonesPage() {
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const toast = useToastStore((state) => state.addToast);
  const { data: zones = [], refetch } = useQuery<DeliveryZone[]>({ queryKey: ['admin-zones'], queryFn: getAdminDeliveryZones });
  const save = useMutation({
    mutationFn: () => editingId ? updateAdminDeliveryZone(editingId, form) : createAdminDeliveryZone(form),
    onSuccess: () => { toast('تم حفظ منطقة التوصيل', 'success'); setEditingId(null); setForm(empty); refetch(); },
    onError: (error: unknown) => toast((error as { response?: { data?: { error?: string } } }).response?.data?.error || 'تعذر الحفظ', 'error')
  });
  const remove = useMutation({ mutationFn: deleteAdminDeliveryZone, onSuccess: (data) => { toast(data.message, 'success'); refetch(); } });

  const reset = () => {
    setEditingId(null);
    setForm(empty);
  };

  return (
    <div>
      <div className="admin-page-heading">
        <div>
          <p>الشحن والتوصيل</p>
          <h1>مناطق التوصيل</h1>
          <span>حددي الأماكن التي يمكن التوصيل لها، ورسوم الشحن والحد الأدنى لكل منطقة.</span>
        </div>
      </div>

      <form onSubmit={(event) => { event.preventDefault(); save.mutate(); }} className="admin-panel mt-6">
        <div className="admin-section-title">
          <div>
            <h2>{editingId ? 'تعديل منطقة توصيل' : 'إضافة منطقة توصيل'}</h2>
            <p>هذه القيم تظهر للعميل في checkout عند اختيار منطقة التوصيل.</p>
          </div>
          {editingId && <span className="admin-badge">وضع التعديل</span>}
        </div>

        <div className="admin-form-grid">
          <label className="admin-field">
            <span>اسم المنطقة *</span>
            <small>اسم المكان الذي يختاره العميل، مثل المنصورة أو القاهرة.</small>
            <input className="form-input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="المنصورة" required />
          </label>

          <label className="admin-field">
            <span>رسوم التوصيل *</span>
            <small>قيمة الشحن بالجنيه التي تضاف على الطلب لهذه المنطقة.</small>
            <input className="form-input" type="number" min={0} step=".01" value={form.fee} onChange={(event) => setForm({ ...form, fee: Number(event.target.value) })} placeholder="50" />
          </label>

          <label className="admin-field">
            <span>الحد الأدنى للطلب *</span>
            <small>أقل قيمة منتجات مسموح بها قبل إتمام الطلب في هذه المنطقة.</small>
            <input className="form-input" type="number" min={0} step=".01" value={form.minimumOrder} onChange={(event) => setForm({ ...form, minimumOrder: Number(event.target.value) })} placeholder="200" />
          </label>
        </div>

        <label className={`admin-toggle mt-4 ${form.isActive ? 'is-on' : ''}`}>
          <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
          <span>
            <strong>متاحة للعملاء في checkout</strong>
            <small>لو أغلقت الاختيار، المنطقة لن تظهر أثناء إتمام الطلب.</small>
          </span>
        </label>

        <div className="admin-actions">
          <button className="btn-primary" disabled={save.isPending}>{save.isPending ? 'جاري الحفظ...' : editingId ? 'تحديث المنطقة' : 'إضافة المنطقة'}</button>
          {editingId && <button type="button" className="btn-soft" onClick={reset}>إلغاء التعديل</button>}
        </div>
      </form>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
        {zones.map((zone) => (
          <article key={zone.id} className="admin-panel">
            <div className="flex justify-between gap-3">
              <div>
                <h2 className="font-black text-xl">{zone.name}</h2>
                <p className="text-xs text-text-secondary mt-1">منطقة توصيل</p>
              </div>
              <span className={`admin-status ${zone.isActive ? 'is-success' : 'is-error'}`}>{zone.isActive ? 'متاحة' : 'موقوفة'}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="rounded-xl bg-background p-3"><small className="text-text-secondary">رسوم التوصيل</small><strong className="block mt-1">{Number(zone.fee).toFixed(2)} ج.م</strong></div>
              <div className="rounded-xl bg-background p-3"><small className="text-text-secondary">الحد الأدنى</small><strong className="block mt-1">{Number(zone.minimumOrder).toFixed(2)} ج.م</strong></div>
            </div>
            <div className="flex gap-4 mt-5">
              <button className="text-primary font-bold" onClick={() => { setEditingId(zone.id); setForm({ name: zone.name, fee: Number(zone.fee), minimumOrder: Number(zone.minimumOrder), isActive: zone.isActive }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>تعديل</button>
              <button className="text-error font-bold" onClick={() => window.confirm('حذف أو أرشفة المنطقة؟') && remove.mutate(zone.id)}>حذف</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
