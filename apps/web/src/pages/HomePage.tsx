import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ProductCard from '../components/ProductCard';
import { assetUrl, getCategories, getProducts, getPublicSettings } from '../lib/api';
import type { Category, ProductSummary, StoreSettings } from '../types';

const hero = '/tota-tamtam-hero.jpg';

export default function HomePage() {
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ['categories'], queryFn: getCategories });
  const { data: settings } = useQuery<StoreSettings>({ queryKey: ['settings'], queryFn: getPublicSettings, refetchOnMount: 'always' });
  const { data: featuredProducts = [] } = useQuery<ProductSummary[]>({ queryKey: ['products', 'featured-offers'], queryFn: async () => (await getProducts({ featured: true, limit: 8 })).items });
  return <div className="home-page">
    <section className="hero relative overflow-hidden"><img src={hero} alt="" aria-hidden="true" className="hero-art absolute inset-0 w-full h-full object-cover" width={1672} height={941} srcSet="/tota-tamtam-hero-768.jpg 768w, /tota-tamtam-hero-1200.jpg 1200w, /tota-tamtam-hero.jpg 1672w" sizes="100vw" fetchPriority="high" /><div className="hero-wash absolute inset-0" /><div className="relative page-shell hero-content"><div className="hero-copy"><p className="hero-kicker">تشكيلة مختارة بعناية</p><h1 className="hero-title mt-3">أناقة تليق بك<br />وبأطفالك</h1><p className="hero-description mt-5">ملابس مريحة وأنيقة لكل يوم، بخامات مختارة وتفاصيل ناعمة، مع توصيل حتى باب البيت.</p><div className="flex flex-wrap gap-3 mt-7"><Link className="btn-primary" to="/shop">تسوقي المجموعة</Link><Link className="btn-soft" to="/track-order">تابعي طلبك</Link></div><a className="hero-phone" href={`tel:${settings?.phone || '01000000000'}`}><span>للطلب والاستفسار</span><strong dir="ltr">{settings?.phone || '01000000000'}</strong><small>تواصلي معنا الآن</small></a></div></div></section>
    <section className="category-showcase page-shell py-16 sm:py-20"><div className="section-heading category-heading"><div><p>تسوقي حسب احتياجك</p><h2>أقسام المتجر</h2></div><Link to="/shop" className="section-link">كل المنتجات</Link></div><div className="category-showcase-grid">{categories.map((category) => <Link key={category.id} to={`/shop?category=${category.id}`} className="category-showcase-card"><div className="category-showcase-image">{category.image ? <img src={assetUrl(category.image)} alt={category.name} loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <div className="category-image-fallback" />}</div><div className="category-showcase-content"><p>اكتشفي المجموعة</p><h3>{category.name}</h3><span>{category._count?.products || 0} منتج متاح</span></div></Link>)}</div></section>
    {featuredProducts.length > 0 && <section className="featured-offers page-shell pb-16 sm:pb-20"><div className="featured-heading"><div><p>اختيارات الموسم</p><h2>العروض المميزة</h2><span>منتجات مختارة بأسعار خاصة لفترة محدودة.</span></div><Link className="btn-soft" to="/shop">عرض كل المنتجات</Link></div><div className="catalog-grid home-products mt-7">{featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div></section>}
    <section className="trust-strip py-12"><div className="page-shell trust-grid"><div><span>01</span><h3>توصيل لباب البيت</h3><p>يوصل طلبك بأمان حتى عنوانك.</p></div><div><span>02</span><h3>الدفع عند الاستلام</h3><p>اطلبي بكل راحة وادفعي عند وصول الطلب.</p></div><div><span>03</span><h3>متابعة واضحة للطلب</h3><p>رقم طلبك يفضل معك من التأكيد للتوصيل.</p></div></div></section>
  </div>;
}
