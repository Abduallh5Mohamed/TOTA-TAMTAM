import fs from 'node:fs/promises';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import {
  adminLoginSchema,
  categorySchema,
  deliveryZoneSchema,
  productSchema,
  storeSettingsSchema,
  updateOrderStatusSchema
} from '@tota-tamtam/contracts';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest, getJwtSecret } from '../middleware/auth';
import {
  resolveUploadedFile,
  uploadCategoryImage,
  uploadProductImages
} from '../middleware/upload';
import { validateStatusTransition } from '../utils/orderHelpers';

export const adminRoutes = Router();
const param = (value: string | string[]) => Array.isArray(value) ? value[0] : value;

async function deleteUploadedCategoryImage(image?: string | null) {
  if (!image?.startsWith('/uploads/categories/')) return;
  await fs.unlink(resolveUploadedFile(image)).catch(() => undefined);
}

async function hasValidImageSignature(file: Express.Multer.File) {
  const handle = await fs.open(file.path, 'r');
  try {
    const buffer = Buffer.alloc(12);
    await handle.read(buffer, 0, buffer.length, 0);
    if (file.mimetype === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    if (file.mimetype === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (file.mimetype === 'image/webp') return buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
    return false;
  } finally {
    await handle.close();
  }
}

adminRoutes.post('/auth/login', async (req, res, next) => {
  try {
    const parsed = adminLoginSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.errors[0]?.message || 'بيانات الدخول غير صحيحة', 400);

    const user = await prisma.adminUser.findUnique({
      where: { email: parsed.data.email.toLowerCase() }
    });
    if (!user?.isActive || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      throw new AppError('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401);
    }

    await prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const token = jwt.sign({ userId: user.id }, getJwtSecret(), { expiresIn: '24h' });
    res.cookie('admin_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/'
    });
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    next(error);
  }
});

adminRoutes.post('/auth/logout', (_req, res) => {
  res.clearCookie('admin_token', { path: '/' });
  res.json({ message: 'تم تسجيل الخروج' });
});

adminRoutes.use(authMiddleware);

adminRoutes.get('/auth/me', (req: AuthRequest, res) => {
  res.json({ user: req.adminUser });
});

adminRoutes.get('/dashboard', async (_req, res, next) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const [newOrders, activeOrders, completedOrders, totals, lowStock] = await Promise.all([
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.order.count({ where: { status: { in: ['confirmed', 'preparing', 'ready', 'out_for_delivery'] } } }),
      prisma.order.count({ where: { status: 'delivered', updatedAt: { gte: start } } }),
      prisma.order.aggregate({
        where: { status: 'delivered', updatedAt: { gte: start } },
        _sum: { total: true },
        _avg: { total: true }
      }),
      prisma.productVariant.count({
        where: { isActive: true, deletedAt: null, stock: { lte: 3 } }
      })
    ]);

    res.json({
      newOrders,
      activeOrders,
      completedOrders,
      todayRevenue: Number(totals._sum.total || 0),
      avgOrderValue: Number(totals._avg.total || 0),
      lowStock
    });
  } catch (error) {
    next(error);
  }
});

adminRoutes.get('/orders', async (req, res, next) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
    const orders = await prisma.order.findMany({
      where: {
        ...(status && status !== 'all' ? { status: status as never } : {}),
        ...(search
          ? {
              OR: [
                { orderNumber: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
                { customerName: { contains: search, mode: 'insensitive' } }
              ]
            }
          : {})
      },
      orderBy: { createdAt: 'desc' },
      include: { items: true, deliveryZone: true }
    });
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

adminRoutes.get('/orders/:id', async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: param(req.params.id) },
      include: {
        items: true,
        deliveryZone: true,
        statusHistory: {
          orderBy: { changedAt: 'asc' },
          include: { changedBy: { select: { name: true } } }
        }
      }
    });
    if (!order) throw new AppError('الطلب غير موجود', 404);
    res.json(order);
  } catch (error) {
    next(error);
  }
});

adminRoutes.patch('/orders/:id/status', async (req: AuthRequest, res, next) => {
  try {
    const parsed = updateOrderStatusSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.errors[0]?.message || 'حالة الطلب غير صحيحة', 400);

    const order = await prisma.order.findUnique({
      where: { id: param(req.params.id) },
      include: { items: true }
    });
    if (!order) throw new AppError('الطلب غير موجود', 404);
    if (!validateStatusTransition(order.status, parsed.data.status)) {
      throw new AppError('لا يمكن تنفيذ هذا الانتقال في حالة الطلب', 409);
    }
    if (['cancelled', 'rejected'].includes(parsed.data.status) && !parsed.data.note) {
      throw new AppError('سبب الإلغاء أو الرفض مطلوب', 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const changed = await tx.order.updateMany({
        where: { id: order.id, status: order.status },
        data: {
          status: parsed.data.status,
          paymentStatus: parsed.data.status === 'delivered' ? 'paid' : order.paymentStatus
        }
      });
      if (changed.count !== 1) throw new AppError('تم تعديل الطلب بواسطة مستخدم آخر، أعد تحميل الصفحة', 409);

      if (['cancelled', 'rejected'].includes(parsed.data.status) && !order.stockRestoredAt) {
        for (const item of order.items) {
          if (!item.variantId) continue;
          const variant = await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } }
          });
          await tx.inventoryMovement.create({
            data: {
              variantId: item.variantId,
              orderId: order.id,
              orderItemId: item.id,
              changedById: req.adminUser?.id,
              type: 'order_restore',
              quantity: item.quantity,
              stockAfter: variant.stock,
              note: parsed.data.note
            }
          });
        }
        await tx.order.update({
          where: { id: order.id },
          data: { stockRestoredAt: new Date() }
        });
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: parsed.data.status,
          note: parsed.data.note || null,
          changedById: req.adminUser?.id
        }
      });

      return tx.order.findUniqueOrThrow({
        where: { id: order.id },
        include: { items: true, deliveryZone: true, statusHistory: { orderBy: { changedAt: 'asc' } } }
      });
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

adminRoutes.get('/categories', async (_req, res, next) => {
  try {
    res.json(await prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } }
    }));
  } catch (error) {
    next(error);
  }
});

adminRoutes.post('/categories', async (req, res, next) => {
  try {
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.errors[0]?.message || 'بيانات القسم غير صحيحة', 400);
    res.status(201).json(await prisma.category.create({ data: parsed.data }));
  } catch (error) {
    next(error);
  }
});

adminRoutes.put('/categories/:id', async (req, res, next) => {
  try {
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.errors[0]?.message || 'بيانات القسم غير صحيحة', 400);
    res.json(await prisma.category.update({ where: { id: param(req.params.id) }, data: parsed.data }));
  } catch (error) {
    next(error);
  }
});

adminRoutes.post('/categories/:id/image', uploadCategoryImage.single('image'), async (req, res, next) => {
  const file = req.file;
  try {
    if (!file) throw new AppError('اختر صورة للقسم أولًا', 400);
    if (!(await hasValidImageSignature(file))) throw new AppError('محتوى الصورة لا يطابق نوع الملف', 400);

    const category = await prisma.category.findUnique({ where: { id: param(req.params.id) } });
    if (!category) throw new AppError('القسم غير موجود', 404);

    const updated = await prisma.category.update({
      where: { id: category.id },
      data: { image: `/uploads/categories/${file.filename}` }
    });

    await deleteUploadedCategoryImage(category.image);
    res.status(201).json(updated);
  } catch (error) {
    if (file) await fs.unlink(file.path).catch(() => undefined);
    next(error);
  }
});

adminRoutes.delete('/categories/:id/image', async (req, res, next) => {
  try {
    const category = await prisma.category.findUnique({ where: { id: param(req.params.id) } });
    if (!category) throw new AppError('القسم غير موجود', 404);

    await prisma.category.update({
      where: { id: category.id },
      data: { image: null }
    });
    await deleteUploadedCategoryImage(category.image);

    res.json({ message: 'تم حذف صورة القسم' });
  } catch (error) {
    next(error);
  }
});

adminRoutes.delete('/categories/:id', async (req, res, next) => {
  try {
    const linked = await prisma.product.count({ where: { categoryId: param(req.params.id) } });
    if (linked > 0) {
      const category = await prisma.category.update({
        where: { id: param(req.params.id) },
        data: { isActive: false, deletedAt: new Date() }
      });
      res.json({ message: 'تمت أرشفة القسم لوجود منتجات مرتبطة به', data: category });
      return;
    }
    await prisma.category.delete({ where: { id: param(req.params.id) } });
    res.json({ message: 'تم حذف القسم' });
  } catch (error) {
    next(error);
  }
});

const productInclude = {
  category: true,
  images: { orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }] },
  variants: { where: { deletedAt: null }, orderBy: [{ color: 'asc' as const }, { size: 'asc' as const }] }
};

adminRoutes.get('/products', async (_req, res, next) => {
  try {
    res.json(await prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: productInclude
    }));
  } catch (error) {
    next(error);
  }
});

adminRoutes.post('/products', async (req: AuthRequest, res, next) => {
  try {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.errors[0]?.message || 'بيانات المنتج غير صحيحة', 400);
    const { variants, ...productData } = parsed.data;

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: { ...productData, basePrice: new Prisma.Decimal(productData.basePrice) }
      });
      for (const variantData of variants) {
        const variant = await tx.productVariant.create({
          data: {
            productId: created.id,
            sku: variantData.sku,
            size: variantData.size,
            color: variantData.color,
            colorHex: variantData.colorHex || null,
            price: variantData.price ? new Prisma.Decimal(variantData.price) : null,
            stock: variantData.stock,
            isActive: variantData.isActive
          }
        });
        if (variant.stock > 0) {
          await tx.inventoryMovement.create({
            data: {
              variantId: variant.id,
              changedById: req.adminUser?.id,
              type: 'initial',
              quantity: variant.stock,
              stockAfter: variant.stock,
              note: 'رصيد افتتاحي'
            }
          });
        }
      }
      return tx.product.findUniqueOrThrow({ where: { id: created.id }, include: productInclude });
    });
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

adminRoutes.put('/products/:id', async (req: AuthRequest, res, next) => {
  try {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.errors[0]?.message || 'بيانات المنتج غير صحيحة', 400);
    const { variants, ...productData } = parsed.data;

    const productId = param(req.params.id);
    const product = await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: { ...productData, basePrice: new Prisma.Decimal(productData.basePrice) }
      });

      const existing = await tx.productVariant.findMany({ where: { productId } });
      const retained = new Set<string>();

      for (const data of variants) {
        const old = data.id ? existing.find((variant) => variant.id === data.id) : undefined;
        if (data.id && !old) throw new AppError('تنويعة غير تابعة لهذا المنتج', 400);

        if (old) {
          retained.add(old.id);
          const updated = await tx.productVariant.update({
            where: { id: old.id },
            data: {
              sku: data.sku,
              size: data.size,
              color: data.color,
              colorHex: data.colorHex || null,
              price: data.price ? new Prisma.Decimal(data.price) : null,
              stock: data.stock,
              isActive: data.isActive,
              deletedAt: null
            }
          });
          const delta = updated.stock - old.stock;
          if (delta !== 0) {
            await tx.inventoryMovement.create({
              data: {
                variantId: old.id,
                changedById: req.adminUser?.id,
                type: 'admin_adjustment',
                quantity: delta,
                stockAfter: updated.stock,
                note: 'تعديل المخزون من لوحة الإدارة'
              }
            });
          }
        } else {
          const created = await tx.productVariant.create({
            data: {
              productId,
              sku: data.sku,
              size: data.size,
              color: data.color,
              colorHex: data.colorHex || null,
              price: data.price ? new Prisma.Decimal(data.price) : null,
              stock: data.stock,
              isActive: data.isActive
            }
          });
          retained.add(created.id);
          if (created.stock > 0) {
            await tx.inventoryMovement.create({
              data: {
                variantId: created.id,
                changedById: req.adminUser?.id,
                type: 'initial',
                quantity: created.stock,
                stockAfter: created.stock,
                note: 'إضافة تنويعة جديدة'
              }
            });
          }
        }
      }

      for (const removed of existing.filter((variant) => !retained.has(variant.id))) {
        const used = await tx.orderItem.count({ where: { variantId: removed.id } });
        if (used > 0) {
          await tx.productVariant.update({
            where: { id: removed.id },
            data: { isActive: false, deletedAt: new Date() }
          });
        } else {
          await tx.inventoryMovement.deleteMany({ where: { variantId: removed.id } });
          await tx.productVariant.delete({ where: { id: removed.id } });
        }
      }

      return tx.product.findUniqueOrThrow({ where: { id: productId }, include: productInclude });
    });
    res.json(product);
  } catch (error) {
    next(error);
  }
});

adminRoutes.delete('/products/:id', async (req, res, next) => {
  try {
    const productId = param(req.params.id);
    const linked = await prisma.orderItem.count({ where: { productId } });
    if (linked > 0) {
      const product = await prisma.product.update({
        where: { id: productId },
        data: { isActive: false, deletedAt: new Date() }
      });
      res.json({ message: 'تمت أرشفة المنتج للحفاظ على تاريخ الطلبات', data: product });
      return;
    }

    const images = await prisma.productImage.findMany({ where: { productId } });
    const variants = await prisma.productVariant.findMany({
      where: { productId },
      select: { id: true }
    });
    await prisma.$transaction([
      prisma.inventoryMovement.deleteMany({
        where: { variantId: { in: variants.map((variant) => variant.id) } }
      }),
      prisma.product.delete({ where: { id: productId } })
    ]);
    await Promise.all(images.map((image) => fs.unlink(resolveUploadedFile(image.path)).catch(() => undefined)));
    res.json({ message: 'تم حذف المنتج نهائيًا' });
  } catch (error) {
    next(error);
  }
});

adminRoutes.post('/products/:id/images', uploadProductImages.array('images', 8), async (req, res, next) => {
  const files = (req.files || []) as Express.Multer.File[];
  try {
    if (files.length === 0) throw new AppError('اختر صورة واحدة على الأقل', 400);
    const signatures = await Promise.all(files.map(hasValidImageSignature));
    if (signatures.some((valid) => !valid)) throw new AppError('محتوى إحدى الصور لا يطابق نوع الملف', 400);
    const product = await prisma.product.findUnique({ where: { id: param(req.params.id) } });
    if (!product) throw new AppError('المنتج غير موجود', 404);

    const imageCount = await prisma.productImage.count({ where: { productId: product.id } });
    const created = await prisma.$transaction(
      files.map((file, index) =>
        prisma.productImage.create({
          data: {
            productId: product.id,
            path: `/uploads/products/${file.filename}`,
            altText: product.name,
            isPrimary: imageCount === 0 && index === 0,
            sortOrder: imageCount + index
          }
        })
      )
    );
    res.status(201).json(created);
  } catch (error) {
    await Promise.all(files.map((file) => fs.unlink(file.path).catch(() => undefined)));
    next(error);
  }
});

adminRoutes.patch('/products/:productId/images/:imageId', async (req, res, next) => {
  try {
    const image = await prisma.productImage.findFirst({
      where: { id: param(req.params.imageId), productId: param(req.params.productId) }
    });
    if (!image) throw new AppError('الصورة غير موجودة', 404);
    if (req.body.sortOrder !== undefined && (!Number.isInteger(req.body.sortOrder) || req.body.sortOrder < 0)) {
      throw new AppError('ترتيب الصورة غير صحيح', 400);
    }
    if (req.body.isPrimary === true) {
      await prisma.$transaction([
        prisma.productImage.updateMany({ where: { productId: param(req.params.productId) }, data: { isPrimary: false } }),
        prisma.productImage.update({ where: { id: image.id }, data: { isPrimary: true } })
      ]);
    }
    if (req.body.sortOrder !== undefined) {
      const siblings = await prisma.productImage.findMany({
        where: { productId: image.productId },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
      });
      const reordered = siblings.filter((item) => item.id !== image.id);
      const target = Math.min(req.body.sortOrder, reordered.length);
      reordered.splice(target, 0, image);
      await prisma.$transaction(
        reordered.map((item, index) =>
          prisma.productImage.update({ where: { id: item.id }, data: { sortOrder: index } })
        )
      );
    }
    if (req.body.altText !== undefined) {
      await prisma.productImage.update({
        where: { id: image.id },
        data: {
          altText: String(req.body.altText).slice(0, 200) || null
        }
      });
    }
    res.json({ message: 'تم تحديث الصورة' });
  } catch (error) {
    next(error);
  }
});

adminRoutes.delete('/products/:productId/images/:imageId', async (req, res, next) => {
  try {
    const image = await prisma.productImage.findFirst({
      where: { id: param(req.params.imageId), productId: param(req.params.productId) }
    });
    if (!image) throw new AppError('الصورة غير موجودة', 404);
    await prisma.productImage.delete({ where: { id: image.id } });
    await fs.unlink(resolveUploadedFile(image.path)).catch(() => undefined);
    if (image.isPrimary) {
      const nextImage = await prisma.productImage.findFirst({
        where: { productId: param(req.params.productId) },
        orderBy: { sortOrder: 'asc' }
      });
      if (nextImage) await prisma.productImage.update({ where: { id: nextImage.id }, data: { isPrimary: true } });
    }
    res.json({ message: 'تم حذف الصورة' });
  } catch (error) {
    next(error);
  }
});

adminRoutes.get('/delivery-zones', async (_req, res, next) => {
  try {
    res.json(await prisma.deliveryZone.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' }
    }));
  } catch (error) {
    next(error);
  }
});

adminRoutes.post('/delivery-zones', async (req, res, next) => {
  try {
    const parsed = deliveryZoneSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.errors[0]?.message || 'بيانات المنطقة غير صحيحة', 400);
    res.status(201).json(await prisma.deliveryZone.create({ data: parsed.data }));
  } catch (error) {
    next(error);
  }
});

adminRoutes.put('/delivery-zones/:id', async (req, res, next) => {
  try {
    const parsed = deliveryZoneSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.errors[0]?.message || 'بيانات المنطقة غير صحيحة', 400);
    res.json(await prisma.deliveryZone.update({ where: { id: param(req.params.id) }, data: parsed.data }));
  } catch (error) {
    next(error);
  }
});

adminRoutes.delete('/delivery-zones/:id', async (req, res, next) => {
  try {
    const linked = await prisma.order.count({ where: { deliveryZoneId: param(req.params.id) } });
    if (linked > 0) {
      await prisma.deliveryZone.update({
        where: { id: param(req.params.id) },
        data: { isActive: false, deletedAt: new Date() }
      });
      res.json({ message: 'تمت أرشفة المنطقة لوجود طلبات مرتبطة بها' });
      return;
    }
    await prisma.deliveryZone.delete({ where: { id: param(req.params.id) } });
    res.json({ message: 'تم حذف المنطقة' });
  } catch (error) {
    next(error);
  }
});

adminRoutes.get('/settings', async (_req, res, next) => {
  try {
    res.json(await prisma.storeSettings.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton' }
    }));
  } catch (error) {
    next(error);
  }
});

adminRoutes.patch('/settings', async (req, res, next) => {
  try {
    const parsed = storeSettingsSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.errors[0]?.message || 'إعدادات المتجر غير صحيحة', 400);
    res.json(await prisma.storeSettings.upsert({
      where: { id: 'singleton' },
      update: parsed.data,
      create: { id: 'singleton', ...parsed.data }
    }));
  } catch (error) {
    next(error);
  }
});
