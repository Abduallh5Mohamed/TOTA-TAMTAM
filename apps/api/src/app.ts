import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { publicRoutes } from './routes/public';
import { adminRoutes } from './routes/admin';
import { errorHandler } from './middleware/errorHandler';
import { uploadsRoot } from './middleware/upload';

const app = express();
const port = Number(process.env.PORT || 4000);
const webOrigin = process.env.WEB_ORIGIN || process.env.CORS_ORIGIN || 'http://localhost:5173';

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: webOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/uploads', express.static(uploadsRoot, { immutable: true, maxAge: '7d' }));

app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'طلبات كثيرة، حاول مرة أخرى بعد قليل' }
}));

app.use('/api/admin/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'محاولات دخول كثيرة، حاول مرة أخرى بعد 15 دقيقة' }
}));

app.use('/api/orders', rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'تم إرسال طلبات كثيرة، انتظر دقيقة وحاول مرة أخرى' }
}));

app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'TOTA & TAMTAM API', timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'المسار المطلوب غير موجود' });
});

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`TOTA & TAMTAM API: http://localhost:${port}`);
  });
}

export default app;
