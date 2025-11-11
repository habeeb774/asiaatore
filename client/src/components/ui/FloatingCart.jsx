import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCartIcon } from 'lucide-react';
import { useCart } from '../../stores/CartContext';

const FloatingCart = () => {
  const { cartItems = [] } = useCart();
  const itemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

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