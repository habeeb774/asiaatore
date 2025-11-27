import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from './Button';

const AddToCartButton = ({ onClick, className = '', children = 'إضافة للعربة', loading = false, disabled = false }) => {
  return (
    <Button
      onClick={onClick}
      className={className}
      variant="success"
      size="md"
      block
      loading={loading}
      disabled={disabled}
      leading={<ShoppingCart size={18} />}
    >
      {children}
    </Button>
  );
};

export default AddToCartButton;
