import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/layout/Layout';
import { StoreLoader } from './components/ui/StoreLoader';

const HomePage = lazy(() => import('./pages/HomePage'));
const MenuPage = lazy(() => import('./pages/MenuPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));
const TrackOrderPage = lazy(() => import('./pages/TrackOrderPage'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const OrdersPage = lazy(() => import('./pages/admin/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/admin/OrderDetailPage'));
const ProductsPage = lazy(() => import('./pages/admin/ProductsPage'));
const CategoriesPage = lazy(() => import('./pages/admin/CategoriesPage'));
const DeliveryZonesPage = lazy(() => import('./pages/admin/DeliveryZonesPage'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'));
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } });

export default function App() {
  useEffect(() => {
    const timer = window.setTimeout(() => document.getElementById('boot-loader')?.classList.add('is-hiding'), 80);
    return () => window.clearTimeout(timer);
  }, []);
  return <QueryClientProvider client={queryClient}><BrowserRouter><Suspense fallback={<StoreLoader />}><Routes>
    <Route element={<Layout />}><Route path="/" element={<HomePage />} /><Route path="/shop" element={<MenuPage />} /><Route path="/product/:slug" element={<ProductDetailPage />} /><Route path="/cart" element={<CartPage />} /><Route path="/checkout" element={<CheckoutPage />} /><Route path="/order-success/:orderNumber" element={<OrderSuccessPage />} /><Route path="/track-order" element={<TrackOrderPage />} /></Route>
    <Route path="/admin/login" element={<AdminLoginPage />} /><Route path="/admin" element={<AdminLayout />}><Route index element={<Navigate to="dashboard" replace />} /><Route path="dashboard" element={<DashboardPage />} /><Route path="orders" element={<OrdersPage />} /><Route path="orders/:id" element={<OrderDetailPage />} /><Route path="products" element={<ProductsPage />} /><Route path="categories" element={<CategoriesPage />} /><Route path="delivery-zones" element={<DeliveryZonesPage />} /><Route path="settings" element={<SettingsPage />} /></Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense></BrowserRouter></QueryClientProvider>;
}
