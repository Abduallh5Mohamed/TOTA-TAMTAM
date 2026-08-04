import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { adminLogout, getAdminMe } from '../../lib/api';
import { RouteLoader } from '../../components/ui/StoreLoader';

const links = [
  ['نظرة عامة', '/admin/dashboard', '01', 'ملخص الطلبات والمبيعات'],
  ['الطلبات', '/admin/orders', '02', 'متابعة طلبات العملاء'],
  ['المنتجات', '/admin/products', '03', 'الصور والأسعار والمخزون'],
  ['الأقسام', '/admin/categories', '04', 'تنظيم أقسام المتجر'],
  ['مناطق التوصيل', '/admin/delivery-zones', '05', 'رسوم ومناطق الشحن'],
  ['إعدادات المتجر', '/admin/settings', '06', 'التواصل وحالة الطلبات']
] as const;

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({ queryKey: ['admin-me'], queryFn: getAdminMe, retry: false });
  const logout = useMutation({ mutationFn: adminLogout, onSettled: () => navigate('/admin/login', { replace: true }) });
  useEffect(() => { if (isError) navigate('/admin/login', { replace: true }); }, [isError, navigate]);
  useEffect(() => { setOpen(false); }, [location.pathname]);
  if (isLoading) return <div className="admin-loading">جاري تجهيز لوحة الإدارة...</div>;
  if (!data?.user) return null;
  return <div className="admin-layout">
    <header className="admin-mobile-header"><div><strong>TOTA & TAMTAM</strong><span>إدارة المتجر</span></div><button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="فتح قائمة الإدارة"><span /><span /></button></header>
    <aside className={`admin-sidebar ${open ? 'is-open' : ''}`}>
      <div className="admin-brand"><strong>TOTA <b>&</b> TAMTAM</strong><span>لوحة إدارة المتجر</span></div>
      <nav className="admin-nav" aria-label="روابط لوحة الإدارة">{links.map(([label, path, order, help]) => <Link key={path} to={path} className={`admin-nav-link ${location.pathname.startsWith(path) ? 'is-active' : ''}`}><span className="admin-nav-icon" aria-hidden="true">{order}</span><span><strong>{label}</strong><small>{help}</small></span></Link>)}</nav>
      <div className="admin-account"><p>جلسة المدير</p><strong>{data.user.name}</strong><span>{data.user.email}</span><Link to="/" target="_blank">فتح المتجر</Link><button type="button" onClick={() => logout.mutate()} disabled={logout.isPending}>{logout.isPending ? 'جاري الخروج...' : 'تسجيل الخروج'}</button></div>
    </aside>
    {open && <button type="button" className="admin-backdrop" aria-label="إغلاق القائمة" onClick={() => setOpen(false)} />}
    <main className="admin-main"><Outlet /></main>
    <RouteLoader />
  </div>;
}
