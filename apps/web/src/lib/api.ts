import axios from 'axios';
import type { ProductListResponse } from '../types';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
export const ASSET_URL = API_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

export const assetUrl = (path?: string | null) => {
  if (!path) return '';
  return path.startsWith('http') ? path : `${ASSET_URL}${path}`;
};

export const getCategories = () => api.get('/categories').then((res) => res.data);
export const getProducts = (params?: { categoryId?: string; search?: string; featured?: boolean; page?: number; limit?: number }) =>
  api.get<ProductListResponse>('/products', { params }).then((res) => res.data);
export const getProduct = (slug: string) => api.get(`/products/${slug}`).then((res) => res.data);
export const getDeliveryZones = () => api.get('/delivery-zones').then((res) => res.data);
export const getPublicSettings = () => api.get('/settings/public').then((res) => res.data);
export const createOrder = (data: unknown) => api.post('/orders', data).then((res) => res.data);
export const trackOrder = (data: unknown) => api.post('/orders/track', data).then((res) => res.data);

export const adminLogin = (data: unknown) => api.post('/admin/auth/login', data).then((res) => res.data);
export const adminLogout = () => api.post('/admin/auth/logout').then((res) => res.data);
export const getAdminMe = () => api.get('/admin/auth/me').then((res) => res.data);
export const getAdminDashboard = () => api.get('/admin/dashboard').then((res) => res.data);
export const getAdminOrders = (params?: { status?: string; search?: string }) =>
  api.get('/admin/orders', { params }).then((res) => res.data);
export const getAdminOrder = (id: string) => api.get(`/admin/orders/${id}`).then((res) => res.data);
export const updateAdminOrderStatus = (id: string, data: unknown) =>
  api.patch(`/admin/orders/${id}/status`, data).then((res) => res.data);

export const getAdminCategories = () => api.get('/admin/categories').then((res) => res.data);
export const createAdminCategory = (data: unknown) => api.post('/admin/categories', data).then((res) => res.data);
export const updateAdminCategory = (id: string, data: unknown) =>
  api.put(`/admin/categories/${id}`, data).then((res) => res.data);
export const uploadAdminCategoryImage = (id: string, file: File) => {
  const form = new FormData();
  form.append('image', file);
  return api.post(`/admin/categories/${id}/image`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then((res) => res.data);
};
export const deleteAdminCategoryImage = (id: string) =>
  api.delete(`/admin/categories/${id}/image`).then((res) => res.data);
export const deleteAdminCategory = (id: string) => api.delete(`/admin/categories/${id}`).then((res) => res.data);

export const getAdminProducts = () => api.get('/admin/products').then((res) => res.data);
export const createAdminProduct = (data: unknown) => api.post('/admin/products', data).then((res) => res.data);
export const updateAdminProduct = (id: string, data: unknown) =>
  api.put(`/admin/products/${id}`, data).then((res) => res.data);
export const deleteAdminProduct = (id: string) => api.delete(`/admin/products/${id}`).then((res) => res.data);
export const uploadProductImages = (id: string, files: File[]) => {
  const form = new FormData();
  files.forEach((file) => form.append('images', file));
  return api.post(`/admin/products/${id}/images`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then((res) => res.data);
};
export const setPrimaryImage = (productId: string, imageId: string) =>
  api.patch(`/admin/products/${productId}/images/${imageId}`, { isPrimary: true }).then((res) => res.data);
export const updateProductImage = (productId: string, imageId: string, data: { sortOrder?: number; altText?: string }) =>
  api.patch(`/admin/products/${productId}/images/${imageId}`, data).then((res) => res.data);
export const deleteProductImage = (productId: string, imageId: string) =>
  api.delete(`/admin/products/${productId}/images/${imageId}`).then((res) => res.data);

export const getAdminDeliveryZones = () => api.get('/admin/delivery-zones').then((res) => res.data);
export const createAdminDeliveryZone = (data: unknown) =>
  api.post('/admin/delivery-zones', data).then((res) => res.data);
export const updateAdminDeliveryZone = (id: string, data: unknown) =>
  api.put(`/admin/delivery-zones/${id}`, data).then((res) => res.data);
export const deleteAdminDeliveryZone = (id: string) =>
  api.delete(`/admin/delivery-zones/${id}`).then((res) => res.data);

export const getAdminSettings = () => api.get('/admin/settings').then((res) => res.data);
export const updateAdminSettings = (data: unknown) => api.patch('/admin/settings', data).then((res) => res.data);

export default api;
