import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'مدير المتجر';

  if (!email || !password || password.length < 8) {
    throw new Error('اضبط ADMIN_EMAIL وADMIN_PASSWORD (8 أحرف على الأقل) قبل تشغيل seed');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.adminUser.upsert({
    where: { email: email.toLowerCase() },
    update: { name, passwordHash, isActive: true },
    create: { email: email.toLowerCase(), name, passwordHash }
  });

  await prisma.storeSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      name: 'TOTA & TAMTAM',
      phone: '01000000000',
      whatsapp: '201000000000',
      address: 'القاهرة، مصر',
      isAcceptingOrders: true,
      closedMessage: 'عذرًا، المتجر لا يستقبل طلبات جديدة حاليًا',
      acceptingOrdersStartsAt: null
    }
  });

  for (const category of [
    { name: 'ملابس نسائية', slug: 'women', sortOrder: 1 },
    { name: 'ملابس أطفال', slug: 'kids', sortOrder: 2 }
  ]) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, sortOrder: category.sortOrder, isActive: true },
      create: category
    });
  }

  for (const zone of [
    { name: 'القاهرة', fee: 60, minimumOrder: 0 },
    { name: 'الجيزة', fee: 70, minimumOrder: 0 }
  ]) {
    await prisma.deliveryZone.upsert({
      where: { name: zone.name },
      update: {},
      create: zone
    });
  }

  console.log('TOTA & TAMTAM seed completed');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
