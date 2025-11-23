import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import Sidebar from '../../components/Sidebar';
import * as CartContext from '../../contexts/CartContext';
import * as LanguageContext from '../../context/LanguageContext';
import { MemoryRouter } from 'react-router-dom';

describe('Sidebar (favorites)', () => {
  test('renders favorites list and removes item via action button', async () => {
    const initialFavorites = [{ id: 'p1', name: 'Favorite One', image: '/images/hero-background.svg', price: 9.99 }];
    const onClose = vi.fn();
    // mock hooks
    vi.spyOn(CartContext, 'useCart').mockReturnValue({ cartItems: [], removeFromCart: vi.fn(), updateQuantity: vi.fn(), cartTotal: 0 });
    vi.spyOn(LanguageContext, 'useLanguage').mockReturnValue({ locale: 'en' });
    render(
      <MemoryRouter>
        <Sidebar open={true} type="favorites" initialFavorites={initialFavorites} onClose={onClose} />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 2, name: /Favorites/i })).toBeInTheDocument();
    expect(screen.getByAltText('Favorite One')).toBeInTheDocument();

    const favoriteRow = screen.getByText('Favorite One').closest('div').parentElement;
    const removeButton = within(favoriteRow).getByRole('button');

    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.getByText(/You have no favorite items/i)).toBeInTheDocument();
    });
  });
});
