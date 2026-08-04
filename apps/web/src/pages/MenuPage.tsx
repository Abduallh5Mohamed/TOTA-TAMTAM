import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ProductCard from '../components/ProductCard';
import { getCategories, getProducts } from '../lib/api';
import type { Category, ProductSummary } from '../types';

const PAGE_SIZE = 12;

export default function MenuPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(params.get('search') || '');
  const categoryId = params.get('category') || '';
  const page = Math.max(1, Number(params.get('page') || 1));
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ['categories'], queryFn: getCategories });
  const { data, isLoading, isError, refetch, isFetching } = useQuery({ queryKey: ['products', categoryId, debouncedSearch, page], queryFn: () => getProducts({ categoryId: categoryId || undefined, search: debouncedSearch || undefined, page, limit: PAGE_SIZE }), placeholderData: (previous) => previous });
  const products: ProductSummary[] = data?.items || [];
  const activeCategory = categories.find((category) => category.id === categoryId);
  useEffect(() => {
    const timer = window.setTimeout(() => { const nextSearch = search.trim(); setDebouncedSearch(nextSearch); setParams((previous) => { const next = new URLSearchParams(previous); if (nextSearch) next.set('search', nextSearch); else next.delete('search'); next.delete('page'); return next; }, { replace: true }); }, 350);
    return () => window.clearTimeout(timer);
  }, [search, setParams]);
  const updateCategory = (nextCategoryId: string) => setParams((previous) => { const next = new URLSearchParams(previous); if (nextCategoryId) next.set('category', nextCategoryId); else next.delete('category'); next.delete('page'); return next; });
  const updatePage = (nextPage: number) => { setParams((previous) => { const next = new URLSearchParams(previous); if (nextPage > 1) next.set('page', String(nextPage)); else next.delete('page'); return next; }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  return <div className="shop-page soft-page min-h-screen">
    <section className="shop-intro"><div className="page-shell"><p>تشكيلة TOTA & TAMTAM</p><h1>اختاري ما يليق بك</h1><span>تصفحي القطع المتاحة، شوفي التفاصيل والأسعار، وأضيفي اختيارك للسلة بسهولة.</span></div></section>
    <section className="page-shell shop-controls"><div className="shop-filter-card"><div className="shop-search"><label htmlFor="product-search">ابحثي في المنتجات</label><input id="product-search" className="form-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="اكتبي اسم المنتج الذي تبحثين عنه" /></div><div className="shop-select"><label htmlFor="product-category">القسم</label><select id="product-category" className="form-input" value={categoryId} onChange={(event) => updateCategory(event.target.value)}><option value="">كل الأقسام</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div></div><div className="shop-category-list" aria-label="تصفية حسب القسم"><button type="button" className={!categoryId ? 'is-active' : ''} onClick={() => updateCategory('')}>كل المنتجات</button>{categories.map((category) => <button type="button" key={category.id} className={categoryId === category.id ? 'is-active' : ''} onClick={() => updateCategory(category.id)}>{category.name}</button>)}</div></section>
    <section className="page-shell shop-results">
      <div className="shop-results-head"><div><strong>{data?.total || 0} منتج</strong>{activeCategory && <span>في قسم {activeCategory.name}</span>}</div>{isFetching && <span>جاري التحديث...</span>}</div>
      {isLoading && <div className="catalog-grid">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="card overflow-hidden animate-pulse"><div className="aspect-[4/5] bg-stone-100" /><div className="p-5 space-y-3"><div className="h-4 bg-stone-100 rounded" /><div className="h-4 bg-stone-100 rounded w-2/3" /></div></div>)}</div>}
      {isError && <div className="shop-message"><strong>تعذر تحميل المنتجات</strong><button type="button" className="btn-primary" onClick={() => refetch()}>إعادة المحاولة</button></div>}
      {!isLoading && !isError && products.length === 0 && <div className="shop-message"><strong>لا توجد منتجات مطابقة الآن</strong><span>جربي البحث بكلمة أخرى أو اختاري قسمًا مختلفًا.</span></div>}
      {!isLoading && !isError && products.length > 0 && <><div className="catalog-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>{data && data.totalPages > 1 && <nav className="shop-pagination" aria-label="صفحات المنتجات"><button type="button" className="btn-soft" disabled={page <= 1} onClick={() => updatePage(page - 1)}>السابق</button><span>صفحة {page} من {data.totalPages}</span><button type="button" className="btn-soft" disabled={page >= data.totalPages} onClick={() => updatePage(page + 1)}>التالي</button></nav>}</>}
    </section>
  </div>;
}
