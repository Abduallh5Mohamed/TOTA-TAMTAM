import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPublicSettings } from '../../lib/api';
import type { StoreSettings } from '../../types';

export default function Footer() {
  const { data } = useQuery<StoreSettings>({ queryKey: ['settings'], queryFn: getPublicSettings, refetchOnMount: 'always' });
  return <footer className="site-footer mt-16">
    <div className="page-shell footer-grid">
      <section className="footer-brand"><p className="footer-mark">TOTA <b>&</b> TAMTAM</p><p>اختيارات أنيقة ومريحة للنساء والأطفال، تصلك حتى باب البيت والدفع عند الاستلام.</p></section>
      <section><h3>تسوقي</h3><Link to="/shop">كل المنتجات</Link><Link to="/track-order">تتبع الطلب</Link><Link to="/cart">سلة التسوق</Link></section>
      <section><h3>تواصلي معنا</h3><a className="footer-phone" href={`tel:${data?.phone || '01000000000'}`}><span>للطلب والاستفسار</span><strong dir="ltr">{data?.phone || '01000000000'}</strong></a><a className="footer-whatsapp" href={`https://wa.me/${data?.whatsapp || '201000000000'}`} target="_blank" rel="noreferrer">تواصلي على واتساب</a></section>
      <section className="footer-address"><h3>عنواننا</h3><p>{data?.address || 'القاهرة، مصر'}</p><span>التوصيل والدفع عند الاستلام</span></section>
    </div>
    <div className="footer-bottom"><div className="page-shell">© {new Date().getFullYear()} TOTA & TAMTAM — جميع الحقوق محفوظة.</div></div>
  </footer>;
}
