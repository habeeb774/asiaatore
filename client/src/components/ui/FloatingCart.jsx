import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCartIcon } from 'lucide-react';
import useCartStore from '../../store/cart';

const FloatingCart = () => {
  const itemCount = useCartStore((state) => state.getItemCount());

  if (itemCount === 0) return null;

  return (
    <Link
      to="/cart"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-white shadow-lg transition hover:bg-primary/90 md:bottom-6 md:left-6"
    >
      <ShoppingCartIcon className="h-5 w-5" />
      <span className="text-sm font-medium">{itemCount}</span>
    </Link>
  );
};

export default FloatingCart;