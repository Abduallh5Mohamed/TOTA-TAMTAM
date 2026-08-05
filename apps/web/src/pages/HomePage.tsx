import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ProductCard from '../components/ProductCard';
import { assetUrl, getCategories, getProducts, getPublicSettings } from '../lib/api';
import type { Category, ProductSummary, StoreSettings } from '../types';

const hero = '/tota-tamtam-child-hero.jpg';

const fallbackCategories = [
  { id: 'women', name: 'ستايل النساء', description: 'قطع يومية وإطلالات مميزة لكل مناسبة.' },
  { id: 'kids', name: 'عالم الأطفال', description: 'راحة وحركة وستايل يناسب كل يوم.' }
];

const ArrowIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6" /></svg>;

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
          <div className="hero-frame"><img src={hero} alt="طفل بإطلالة عصرية من مجموعة توتا وتمتام" width={1200} height={1919} fetchPriority="high" /><span className="hero-price-note">أناقة من غير تكلّف</span></div>
          <div className="hero-sticker" aria-hidden="true"><span>ستايل</span><strong>HIGH</strong><span>جديد</span></div>
          <svg className="hero-star" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 0 61 38 100 50 61 62 50 100 39 62 0 50 39 38Z" /></svg>
        </div>
      </div>
    </section>

    <section className="category-showcase page-shell">
      <div className="section-heading category-heading"><div><p>اختاري عالمك</p><h2>تسوّقي حسب القسم</h2></div><Link to="/shop" className="section-link">كل المنتجات <span aria-hidden="true">←</span></Link></div>
      <div className="category-showcase-grid">
        {categories.length > 0 ? categories.map((category, index) => <Link key={category.id} to={`/shop?category=${category.id}`} className={`category-showcase-card category-card-${(index % 3) + 1}`}><div className="category-showcase-image">{category.image ? <img src={assetUrl(category.image)} alt={category.name} loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <div className="category-image-fallback" />}</div><div className="category-showcase-content"><span className="category-index">0{index + 1}</span><p>اكتشفي المجموعة</p><h3>{category.name}</h3><b>{category._count?.products || 0} منتج متاح <i aria-hidden="true">←</i></b></div></Link>) : fallbackCategories.map((category, index) => <Link key={category.id} to="/shop" className={`category-showcase-card category-fallback-card category-card-${index + 1}`}><div className="category-fallback-art" aria-hidden="true"><span /><span /><svg viewBox="0 0 120 140"><path d={index === 0 ? 'M25 30 48 14l12 13 12-13 23 16-15 23v69H40V53L25 30Z' : 'M31 34 49 20l11 12 11-12 18 14-12 20v65H43V54L31 34Z'} /></svg></div><div className="category-showcase-content"><span className="category-index">0{index + 1}</span><p>اكتشفي المجموعة</p><h3>{category.name}</h3><b>{category.description} <i aria-hidden="true">←</i></b></div></Link>)}
      </div>
    </section>

    <section className="brand-story"><div className="page-shell brand-story-grid">
      <article className="brand-story-lead"><p>مش مجرد لبس</p><h2>اختيارات معمولة<br />عشان تعيشيها</h2><span>في TOTA & TAMTAM بنختار كل قطعة بعين بتدور على الراحة، الجودة، والتفصيلة اللي تفرق في الإطلالة.</span><Link to="/shop">ابدئي من هنا <ArrowIcon /></Link></article>
      <article className="brand-value-card value-quality"><div className="value-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.3 4.7 5.2.8-3.8 3.7.9 5.3-4.6-2.5-4.6 2.5.9-5.3-3.8-3.7 5.2-.8L12 3Z" /></svg></div><p>تفاصيل تفرق</p><h3>جودة تليق بيومك</h3><span>خامات مريحة واختيارات عملية تعيش معاكِ.</span></article>
      <article className="brand-value-card value-price"><strong>100%</strong><p>سعر واضح</p><h3>بالجنيه المصري</h3><span>السعر اللي بتشوفيه واضح من أول اختيار لحد تأكيد الطلب.</span></article>
      <article className="brand-value-card value-delivery"><div className="value-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v10H3zM14 9h3l4 4v3h-7zM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /></svg></div><p>لحد باب البيت</p><h3>توصيل ومتابعة</h3><span>رقم طلب واضح ومتابعة بسيطة لحد ما يوصلك.</span></article>
    </div></section>

    {featuredProducts.length > 0 && <section className="featured-offers"><div className="page-shell"><div className="featured-heading"><div><p>مختارات الموسم</p><h2>الأكثر تميّزًا دلوقتي</h2><span>قطع لافتة وأسعار مصرية واضحة، من غير مفاجآت وقت الطلب.</span></div><Link className="btn-soft" to="/shop">شوّفي الكل</Link></div><div className="catalog-grid home-products mt-7">{featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div></div></section>}

    <section className="shopping-steps page-shell"><div className="steps-heading"><p>من الاختيار لباب البيت</p><h2>طلبك في 3 خطوات</h2><span>تجربة بسيطة وواضحة من غير تسجيل حساب أو خطوات معقدة.</span></div><div className="steps-grid"><article><span>01</span><div className="step-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4zM8 9h8M8 13h5" /></svg></div><h3>اختاري القطعة</h3><p>تصفحي المجموعة واختاري اللون والمقاس المناسب.</p></article><article><span>02</span><div className="step-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2 11h10l2-8H6M9 19h.01M17 19h.01" /></svg></div><h3>كمّلي بياناتك</h3><p>اكتبي العنوان واختاري منطقة التوصيل بسهولة.</p></article><article><span>03</span><div className="step-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v10H4zM8 12h.01M16 12h.01M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" /></svg></div><h3>استلمي وادفعي</h3><p>تابعي الطلب وادفعي كاش وقت الاستلام.</p></article></div></section>

    <section className="landing-cta"><div className="page-shell landing-cta-inner"><div><p>جاهزة لإطلالة مختلفة؟</p><h2>الكولكشن مستنيكِ</h2><span>اختاري القطع اللي شبهك وخلي الباقي علينا.</span></div><Link className="cta-arrow" to="/shop" aria-label="تسوقي المجموعة الآن"><span>تسوّقي الآن</span><ArrowIcon /></Link><div className="cta-burst" aria-hidden="true">NEW<br /><strong>DROP</strong></div></div></section>

    <section className="trust-strip"><div className="page-shell trust-grid"><div><span>01</span><h3>توصيل لحد باب البيت</h3><p>طلبك بيتغلف بعناية ويوصل لعنوانك بأمان.</p></div><div><span>02</span><h3>الدفع عند الاستلام</h3><p>اطلبي براحتك وادفعي لما الطلب يوصل لكِ.</p></div><div><span>03</span><h3>متابعة واضحة للطلب</h3><p>احتفظي برقم الطلب واعرفي وصل لفين في أي وقت.</p></div><a className="trust-contact" href={`tel:${settings?.phone || '01000000000'}`}><small>محتاجة مساعدة؟</small><strong dir="ltr">{settings?.phone || '01000000000'}</strong></a></div></section>
  </div>;
}
