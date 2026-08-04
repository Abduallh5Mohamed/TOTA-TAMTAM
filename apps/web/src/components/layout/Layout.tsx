import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import FloatingCart from './FloatingCart';
import { ToastContainer } from '../ui/Toast';
import { RouteLoader } from '../ui/StoreLoader';

export const Layout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <FloatingCart />
      <ToastContainer />
      <RouteLoader />
    </div>
  );
};
export default Layout;
