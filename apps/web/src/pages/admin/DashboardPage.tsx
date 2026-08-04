import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAdminDashboard } from '../../lib/api';
import type { DashboardStats } from '../../types';

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery<DashboardStats>({ queryKey: ['admin-dashboard'], queryFn: getAdminDashboard, refetchInterval: 60_000 });
  if (isLoading) return <p className="admin-loading">جاري تحميل الإحصائيات...</p>;
  if (isError || !data) return <div className="admin-panel"><p className="font-black">تعذر تحميل الإحصائيات.</p><button type="button" className="btn-primary mt-4" onClick={() => refetch()}>إعادة المحاولة</button></div>;
  const cards = [
    ['طلبات جديدة', data.newOrders, 'تحتاج مراجعة'], ['طلبات نشطة', data.activeOrders, 'قيد التجهيز أو التوصيل'], ['تم تسليمها اليوم', data.completedOrders, 'طلبات مكتملة'], ['إيراد اليوم', `${data.todayRevenue.toFixed(2)} ج.م`, 'من الطلبات المكتملة'], ['متوسط الطلب', `${data.avgOrderValue.toFixed(2)} ج.م`, 'قيمة الطلب الواحد'], ['مخزون منخفض', data.lowStock, 'راجعي الكميات']
  ];
  return <div className="admin-dashboard"><div className="admin-page-heading"><div><p>ملخص اليوم</p><h1>لوحة التحكم</h1><span>تابعي أهم أرقام المتجر من مكان واحد.</span></div><Link className="btn-primary" to="/admin/orders">مراجعة الطلبات</Link></div><div className="admin-metrics">{cards.map(([label, value, note], index) => <article key={label} className="admin-metric"><span>{String(index + 1).padStart(2, '0')}</span><p>{label}</p><strong>{value}</strong><small>{note}</small></article>)}</div></div>;
}
