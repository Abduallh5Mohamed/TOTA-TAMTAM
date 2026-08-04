import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminSettings, updateAdminSettings } from '../../lib/api';
import { useToastStore } from '../../store/toastStore';
import type { StoreSettings } from '../../types';

const initial: StoreSettings = {
  name: 'TOTA & TAMTAM',
  phone: '',
  whatsapp: '',
  address: '',
  isAcceptingOrders: true,
  closedMessage: 'عذرًا، المتجر لا يستقبل طلبات جديدة حاليًا',
  acceptingOrdersStartsAt: null
};

const toDateTimeLocal = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

const toApiDate = (value?: string | null) => value ? new Date(value).toISOString() : null;

const formatStartsAt = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
};

export default function SettingsPage() {
  const [form, setForm] = useState(initial);
  const toast = useToastStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<StoreSettings>({
    queryKey: ['admin-settings'],
    queryFn: getAdminSettings,
    refetchOnMount: 'always'
  });

  useEffect(() => {
    if (data) {
      setForm({
        ...data,
        acceptingOrdersStartsAt: toDateTimeLocal(data.acceptingOrdersStartsAt)
      });
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => updateAdminSettings({
      ...form,
      acceptingOrdersStartsAt: toApiDate(form.acceptingOrdersStartsAt)
    }),
    onSuccess: (settings: StoreSettings) => {
      const normalized = {
        ...settings,
        acceptingOrdersStartsAt: toDateTimeLocal(settings.acceptingOrdersStartsAt)
      };
      setForm(normalized);
      queryClient.setQueryData(['admin-settings'], normalized);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast('تم حفظ إعدادات المتجر وتحديث حالة استقبال الطلبات', 'success');
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'تعذر حفظ الإعدادات';
      toast(message, 'error');
    }
  });

  if (isLoading) return <p className="admin-loading">جاري تحميل الإعدادات...</p>;

  return (
    <div className="max-w-4xl">
      <div className="admin-page-heading">
        <div>
          <p>بيانات وهوية التشغيل</p>
          <h1>إعدادات المتجر</h1>
          <span>تحكم في بيانات التواصل وحالة استقبال الطلبات. إيقاف الطلبات هنا يمنع إنشاء أي طلب جديد من الواجهة أو من الـ API.</span>
        </div>
      </div>

      <form onSubmit={(event) => { event.preventDefault(); save.mutate(); }} className="admin-panel mt-6">
        <div className="admin-section-title">
          <div>
            <h2>بيانات التواصل والهوية</h2>
            <p>أي تعديل هنا يظهر في المتجر العام بعد الحفظ مباشرة.</p>
          </div>
        </div>

        <div className="admin-form-grid">
          <label className="admin-field sm:col-span-2">
            <span>اسم المتجر *</span>
            <small>الاسم الظاهر في الهيدر والفوتر ولوحة الإدارة.</small>
            <input className="form-input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </label>

          <label className="admin-field">
            <span>رقم الهاتف *</span>
            <small>يظهر للعملاء في الهيرو والفوتر، ويُستخدم للاتصال المباشر.</small>
            <input className="form-input" dir="ltr" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="01029290728" required />
          </label>

          <label className="admin-field">
            <span>رقم واتساب *</span>
            <small>اكتب الرقم بصيغة مصرية أو دولية، مثل 201029290728.</small>
            <input className="form-input" dir="ltr" value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} placeholder="201029290728" required />
          </label>
        </div>

        <label className="admin-field mt-4">
          <span>عنوان المتجر *</span>
          <small>يظهر في الفوتر كعنوان تواصل عام للعميل.</small>
          <textarea className="form-input" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} required />
        </label>

        <section className="settings-orders-panel mt-7">
          <div className="admin-section-title">
            <div>
              <h2>حالة استقبال الطلبات</h2>
              <p>لو أوقفت الطلبات، العميل لن يستطيع إرسال طلب جديد. تقدر تحدد موعد اختياري لرجوع استقبال الطلبات.</p>
            </div>
            <span className={`admin-status ${form.isAcceptingOrders ? 'is-success' : 'is-error'}`}>
              {form.isAcceptingOrders ? 'مفتوح' : 'مغلق'}
            </span>
          </div>

          <label className={`admin-toggle mt-4 ${form.isAcceptingOrders ? 'is-on' : ''}`}>
            <input
              type="checkbox"
              checked={form.isAcceptingOrders}
              onChange={(event) => setForm({
                ...form,
                isAcceptingOrders: event.target.checked,
                acceptingOrdersStartsAt: event.target.checked ? null : form.acceptingOrdersStartsAt
              })}
            />
            <span>
              <strong>المتجر يستقبل طلبات جديدة</strong>
              <small>عند إغلاق الاختيار، زر تأكيد الطلب يتقفل للعميل والباك إند يرفض أي طلب جديد.</small>
            </span>
          </label>

          {!form.isAcceptingOrders && (
            <label className="admin-field mt-4">
              <span>يبدأ استقبال الطلبات الجديدة في</span>
              <small>اختياري. لو حددته، يظهر للعميل موعد الرجوع، وبعد هذا الوقت يقبل النظام الطلبات تلقائيًا.</small>
              <input
                className="form-input"
                type="datetime-local"
                value={form.acceptingOrdersStartsAt || ''}
                onChange={(event) => setForm({ ...form, acceptingOrdersStartsAt: event.target.value || null })}
              />
              {form.acceptingOrdersStartsAt && (
                <small className="block mt-2 text-primary font-black">
                  سيظهر للعميل: نبدأ استقبال الطلبات يوم {formatStartsAt(form.acceptingOrdersStartsAt)}
                </small>
              )}
            </label>
          )}

          <label className="admin-field mt-4">
            <span>رسالة إيقاف الطلبات *</span>
            <small>تظهر للعميل عندما يكون استقبال الطلبات متوقفًا. اكتب سببًا واضحًا ومطمئنًا.</small>
            <textarea className="form-input min-h-24" value={form.closedMessage} onChange={(event) => setForm({ ...form, closedMessage: event.target.value })} required />
          </label>
        </section>

        <div className="admin-actions">
          <button className="btn-primary" disabled={save.isPending}>{save.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</button>
        </div>
      </form>
    </div>
  );
}
