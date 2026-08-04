# TOTA & TAMTAM

متجر عربي RTL لملابس النساء والأطفال، مع سلة شراء، طلب كزائر، دفع عند الاستلام، تتبع الطلب، ولوحة إدارة كاملة للكتالوج والمخزون والطلبات.

## التقنية والهيكل

```text
apps/
  api/          Express + TypeScript + Prisma
  web/          React + Vite + TypeScript
packages/
  contracts/    Zod schemas والأنواع المشتركة
docker-compose.yml
```

- PostgreSQL 16 لقاعدة البيانات.
- Prisma schema وmigrations داخل `apps/api/prisma`.
- المقاس واللون وSKU والمخزون على مستوى كل تنويعة.
- أسعار الطلب وصور وأسماء المنتجات محفوظة كلقطات تاريخية داخل بنود الطلب.
- جلسة الأدمن في Cookie آمنة `HttpOnly`، ولا تُحفظ JWT في `localStorage`.

## التشغيل لأول مرة

المتطلبات: Node.js 22+، npm، وDocker Desktop.

1. جهّز ملف البيئة:

   ```powershell
   Copy-Item .env.example apps/api/.env
   ```

   غيّر `JWT_SECRET` و`ADMIN_EMAIL` و`ADMIN_PASSWORD` قبل تشغيل seed. كلمة مرور الأدمن يجب ألا تقل عن 8 أحرف.

2. شغّل PostgreSQL وثبّت الاعتماديات:

   ```powershell
   docker compose up -d postgres
   npm install
   ```

   قاعدة Docker تعمل افتراضيًا على المنفذ `5433` لتجنب التعارض مع PostgreSQL محلي. يمكن تغييره عبر `POSTGRES_PORT`.

3. طبّق migrations وأنشئ البيانات الأساسية:

   ```powershell
   npm run db:generate
   npm run db:deploy
   npm run db:seed
   ```

4. شغّل المشروع:

   ```powershell
   npm run dev
   ```

- المتجر: `http://localhost:5173`
- لوحة الإدارة: `http://localhost:5173/admin/login`
- الـ API: `http://localhost:4000`
- فحص الصحة: `http://localhost:4000/health`

## أوامر مهمة

```powershell
npm run build
npm test
npm run lint
npm run db:migrate
npm run db:deploy
npm run db:seed
```

- `db:migrate` للتطوير وإنشاء migration جديدة.
- `db:deploy` لتطبيق migrations المحفوظة في الإنتاج.
- الصور تُحفظ محليًا داخل `apps/api/uploads/products`، ويجب ربط هذا المجلد بتخزين دائم عند النشر.

## فلو الطلب والمخزون

1. العميل يختار المنتج والمقاس واللون والكمية.
2. السلة تعرض سعر القطعة وإجمالي كل بند وإجمالي المنتجات.
3. منطقة التوصيل تحدد الرسوم والحد الأدنى، ثم يضغط العميل «تأكيد الطلب والدفع عند الاستلام».
4. السيرفر يعيد قراءة الأسعار والمخزون ويخصم الكمية داخل transaction واحدة.
5. الطلب يظهر فورًا للأدمن بالحالات: جديد، مؤكد، قيد التجهيز، جاهز، خرج للتوصيل، تم التسليم، ملغي أو مرفوض.
6. الإلغاء أو الرفض يعيد المخزون مرة واحدة ويسجل حركة الاسترجاع. التسليم يحول حالة الدفع إلى مدفوع.

## الحماية والفالديشن

- Zod validation مشترك بين الواجهة والـ API.
- تحقق من رقم الموبايل المصري والأسعار والكميات والمخزون وSKU وslug.
- الصور المسموحة JPEG/PNG/WebP حتى 5MB، مع فحص MIME وتوقيع الملف.
- Helmet، CORS allowlist، rate limiting عام ومحدد لتسجيل الدخول وإنشاء الطلبات.
- حذف المنتجات والأقسام ومناطق التوصيل المرتبطة بطلبات يتحول إلى أرشفة للحفاظ على التاريخ.

## إعدادات البيئة

| المتغير | الاستخدام |
|---|---|
| `DATABASE_URL` | رابط PostgreSQL |
| `JWT_SECRET` | سر جلسة الأدمن، 32 حرفًا على الأقل |
| `ADMIN_EMAIL` | بريد أول أدمن عند seed |
| `ADMIN_PASSWORD` | كلمة مرور أول أدمن عند seed |
| `ADMIN_NAME` | اسم الأدمن |
| `PORT` | منفذ الـ API |
| `WEB_ORIGIN` | رابط الواجهة المسموح له باستخدام الـ API |
| `UPLOAD_DIR` | مسار تخزين الصور، اختياري |

الدفع الإلكتروني وحسابات العملاء خارج نطاق الإصدار الحالي؛ الدفع عند الاستلام فقط.
