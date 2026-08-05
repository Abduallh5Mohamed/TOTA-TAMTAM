import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';

const links = [
  { to: '/', label: 'الرئيسية', end: true },
  { to: '/shop', label: 'تسوقي الآن' },
  { to: '/track-order', label: 'تتبع الطلب' }
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const count = useCartStore((state) => state.getItemCount());
  const location = useLocation();
  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    const closeOnDesktop = () => { if (window.innerWidth >= 768) setOpen(false); };
    window.addEventListener('resize', closeOnDesktop);
    return () => window.removeEventListener('resize', closeOnDesktop);
  }, []);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  return <header className="site-header">
    <a className="skip-link" href="#main-content">انتقلي للمحتوى</a>
    <div className="announcement-bar" aria-label="مزايا المتجر"><div className="announcement-track"><span>توصيل لكل المحافظات</span><i aria-hidden="true">✦</i><span>الدفع عند الاستلام</span><i aria-hidden="true">✦</i><span>اختيارات جديدة كل أسبوع</span><i aria-hidden="true">✦</i><span>توصيل لكل المحافظات</span><i aria-hidden="true">✦</i><span>الدفع عند الاستلام</span></div></div>
    <div className="page-shell header-inner">
      <Link to="/" className="brand" aria-label="TOTA & TAMTAM - الرئيسية"><span>TOTA <b>&</b> TAMTAM</span><small>ستايل مختلف للنساء والأطفال</small></Link>
      <nav className="desktop-navigation" aria-label="التنقل الرئيسي">{links.map((link) => <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `header-nav-link ${isActive ? 'is-active' : ''}`}>{link.label}</NavLink>)}</nav>
      <div className="header-actions">
        <Link to="/cart" className="header-cart" aria-label={`السلة، ${count} منتجات`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 4.5h2l1.5 10h10.7l1.7-7.2H6.2M9 19a1.25 1.25 0 1 0 0 2.5A1.25 1.25 0 0 0 9 19Zm8 0a1.25 1.25 0 1 0 0 2.5A1.25 1.25 0 0 0 17 19Z" /></svg><span className="header-cart-label">السلة</span>{count > 0 && <span className="header-cart-count" aria-live="polite">{count}</span>}</Link>
        <button type="button" className={`mobile-menu-button ${open ? 'is-open' : ''}`} onClick={() => setOpen((value) => !value)} aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'} aria-expanded={open} aria-controls="mobile-navigation"><span /><span /><span /></button>
      </div>
    </div>
    <nav id="mobile-navigation" className={`mobile-navigation ${open ? 'is-open' : ''}`} aria-label="التنقل للموبايل" aria-hidden={!open}><div className="page-shell mobile-navigation-inner">{links.map((link) => <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `mobile-nav-link ${isActive ? 'is-active' : ''}`}><span>{link.label}</span><i aria-hidden="true">←</i></NavLink>)}<Link className="mobile-cart-link" to="/cart">عرض السلة {count > 0 && `(${count})`}</Link></div></nav>
  </header>;
}
