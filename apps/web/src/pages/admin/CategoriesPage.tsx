import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  assetUrl,
  createAdminCategory,
  deleteAdminCategory,
  deleteAdminCategoryImage,
  getAdminCategories,
  updateAdminCategory,
  uploadAdminCategoryImage
} from '../../lib/api';
import { useToastStore } from '../../store/toastStore';
import type { Category } from '../../types';

type CategoryForm = {
  name: string;
  slug: string;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
};

const empty: CategoryForm = { name: '', slug: '', image: null, sortOrder: 0, isActive: true };

const getErrorMessage = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { error?: string } }; message?: string }).response?.data?.error ||
  (error as { message?: string }).message ||
  fallback;

export default function CategoriesPage() {
  const [form, setForm] = useState<CategoryForm>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [fileInputKey, setFileInputKey] = useState(0);
  const toast = useToastStore((state) => state.addToast);

  const { data: categories = [], isLoading, refetch } = useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: getAdminCategories
  });

  useEffect(() => {
    if (!imageFile) {
      setImagePreview('');
      return undefined;
    }

    const preview = URL.createObjectURL(imageFile);
    setImagePreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [imageFile]);

  const reset = () => {
    setEditingId(null);
    setForm(empty);
    setImageFile(null);
    setFileInputKey((value) => value + 1);
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, image: form.image || null };
      const savedCategory = editingId
        ? await updateAdminCategory(editingId, payload)
        : await createAdminCategory(payload);

      if (imageFile) {
        return uploadAdminCategoryImage(savedCategory.id, imageFile);
      }

      return savedCategory;
    },
    onSuccess: () => {
      toast('تم حفظ القسم بنجاح', 'success');
      reset();
      refetch();
    },
    onError: (error: unknown) => toast(getErrorMessage(error, 'تعذر حفظ القسم'), 'error')
  });

  const removeImage = useMutation({
    mutationFn: async () => {
      if (!editingId) return null;
      return deleteAdminCategoryImage(editingId);
    },
    onSuccess: () => {
      toast('تم حذف صورة القسم', 'success');
      setForm((current) => ({ ...current, image: null }));
      refetch();
    },
    onError: (error: unknown) => toast(getErrorMessage(error, 'تعذر حذف صورة القسم'), 'error')
  });

  const remove = useMutation({
    mutationFn: deleteAdminCategory,
    onSuccess: (data) => {
      toast(data.message, 'success');
      refetch();
    },
    onError: () => toast('تعذر حذف القسم', 'error')
  });

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setImageFile(null);
    setFileInputKey((value) => value + 1);
    setForm({
      name: category.name,
      slug: category.slug,
      image: category.image || null,
      sortOrder: category.sortOrder,
      isActive: category.isActive
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const visibleImage = imagePreview || assetUrl(form.image);

  return (
    <div>
      <div className="admin-page-heading">
        <div>
          <p>تنظيم الكتالوج</p>
          <h1>الأقسام</h1>
          <span>
            أنشئ أقسام المتجر وحدد صورة كل قسم من جهازك. الصورة ستُرفع للسيرفر ويتخزن مسارها تلقائيًا، بدون كتابة روابط يدويًا.
          </span>
        </div>
      </div>

      <form onSubmit={(event) => { event.preventDefault(); save.mutate(); }} className="admin-panel mt-6">
        <div className="admin-section-title">
          <div>
            <h2>{editingId ? 'تعديل قسم موجود' : 'إضافة قسم جديد'}</h2>
            <p>كل خانة عليها شرح مختصر. الصورة اختيارية، ولو اخترت صورة جديدة أثناء التعديل ستستبدل الصورة القديمة.</p>
          </div>
          {editingId && <span className="admin-badge">وضع التعديل</span>}
        </div>

        <div className="admin-form-grid mt-5">
          <label className="admin-field">
            <span>اسم القسم *</span>
            <small>الاسم الذي يظهر للعميل في المتجر، مثل ملابس نسائية أو ملابس أطفال.</small>
            <input
              className="form-input"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="ملابس نسائية"
              required
            />
          </label>

          <label className="admin-field">
            <span>الرابط المختصر *</span>
            <small>يُستخدم داخليًا في رابط القسم. اكتبه إنجليزي صغير بدون مسافات، مثل women أو kids.</small>
            <input
              className="form-input"
              dir="ltr"
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: event.target.value.toLowerCase().trim() })}
              placeholder="women"
              required
            />
          </label>

          <label className="admin-field">
            <span>ترتيب الظهور</span>
            <small>الأقسام ذات الرقم الأصغر تظهر أولًا في الصفحة الرئيسية والمتجر.</small>
            <input
              className="form-input"
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })}
            />
          </label>

          <label className="admin-field">
            <span>صورة القسم من الجهاز</span>
            <small>ارفعي صورة JPG أو PNG أو WebP. سيتم حفظها كمسار داخل السيرفر تلقائيًا.</small>
            <input
              key={fileInputKey}
              className="form-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setImageFile(event.target.files?.[0] || null)}
            />
          </label>
        </div>

        {(visibleImage || imageFile) && (
          <div className="category-image-manager mt-5">
            <div>
              <span>معاينة صورة القسم</span>
              <small>{imageFile ? 'الصورة الجديدة المختارة قبل الحفظ.' : 'الصورة الحالية المحفوظة للقسم.'}</small>
            </div>
            {visibleImage ? <img src={visibleImage} alt="معاينة صورة القسم" /> : null}
            <div className="flex flex-wrap gap-2">
              {imageFile && (
                <button type="button" className="btn-soft" onClick={() => { setImageFile(null); setFileInputKey((value) => value + 1); }}>
                  إلغاء الصورة المختارة
                </button>
              )}
              {editingId && form.image && !imageFile && (
                <button type="button" className="btn-soft text-error" onClick={() => removeImage.mutate()} disabled={removeImage.isPending}>
                  حذف الصورة الحالية
                </button>
              )}
            </div>
          </div>
        )}

        <label className={`admin-toggle mt-4 ${form.isActive ? 'is-on' : ''}`}>
          <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
          <span>
            <strong>قسم نشط ويظهر في المتجر</strong>
            <small>لو أغلقت الاختيار، القسم يختفي من المتجر العام ومعه منتجاته العامة.</small>
          </span>
        </label>

        <div className="admin-actions">
          <button className="btn-primary" disabled={save.isPending}>
            {save.isPending ? 'جاري الحفظ...' : editingId ? 'تحديث القسم' : 'إضافة القسم'}
          </button>
          {editingId && <button type="button" className="btn-soft" onClick={reset}>إلغاء التعديل</button>}
        </div>
      </form>

      <section className="admin-panel mt-5">
        <div className="admin-section-title">
          <div>
            <h2>الأقسام الحالية</h2>
            <p>راجع اسم القسم والرابط وعدد المنتجات والصورة قبل الحذف أو التعديل.</p>
          </div>
          <span className="admin-badge">{categories.length} قسم</span>
        </div>

        <div className="overflow-x-auto mt-4">
          {isLoading ? <p className="p-10 text-center">جاري التحميل...</p> : (
            <table className="admin-table min-w-[760px]">
              <thead>
                <tr>
                  <th>القسم</th>
                  <th>الرابط</th>
                  <th>المنتجات</th>
                  <th>الترتيب</th>
                  <th>الحالة</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-pink-50 border border-border">
                          {category.image ? (
                            <img src={assetUrl(category.image)} alt="" className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <span className="grid h-full place-items-center text-xl" aria-hidden="true">🗂️</span>
                          )}
                        </div>
                        <div>
                          <strong>{category.name}</strong>
                          <small className="block text-text-secondary">{category.image ? 'له صورة مرفوعة' : 'بدون صورة'}</small>
                        </div>
                      </div>
                    </td>
                    <td dir="ltr">{category.slug}</td>
                    <td>{category._count?.products || 0}</td>
                    <td>{category.sortOrder}</td>
                    <td><span className={`admin-status ${category.isActive ? 'is-success' : 'is-error'}`}>{category.isActive ? 'نشط' : 'موقوف'}</span></td>
                    <td className="text-left">
                      <button className="text-primary font-bold ml-4" onClick={() => startEdit(category)}>تعديل</button>
                      <button className="text-error font-bold" onClick={() => window.confirm('حذف أو أرشفة القسم؟') && remove.mutate(category.id)}>حذف</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
