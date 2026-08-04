import { Link, useLocation } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';

export default function FloatingCart() {
  const count = useCartStore((state) => state.getItemCount());
  const total = useCartStore((state) => state.getSubtotal());
  const location = useLocation();

  if (!count || ['/cart', '/checkout', '/admin', '/order-success'].some((path) => location.pathname.startsWith(path))) {
    return null;
  }

  return (
    <Link to="/cart" className="md:hidden fixed left-4 bottom-4 z-30 bg-secondary text-white shadow-2xl rounded-full px-5 py-3 font-bold">
      السلة · {count} · {total.toFixed(2)} ج.م
    </Link>
  );
}
