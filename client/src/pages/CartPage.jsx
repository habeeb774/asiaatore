import React from 'react';
import Button, { ButtonLink } from '../components/ui/Button';

const CartPage = () => {
  return (
    <div className="cart-page">
      <h1>السلة</h1>
      <p>لا توجد عناصر.</p>
  <ButtonLink to="/" variant="primary">متابعة التسوق</ButtonLink>
    </div>
  );
};

export default CartPage;
