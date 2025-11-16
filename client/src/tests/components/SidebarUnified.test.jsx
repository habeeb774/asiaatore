import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '../../components/SidebarUnified';
import * as CartContext from '../../stores/CartContext';
import * as LanguageContext from '../../stores/LanguageContext';
import { MemoryRouter } from 'react-router-dom';

describe('SidebarUnified (favorites)', () => {
  test('renders View button and SafeImage for favorite item', () => {
    const initialFavorites = [{ id: 'p1', name: 'Favorite One', image: '/images/hero-background.svg', price: 9.99 }];
  const onClose = vi.fn();
  // mock hooks
  vi.spyOn(CartContext, 'useCart').mockReturnValue({ cartItems: [], removeFromCart: vi.fn(), updateQuantity: vi.fn(), cartTotal: 0 });
  vi.spyOn(LanguageContext, 'useLanguage').mockReturnValue({ locale: 'en' });
    render(
      <MemoryRouter>
        <Sidebar isOpen={true} type="favorites" initialFavorites={initialFavorites} onClose={onClose} />
      </MemoryRouter>
    );

    // ensure view button is present
    const viewBtn = screen.getByRole('link', { name: /View|عرض/i });
    expect(viewBtn).toBeTruthy();

    // ensure SafeImage img exists
    const img = screen.getByAltText('Favorite One');
    expect(img).toBeTruthy();
  });
});
