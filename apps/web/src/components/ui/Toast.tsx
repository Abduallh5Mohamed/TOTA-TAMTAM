import { useToastStore, type ToastType } from '../../store/toastStore';

const labels: Record<ToastType, string> = { success: 'تم بنجاح', error: 'تعذر إتمام العملية', info: 'تنبيه' };

function ToastIcon({ type }: { type: ToastType }) {
  if (type === 'success') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4.2 4.2L19 6.8" /></svg>;
  if (type === 'error') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7v6m0 4h.01M5.4 19h13.2c1 0 1.6-1.1 1.1-2L13.1 5.5c-.5-.9-1.7-.9-2.2 0L4.3 17c-.5.9.1 2 1.1 2Z" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v4m0 4h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" /></svg>;
}

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const remove = useToastStore((state) => state.removeToast);
  return <div className="toast-region" aria-live="polite" aria-relevant="additions">
    {toasts.map((toast) => <article key={toast.id} className={`store-toast is-${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}><span className="store-toast-icon"><ToastIcon type={toast.type} /></span><div><strong>{labels[toast.type]}</strong><p>{toast.message}</p></div><button type="button" onClick={() => remove(toast.id)} aria-label="إغلاق الرسالة">×</button><i aria-hidden="true" /></article>)}
  </div>;
}
