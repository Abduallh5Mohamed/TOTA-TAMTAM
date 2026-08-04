import { Router } from 'express';
import { Prisma } from '@prisma/client';
import {
  createOrderSchema,
  hasUniqueOrderVariants,
  trackOrderSchema
} from '@tota-tamtam/contracts';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { canAcceptNewOrders, getOrderPauseMessage } from '../utils/orderAcceptance';
import { createOrderNumber } from '../utils/orderHelpers';

export const publicRoutes = Router();
const param = (value: string | string[]) => Array.isArray(value) ? value[0] : value;

const setPublicCache = (res: import('express').Response, seconds: number) => {
  res.setHeader('Cache-Control', `public, max-age=${seconds}, stale-while-revalidate=${seconds * 5}`);
};

const parsePageParam = (value: unknown, fallback: number, max: number) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
};

const defaultPublicSettings = {
  name: 'TOTA & TAMTAM',
  phone: '01000000000',
  whatsapp: '201000000000',
  address: 'القاهرة، مصر',
  isAcceptingOrders: true,
  closedMessage: 'عذرًا، المتجر لا يستقبل طلبات جديدة حاليًا',
  acceptingOrdersStartsAt: null
};

publicRoutes.get('/categories', async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { products: { where: { isActive: true, deletedAt: null } } }
        }
      }
    });
    setPublicCache(res, 300);
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

publicRoutes.get('/products', async (req, res, next) => {
  try {
    const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 120) : undefined;
    const featured = req.query.featured === 'true';
    const page = parsePageParam(req.query.page, 1, 10_000);
    const limit = parsePageParam(req.query.limit, 12, 48);
    const andFilters: Prisma.ProductWhereInput[] = [];

    if (featured) {
      andFilters.push({
        OR: [
          { isFeatured: true },
          { variants: { some: { isActive: true, deletedAt: null, price: { not: null } } } }
        ]
      });
    }

    if (search) {
      andFilters.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      deletedAt: null,
      category: { isActive: true, deletedAt: null },
      ...(categoryId ? { categoryId } : {}),
      ...(andFilters.length ? { AND: andFilters } : {})
    };

    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          basePrice: true,
          categoryId: true,
          isActive: true,
          isFeatured: true,
          sortOrder: true,
          category: { select: { id: true, name: true, slug: true } },
          images: {
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
            take: 1,
            select: { id: true, path: true, altText: true, isPrimary: true, sortOrder: true }
          },
          variants: {
            where: { isActive: true, deletedAt: null },
            select: { id: true, price: true, stock: true }
          }
        }
      })
    ]);

    setPublicCache(res, 30);
    res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
});

publicRoutes.get('/products/:slug', async (req, res, next) => {
  try {
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: param(req.params.slug) }, { slug: param(req.params.slug) }],
        isActive: true,
        deletedAt: null,
        category: { isActive: true, deletedAt: null }
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
        variants: {
          where: { isActive: true, deletedAt: null },
          orderBy: [{ color: 'asc' }, { size: 'asc' }]
        }
      }
    });
    if (!product) throw new AppError('المنتج غير موجود أو غير متاح حاليًا', 404);
    setPublicCache(res, 120);
    res.json(product);
  } catch (error) {
    next(error);
  }
});

publicRoutes.get('/delivery-zones', async (_req, res, next) => {
  try {
    const zones = await prisma.deliveryZone.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { name: 'asc' }
    });
    setPublicCache(res, 300);
    res.json(zones);
  } catch (error) {
    next(error);
  }
});

publicRoutes.get('/settings/public', async (_req, res, next) => {
  try {
    const settings = await prisma.storeSettings.findUnique({ where: { id: 'singleton' } });
    const data = settings || defaultPublicSettings;
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      ...data,
      isAcceptingOrders: canAcceptNewOrders(data)
    });
  } catch (error) {
    next(error);
  }
});

publicRoutes.post('/orders', async (req, res, next) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new AppError(parsed.error.errors[0]?.message || 'بيانات الطلب غير صحيحة', 400));
    return;
  }

  const body = parsed.data;
  if (!hasUniqueOrderVariants(body.items)) {
    next(new AppError('لا يمكن تكرار نفس المقاس واللون داخل الطلب', 400));
    return;
  }

  try {
    const existing = await prisma.order.findUnique({
      where: { clientRequestId: body.clientRequestId },
      include: {
        deliveryZone: true,
        items: true,
        statusHistory: { orderBy: { changedAt: 'asc' } }
      }
    });
    if (existing) {
      res.json(existing);
      return;
    }

    const settings = await prisma.storeSettings.findUnique({ where: { id: 'singleton' } });
    const pauseMessage = getOrderPauseMessage(settings);
    if (pauseMessage) throw new AppError(pauseMessage, 409);

    const result = await prisma.$transaction(
      async (tx) => {
        const transactionSettings = await tx.storeSettings.findUnique({ where: { id: 'singleton' } });
        const transactionPauseMessage = getOrderPauseMessage(transactionSettings);
        if (transactionPauseMessage) throw new AppError(transactionPauseMessage, 409);

        const zone = await tx.deliveryZone.findFirst({
          where: { id: body.deliveryZoneId, isActive: true, deletedAt: null }
        });
        if (!zone) throw new AppError('منطقة التوصيل غير متاحة حاليًا', 400);

        const order = await tx.order.create({
          data: {
            orderNumber: createOrderNumber(),
            clientRequestId: body.clientRequestId,
            customerName: body.customerName,
            phone: body.phone,
            altPhone: body.altPhone || null,
            deliveryZoneId: zone.id,
            deliveryZoneName: zone.name,
            area: body.area,
            street: body.street,
            building: body.building,
            floor: body.floor || null,
            apartment: body.apartment || null,
            landmark: body.landmark || null,
            deliveryNotes: body.deliveryNotes || null,
            subtotal: new Prisma.Decimal(0),
            deliveryFee: zone.fee,
            total: zone.fee,
            statusHistory: {
              create: { toStatus: 'pending', note: 'تم استلام الطلب' }
            }
          }
        });

        let subtotal = new Prisma.Decimal(0);

        for (const requestedItem of body.items) {
          const variant = await tx.productVariant.findFirst({
            where: {
              id: requestedItem.variantId,
              isActive: true,
              deletedAt: null,
              product: { isActive: true, deletedAt: null }
            },
            include: {
              product: {
                include: {
                  images: {
                    orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
                    take: 1
                  }
                }
              }
            }
          });

          if (!variant) throw new AppError('أحد المنتجات أو المقاسات لم يعد متاحًا', 409);

          const updated = await tx.productVariant.updateMany({
            where: { id: variant.id, stock: { gte: requestedItem.quantity } },
            data: { stock: { decrement: requestedItem.quantity } }
          });
          if (updated.count !== 1) {
            throw new AppError(`الكمية المطلوبة من ${variant.product.name} غير متاحة`, 409);
          }

          const currentVariant = await tx.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
          const unitPrice = variant.price || variant.product.basePrice;
          const lineTotal = unitPrice.mul(requestedItem.quantity);
          subtotal = subtotal.add(lineTotal);

          const item = await tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: variant.productId,
              variantId: variant.id,
              productNameSnapshot: variant.product.name,
              skuSnapshot: variant.sku,
              sizeSnapshot: variant.size,
              colorSnapshot: variant.color,
              imageSnapshot: variant.product.images[0]?.path || null,
              quantity: requestedItem.quantity,
              unitPrice,
              totalPrice: lineTotal
            }
          });

          await tx.inventoryMovement.create({
            data: {
              variantId: variant.id,
              orderId: order.id,
              orderItemId: item.id,
              type: 'order_reservation',
              quantity: -requestedItem.quantity,
              stockAfter: currentVariant.stock,
              note: `حجز مخزون للطلب ${order.orderNumber}`
            }
          });
        }

        if (subtotal.lt(zone.minimumOrder)) {
          throw new AppError(`الحد الأدنى للطلب في ${zone.name} هو ${zone.minimumOrder.toString()} ج.م`, 400);
        }

        await tx.order.update({
          where: { id: order.id },
          data: { subtotal, total: subtotal.add(zone.fee) }
        });

        return tx.order.findUniqueOrThrow({
          where: { id: order.id },
          include: {
            deliveryZone: true,
            items: true,
            statusHistory: { orderBy: { changedAt: 'asc' } }
          }
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const existing = await prisma.order.findUnique({
        where: { clientRequestId: body.clientRequestId },
        include: { deliveryZone: true, items: true, statusHistory: true }
      });
      if (existing) {
        res.json(existing);
        return;
      }
    }
    next(error);
  }
});

publicRoutes.post('/orders/track', async (req, res, next) => {
  try {
    const parsed = trackOrderSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.errors[0]?.message || 'بيانات التتبع غير صحيحة', 400);

    const order = await prisma.order.findFirst({
      where: {
        orderNumber: { equals: parsed.data.orderNumber, mode: 'insensitive' },
        phone: { endsWith: parsed.data.phoneLastFour }
      },
      include: {
        deliveryZone: true,
        items: true,
        statusHistory: { orderBy: { changedAt: 'asc' } }
      }
    });
    if (!order) throw new AppError('لم نعثر على الطلب، راجع رقم الطلب وآخر 4 أرقام من الهاتف', 404);
    res.json(order);
  } catch (error) {
    next(error);
  }
});
