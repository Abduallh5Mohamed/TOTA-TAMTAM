import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminLogin, getAdminMe } from '../../lib/api';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const mutation = useMutation({
    mutationFn: () => adminLogin({ email, password }),
    onSuccess: () => navigate('/admin/dashboard', { replace: true })
  });

  useEffect(() => {
    getAdminMe().then(() => navigate('/admin/dashboard', { replace: true })).catch(() => undefined);
  }, [navigate]);

  const error = (mutation.error as { response?: { data?: { error?: string } } } | null)?.response?.data?.error;

  return (
    <main className="admin-login-page">
      <div className="admin-login-art" aria-hidden="true"><span>ADMIN</span><b>T&T</b><i /></div>
      <form onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }} className="admin-login-card">
        <div className="text-center">
          <span className="admin-login-kicker">لوحة التحكم</span>
          <h1>TOTA <b>&</b> TAMTAM</h1>
          <p className="text-text-secondary mt-1">تسجيل دخول لوحة الإدارة</p>
        </div>
        <label className="block mt-7"><span className="text-sm font-bold">البريد الإلكتروني</span><input className="form-input mt-2" dir="ltr" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label className="block mt-4"><span className="text-sm font-bold">كلمة المرور</span><input className="form-input mt-2" dir="ltr" type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        {mutation.isError && <p className="text-error text-sm font-bold mt-4">{error || 'تعذر تسجيل الدخول'}</p>}
        <button className="btn-primary w-full mt-6" disabled={mutation.isPending}>{mutation.isPending ? 'جاري الدخول...' : 'دخول لوحة الإدارة ←'}</button>
      </form>
    </main>
  );
}
