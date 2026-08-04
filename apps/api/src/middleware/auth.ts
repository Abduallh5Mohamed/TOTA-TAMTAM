import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  adminUser?: { id: string; email: string; name: string; role: string };
}

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new AppError('إعداد JWT_SECRET مفقود أو غير آمن', 500);
  }
  return secret;
}

export async function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.admin_token;
    if (!token) throw new AppError('يرجى تسجيل الدخول أولًا', 401);

    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string };
    const user = await prisma.adminUser.findUnique({ where: { id: decoded.userId } });
    if (!user?.isActive) throw new AppError('الحساب غير موجود أو غير نشط', 401);

    req.adminUser = { id: user.id, email: user.email, name: user.name, role: user.role };
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(new AppError('انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى', 401));
  }
}
