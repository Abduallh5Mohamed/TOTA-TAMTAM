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
    <section className="hero">
      <div className="page-shell hero-grid">
        <div className="hero-copy">
          <p className="hero-kicker"><span>NEW</span> تشكيلتنا الجديدة وصلت</p>
          <h1 className="hero-title">ستايلك<br /><em>يتكلم عنكِ</em></h1>
          <p className="hero-description">قطع مميزة للنساء والأطفال، مختارة بعناية عشان كل إطلالة تبقى مريحة، جريئة، ومختلفة فعلًا.</p>
          <div className="hero-actions"><Link className="btn-primary" to="/shop">تسوّقي الكولكشن <span aria-hidden="true">←</span></Link><Link className="btn-soft" to="/track-order">تتبّعي طلبك</Link></div>
          <div className="hero-trust"><div className="hero-avatars"><span>TT</span><span>TT</span><span>TT</span></div><p><strong>اختيارات حقيقية</strong><small>توصيل آمن ودفع عند الاستلام</small></p></div>
        </div>
        <div className="hero-visual" aria-label="إطلالة من مجموعة TOTA & TAMTAM">
          <div className="hero-blob" aria-hidden="true" />
          <div className="hero-frame"><img src={hero} alt="إطلالة أنيقة من مجموعة توتا وتمتام" width={1672} height={941} srcSet="/tota-tamtam-hero-768.jpg 768w, /tota-tamtam-hero-1200.jpg 1200w, /tota-tamtam-hero.jpg 1672w" sizes="(max-width: 900px) 90vw, 46vw" fetchPriority="high" /><span className="hero-price-note">أناقة من غير تكلّف</span></div>
          <div className="hero-sticker" aria-hidden="true"><span>ستايل</span><strong>HIGH</strong><span>جديد</span></div>
          <svg className="hero-star" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 0 61 38 100 50 61 62 50 100 39 62 0 50 39 38Z" /></svg>
        </div>
      </div>
    </section>

    <section className="category-showcase page-shell py-16 sm:py-20"><div className="section-heading category-heading"><div><p>اختاري عالمك</p><h2>تسوّقي حسب القسم</h2></div><Link to="/shop" className="section-link">كل المنتجات <span aria-hidden="true">←</span></Link></div><div className="category-showcase-grid">{categories.map((category, index) => <Link key={category.id} to={`/shop?category=${category.id}`} className={`category-showcase-card category-card-${(index % 3) + 1}`}><div className="category-showcase-image">{category.image ? <img src={assetUrl(category.image)} alt={category.name} loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <div className="category-image-fallback" />}</div><div className="category-showcase-content"><span className="category-index">0{index + 1}</span><p>اكتشفي المجموعة</p><h3>{category.name}</h3><b>{category._count?.products || 0} منتج متاح <i aria-hidden="true">←</i></b></div></Link>)}</div></section>

    {featuredProducts.length > 0 && <section className="featured-offers"><div className="page-shell"><div className="featured-heading"><div><p>مختارات الموسم</p><h2>الأكثر تميّزًا دلوقتي</h2><span>قطع لافتة وأسعار مصرية واضحة، من غير مفاجآت وقت الطلب.</span></div><Link className="btn-soft" to="/shop">شوّفي الكل</Link></div><div className="catalog-grid home-products mt-7">{featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div></div></section>}

    <section className="trust-strip"><div className="page-shell trust-grid"><div><span>01</span><h3>توصيل لحد باب البيت</h3><p>طلبك بيتغلف بعناية ويوصل لعنوانك بأمان.</p></div><div><span>02</span><h3>الدفع عند الاستلام</h3><p>اطلبي براحتك وادفعي لما الطلب يوصل لكِ.</p></div><div><span>03</span><h3>متابعة واضحة للطلب</h3><p>احتفظي برقم الطلب واعرفي وصل لفين في أي وقت.</p></div><a className="trust-contact" href={`tel:${settings?.phone || '01000000000'}`}><small>محتاجة مساعدة؟</small><strong dir="ltr">{settings?.phone || '01000000000'}</strong></a></div></section>
  </div>;
}
