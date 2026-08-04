import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAdminOrders } from '../../lib/api';
import { getStatusLabelAr, statusLabels } from '../../utils/status';
import type { Order } from '../../types';

export default function OrdersPage() {
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const { data: orders = [], isLoading, isError, refetch } = useQuery<Order[]>({
    queryKey: ['admin-orders', status, search],
    queryFn: () => getAdminOrders({ status, search: search || undefined }),
    refetchInterval: 30_000
  });

  return (
    <div>
      <div className="admin-page-heading">
        <div>
          <p>إدارة التنفيذ والتوصيل</p>
          <h1>الطلبات</h1>
          <span>تابع الطلبات الجديدة، ابحث برقم الطلب أو العميل، وفلتر حسب حالة التنفيذ.</span>
        </div>
      </div>

      <div className="admin-panel mt-6">
        <div className="admin-section-title">
          <div>
            <h2>البحث والتصفية</h2>
            <p>استخدم البحث للوصول السريع لطلب معين، أو اختر حالة محددة من القائمة.</p>
          </div>
          <span className="admin-badge">{orders.length} طلب</span>
        </div>
        <div className="admin-form-grid mt-4">
          <label className="admin-field">
            <span>البحث عن طلب</span>
            <small>اكتب رقم الطلب، اسم العميل، أو رقم الهاتف.</small>
            <input className="form-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="TT-... أو اسم العميل أو الهاتف" />
          </label>
          <label className="admin-field">
            <span>حالة الطلب</span>
            <small>فلتر الطلبات حسب مرحلة التنفيذ الحالية.</small>
            <select className="form-input" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">كل الحالات</option>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>
      </div>

      {isLoading && <p className="py-12 text-center">جاري تحميل الطلبات...</p>}
      {isError && <p className="py-12 text-center">تعذر التحميل <button className="text-primary" onClick={() => refetch()}>إعادة المحاولة</button></p>}

      <section className="admin-panel mt-5 overflow-x-auto">
        <table className="admin-table min-w-[850px]">
          <thead><tr><th>رقم الطلب</th><th>العميل</th><th>الحالة</th><th>الإجمالي</th><th>التاريخ</th><th /></tr></thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="font-bold" dir="ltr">{order.orderNumber}</td>
                <td><strong>{order.customerName}</strong><small className="block text-text-secondary" dir="ltr">{order.phone}</small></td>
                <td><span className="admin-status is-primary">{getStatusLabelAr(order.status)}</span></td>
                <td className="font-bold">{Number(order.total).toFixed(2)} ج.م</td>
                <td className="text-text-secondary">{new Date(order.createdAt).toLocaleString('ar-EG')}</td>
                <td><Link className="text-primary font-bold" to={`/admin/orders/${order.id}`}>التفاصيل</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && orders.length === 0 && <p className="text-center py-14 text-text-secondary">لا توجد طلبات مطابقة.</p>}
      </section>
    </div>
  );
}
