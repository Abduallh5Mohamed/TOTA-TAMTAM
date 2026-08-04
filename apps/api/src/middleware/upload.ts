import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { AppError } from './errorHandler';

// Keep the media directory stable whether the server is launched from the
// repository root or the API package itself.
export const uploadsRoot = path.resolve(
  process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads')
);
export const productUploadsDir = path.join(uploadsRoot, 'products');
export const categoryUploadsDir = path.join(uploadsRoot, 'categories');
fs.mkdirSync(productUploadsDir, { recursive: true });
fs.mkdirSync(categoryUploadsDir, { recursive: true });

const allowed = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp']
]);

const createImageUploader = (destination: string, files: number) => multer({
  storage: multer.diskStorage({
    destination,
    filename: (_req, file, callback) => {
      callback(null, `${crypto.randomUUID()}${allowed.get(file.mimetype) || ''}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024, files },
  fileFilter: (_req, file, callback) => {
    if (!allowed.has(file.mimetype)) {
      callback(new AppError('الصور المسموحة: JPEG وPNG وWebP فقط', 400));
      return;
    }
    callback(null, true);
  }
});

export const uploadProductImages = createImageUploader(productUploadsDir, 8);
export const uploadCategoryImage = createImageUploader(categoryUploadsDir, 1);

export function resolveUploadedFile(publicPath: string) {
  if (publicPath.startsWith('/uploads/categories/')) {
    return path.join(categoryUploadsDir, path.basename(publicPath));
  }
  return path.join(productUploadsDir, path.basename(publicPath));
}
