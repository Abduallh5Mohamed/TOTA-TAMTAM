import type { ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { MulterError } from 'multer';

export class AppError extends Error {
  constructor(message: string, public statusCode = 500) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  if (error instanceof MulterError) {
    res.status(400).json({
      error: error.code === 'LIMIT_FILE_SIZE' ? 'حجم الصورة يجب ألا يتجاوز 5MB' : 'تعذر رفع الصورة'
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'توجد قيمة مكررة لحقل يجب أن يكون فريدًا' });
      return;
    }
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'العنصر المطلوب غير موجود' });
      return;
    }
  }

  console.error(error);
  res.status(500).json({ error: 'حدث خطأ غير متوقع، حاول مرة أخرى' });
};
