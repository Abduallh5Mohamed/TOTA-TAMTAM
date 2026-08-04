import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { ProductInput, VariantInput } from '@tota-tamtam/contracts';
import {
  assetUrl,
  createAdminProduct,
  deleteAdminProduct,
  deleteProductImage,
  getAdminCategories,
  getAdminProducts,
  setPrimaryImage,
  updateAdminProduct,
  updateProductImage,
  uploadProductImages
} from '../../lib/api';
import { money } from '../../lib/pricing';
import { useToastStore } from '../../store/toastStore';
import type { Category, Product } from '../../types';

const newVariant = (): VariantInput => ({
  sku: '',
  size: '',
  color: '',
  colorHex: null,
  price: null,
  stock: 0,
  isActive: true
});

const emptyProduct = (categoryId = ''): ProductInput => ({
  name: '',
  slug: '',
  description: '',
  basePrice: 0,
  categoryId,
  isActive: true,
  isFeatured: false,
  sortOrder: 0,
  variants: [newVariant()]
});

const fieldNumber = (value: string) => value === '' ? 0 : Number(value);
const variantKey = (variant: VariantInput, index: number) => variant.id || `new-${index}`;

export default function ProductsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductInput>(emptyProduct());
  const [files, setFiles] = useState<File[]>([]);
  const [incomingStock, setIncomingStock] = useState<Record<string, number>>({});
  const toast = useToastStore((state) => state.addToast);
  const { data: products = [], isLoading, refetch } = useQuery<Product[]>({ queryKey: ['admin-products'], queryFn: getAdminProducts });
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ['admin-categories'], queryFn: getAdminCategories });

  const close = () => {
    setShowForm(false);
    setEditing(null);
    setFiles([]);
    setIncomingStock({});
    setForm(emptyProduct(categories[0]?.id));
  };

  const buildPayload = (): ProductInput => {
    const invalidDiscount = form.variants.find((variant) => variant.price && Number(variant.price) >= Number(form.basePrice));
    if (invalidDiscount) throw new Error('سعر بعد الخصم لازم يكون أقل من السعر الأساسي.');

    return {
      ...form,
      variants: form.variants.map((variant, index) => {
        const received = incomingStock[variantKey(variant, index)] || 0;
        return {
          ...variant,
          price: variant.price || null,
          stock: Math.max(0, Number(variant.stock || 0) + received)
        };
      })
    };
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = buildPayload();
      const product = editing ? await updateAdminProduct(editing.id, payload) : await createAdminProduct(payload);
      if (files.length) await uploadProductImages(product.id, files);
      return product;
    },
    onSuccess: () => { toast('تم حفظ المنتج وتحديث السعر والمخزون', 'success'); close(); refetch(); },
    onError: (error: unknown) => toast((error as { message?: string; response?: { data?: { error?: string } } }).response?.data?.error || (error as { message?: string }).message || 'تعذر حفظ المنتج', 'error')
  });

  const remove = useMutation({
    mutationFn: deleteAdminProduct,
    onSuccess: (data) => { toast(data.message, 'success'); refetch(); },
    onError: () => toast('تعذر حذف المنتج', 'error')
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyProduct(categories[0]?.id));
    setIncomingStock({});
    setFiles([]);
    setShowForm(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      basePrice: Number(product.basePrice),
      categoryId: product.categoryId,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      sortOrder: product.sortOrder,
      variants: product.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        colorHex: variant.colorHex,
        price: variant.price === null ? null : Number(variant.price),
        stock: variant.stock,
        isActive: variant.isActive
      }))
    });
    setIncomingStock({});
    setFiles([]);
    setShowForm(true);
  };

  const updateVariant = (index: number, patch: Partial<VariantInput>) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) => variantIndex === index ? { ...variant, ...patch } : variant)
    }));
  };

  const updateIncomingStock = (variant: VariantInput, index: number, value: number) => {
    setIncomingStock((current) => ({ ...current, [variantKey(variant, index)]: Math.max(0, value) }));
  };

  return (
    <div>
      <div className="admin-page-heading">
        <div>
          <p>الكتالوج والمخزون</p>
          <h1>المنتجات</h1>
          <span>أضف المنتجات، حدد السعر الأساسي، وسعر بعد الخصم، وحالة الظهور في الرئيسية.</span>
        </div>
        <button className="btn-primary" onClick={openCreate} disabled={categories.length === 0}>إضافة منتج</button>
      </div>

      {categories.length === 0 && <p className="bg-warning/10 text-warning p-4 rounded-xl mt-5 font-bold">أضف قسمًا أولًا قبل إضافة المنتجات.</p>}

      <section className="admin-panel mt-6 overflow-x-auto">
        {isLoading ? <p className="p-12 text-center">جاري تحميل المنتجات...</p> : (
          <table className="admin-table min-w-[900px]">
            <thead>
              <tr><th>المنتج</th><th>القسم</th><th>السعر الأساسي</th><th>أقل سعر بعد الخصم</th><th>المخزون</th><th>الحالة</th><th /></tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const image = product.images.find((item) => item.isPrimary)?.path || product.images[0]?.path;
                const totalStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
                const discountPrices = product.variants.map((variant) => variant.price === null ? null : Number(variant.price)).filter((price): price is number => Boolean(price));
                const minDiscount = discountPrices.length ? Math.min(...discountPrices) : null;
                return (
                  <tr key={product.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-14 rounded-lg overflow-hidden bg-pink-50">{image && <img src={assetUrl(image)} alt="" className="w-full h-full object-cover" />}</div>
                        <div><strong>{product.name}</strong><small className="block text-text-secondary" dir="ltr">{product.slug}</small></div>
                      </div>
                    </td>
                    <td>{product.category?.name}</td>
                    <td className="font-bold">{money(Number(product.basePrice))}</td>
                    <td>{minDiscount ? <strong className="text-secondary">{money(minDiscount)}</strong> : <span className="text-text-secondary">لا يوجد خصم</span>}</td>
                    <td className={`font-bold ${totalStock <= 0 ? 'text-error' : totalStock <= 3 ? 'text-warning' : ''}`}>{totalStock}</td>
                    <td>
                      <span className={`admin-status ${product.isActive ? 'is-success' : 'is-error'}`}>{product.isActive ? 'ظاهر' : 'مخفي'}</span>
                      {product.isFeatured && <small className="block text-secondary mt-1 font-black">منتج مميز في الرئيسية</small>}
                      {totalStock <= 0 && <small className="block text-error mt-1">نفد المخزون</small>}
                    </td>
                    <td className="text-left">
                      <button className="text-primary font-bold ml-4" onClick={() => openEdit(product)}>تعديل</button>
                      <button className="text-error font-bold" onClick={() => window.confirm('حذف أو أرشفة المنتج؟') && remove.mutate(product.id)}>حذف</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 p-3 sm:p-6 overflow-y-auto">
          <form onSubmit={(event) => { event.preventDefault(); save.mutate(); }} className="admin-product-dialog card max-w-5xl mx-auto p-5 sm:p-7 my-4">
            <div className="flex justify-between items-center gap-4">
              <div>
                <p className="text-secondary font-bold">{editing ? 'تعديل السعر والمخزون' : 'إضافة منتج جديد'}</p>
                <h2 className="text-2xl font-black">{editing ? 'تعديل المنتج' : 'منتج جديد'}</h2>
              </div>
              <button type="button" className="text-2xl" onClick={close} aria-label="إغلاق">×</button>
            </div>

            <section className="mt-6">
              <h3 className="text-xl font-black">بيانات المنتج الأساسية</h3>
              <p className="text-xs text-text-secondary mt-1">السعر الأساسي هو السعر قبل الخصم، ويظهر مشطوبًا للعميل عند وجود سعر بعد الخصم.</p>
              <div className="admin-form-grid mt-4">
                <label className="admin-field">
                  <span>اسم المنتج *</span>
                  <small>الاسم الظاهر للعميل في المتجر.</small>
                  <input className="form-input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
                </label>
                <label className="admin-field">
                  <span>الرابط المختصر *</span>
                  <small>حروف إنجليزية وأرقام وشرطات فقط، مثل dress-400.</small>
                  <input className="form-input" dir="ltr" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value.toLowerCase().trim() })} placeholder="dress-400" required />
                </label>
                <label className="admin-field">
                  <span>القسم *</span>
                  <small>القسم الذي يظهر تحته المنتج.</small>
                  <select className="form-input" value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} required>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
                </label>
                <label className="admin-field">
                  <span>السعر الأساسي قبل الخصم *</span>
                  <small>هذا هو السعر العادي الذي يظهر مشطوبًا عند وجود خصم.</small>
                  <input className="form-input" type="number" min=".01" step=".01" value={form.basePrice || ''} onChange={(event) => setForm({ ...form, basePrice: fieldNumber(event.target.value) })} required />
                </label>
                <label className="admin-field">
                  <span>ترتيب الظهور</span>
                  <small>رقم أصغر يعني ظهور أبكر في القوائم.</small>
                  <input className="form-input" type="number" min="0" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: fieldNumber(event.target.value) })} />
                </label>
                <label className="admin-field">
                  <span>صور المنتج</span>
                  <small>يمكن رفع أكثر من صورة للمنتج.</small>
                  <input className="form-input" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => setFiles(Array.from(event.target.files || []))} />
                </label>
              </div>
              <label className="admin-field mt-4">
                <span>وصف المنتج</span>
                <small>تفاصيل الخامة أو المقاس أو أي ملاحظات للعميل.</small>
                <textarea className="form-input min-h-28" value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </label>
            </section>

            <section className="mt-7">
              <h3 className="text-xl font-black">ظهور المنتج</h3>
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                <label className={`admin-toggle ${form.isActive ? 'is-on' : ''}`}>
                  <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
                  <span><strong>ظاهر في المتجر</strong><small>لو أغلقت الاختيار، المنتج يختفي من المتجر العام.</small></span>
                </label>
                <label className={`admin-toggle ${form.isFeatured ? 'is-on' : ''}`}>
                  <input type="checkbox" checked={form.isFeatured} onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })} />
                  <span><strong>منتج مميز في الصفحة الرئيسية</strong><small>سيظهر في قسم العروض المميزة في الرئيسية.</small></span>
                </label>
              </div>
            </section>

            {editing && editing.images.length > 0 && (
              <section className="mt-7">
                <h3 className="font-black">الصور الحالية</h3>
                <div className="flex gap-3 mt-3 overflow-x-auto">
                  {editing.images.map((image, imageIndex) => (
                    <div key={image.id} className="relative shrink-0">
                      <img src={assetUrl(image.path)} className={`w-24 h-28 object-cover rounded-xl border-2 ${image.isPrimary ? 'border-secondary' : 'border-transparent'}`} alt="" />
                      <div className="flex justify-center gap-2 mt-1 text-xs">
                        {imageIndex > 0 && <button type="button" title="تحريك للأمام" onClick={async () => { await updateProductImage(editing.id, image.id, { sortOrder: Math.max(0, image.sortOrder - 1) }); toast('تم تعديل ترتيب الصورة', 'success'); close(); refetch(); }}>→</button>}
                        {!image.isPrimary && <button type="button" className="text-primary" onClick={async () => { await setPrimaryImage(editing.id, image.id); toast('تم تعيين الصورة الأساسية', 'success'); close(); refetch(); }}>أساسية</button>}
                        <button type="button" className="text-error" onClick={async () => { if (!window.confirm('حذف الصورة؟')) return; await deleteProductImage(editing.id, image.id); toast('تم حذف الصورة', 'success'); close(); refetch(); }}>حذف</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="mt-8">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-xl font-black">المقاسات والألوان والمخزون</h3>
                  <p className="text-xs text-text-secondary mt-1">كل صف له مخزون مستقل. سعر بعد الخصم اختياري ويجب أن يكون أقل من السعر الأساسي.</p>
                </div>
                <button type="button" className="text-primary font-bold shrink-0" onClick={() => setForm({ ...form, variants: [...form.variants, newVariant()] })}>+ إضافة تنويعة</button>
              </div>

              <div className="space-y-4 mt-4">
                {form.variants.map((variant, index) => {
                  const received = incomingStock[variantKey(variant, index)] || 0;
                  const finalStock = Number(variant.stock || 0) + received;
                  const hasDiscount = Boolean(variant.price && Number(variant.price) < Number(form.basePrice));
                  return (
                    <div key={variantKey(variant, index)} className="rounded-xl border border-border bg-background p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <strong>تنويعة رقم {index + 1}</strong>
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${finalStock <= 0 ? 'bg-error/10 text-error' : finalStock <= 3 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                          {finalStock <= 0 ? 'نفد المخزون' : `المتاح بعد الحفظ: ${finalStock}`}
                        </span>
                      </div>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <label className="admin-field">
                          <span>كود SKU *</span>
                          <small>كود داخلي للمقاس واللون، مثل DRESS-RED-40.</small>
                          <input className="form-input" dir="ltr" value={variant.sku} onChange={(event) => updateVariant(index, { sku: event.target.value.toUpperCase().trim() })} placeholder="SKU" required />
                        </label>
                        <label className="admin-field">
                          <span>المقاس *</span>
                          <small>مثل 40 أو M أو 2Y.</small>
                          <input className="form-input" value={variant.size} onChange={(event) => updateVariant(index, { size: event.target.value })} placeholder="40" required />
                        </label>
                        <label className="admin-field">
                          <span>اللون *</span>
                          <small>اسم اللون الذي يراه العميل.</small>
                          <input className="form-input" value={variant.color} onChange={(event) => updateVariant(index, { color: event.target.value })} placeholder="أحمر" required />
                        </label>
                        <label className="admin-field">
                          <span>المخزون الحالي *</span>
                          <small>العدد الموجود حاليًا.</small>
                          <input className="form-input" type="number" min="0" value={variant.stock} onChange={(event) => updateVariant(index, { stock: fieldNumber(event.target.value) })} required />
                        </label>
                        <label className="admin-field">
                          <span>كمية وصلت جديدة</span>
                          <small>لو جالك مخزون جديد، اكتبي الكمية هنا وستُضاف عند الحفظ.</small>
                          <input className="form-input" type="number" min="0" value={received || ''} onChange={(event) => updateIncomingStock(variant, index, fieldNumber(event.target.value))} placeholder="مثال: 20" />
                        </label>
                        <label className="admin-field">
                          <span>سعر بعد الخصم</span>
                          <small>اختياري. اتركيه فاضي لو مفيش خصم. لازم يكون أقل من {money(Number(form.basePrice || 0))}.</small>
                          <input className="form-input" type="number" min=".01" max={form.basePrice || undefined} step=".01" value={variant.price ?? ''} onChange={(event) => updateVariant(index, { price: event.target.value ? Number(event.target.value) : null })} placeholder="مثال: 450" />
                          {hasDiscount && <small className="block mt-2 text-secondary font-black">سيظهر للعميل: {money(Number(form.basePrice))} ← {money(Number(variant.price))}</small>}
                        </label>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <label className="text-sm font-bold flex items-center gap-2"><input type="checkbox" checked={variant.isActive} onChange={(event) => updateVariant(index, { isActive: event.target.checked })} /> التنويعة نشطة وتظهر للعميل</label>
                        {form.variants.length > 1 && <button type="button" className="text-error font-bold" onClick={() => setForm((current) => ({ ...current, variants: current.variants.filter((_, variantIndex) => variantIndex !== index) }))}>حذف التنويعة</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="flex justify-end gap-3 mt-8">
              <button type="button" className="btn-soft" onClick={close}>إلغاء</button>
              <button className="btn-primary px-8" disabled={save.isPending}>{save.isPending ? 'جاري الحفظ...' : 'حفظ المنتج'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
