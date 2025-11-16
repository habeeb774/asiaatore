import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProductDetailPage from '../../../pages/ProductDetailPage';
import * as ProductsContext from '../../../stores/ProductsContext';
import * as CartContext from '../../../stores/CartContext';
import * as WishlistContext from '../../../stores/WishlistContext';
import * as AuthContext from '../../../stores/AuthContext';
import * as ToastContext from '../../../stores/ToastContext';

describe('ProductDetailPage interactions', () => {
  const product = {
    id: 'prod-1',
    slug: 'prod-1',
    name: 'Test product',
    nameEn: 'Test product',
    nameAr: 'منتج تجريبي',
    short: { en: 'short', ar: 'قصير' },
    image: '/vite.svg',
    price: 10,
    stock: 5,
    brand: 'brand-1',
    category: 'cat-1'
  };

  beforeEach(() => {
    // Ensure IntersectionObserver exists in test environment (jsdom)
    if (typeof window.IntersectionObserver !== 'function') {
      window.IntersectionObserver = class {
        constructor() {}
        observe() {}
        unobserve() {}
        disconnect() {}
      };
    }
    vi.spyOn(ProductsContext, 'useProducts').mockReturnValue({ getProductById: (id) => product, products: [product] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('adds to cart with selected quantity', async () => {
    const addToCart = vi.fn().mockReturnValue({ ok: true });
    vi.spyOn(CartContext, 'useCart').mockReturnValue({ addToCart });
    vi.spyOn(WishlistContext, 'useWishlist').mockReturnValue({ wishlistItems: [], addToWishlist: vi.fn(), removeFromWishlist: vi.fn() });
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: null });
  const toast = { success: vi.fn(), warn: vi.fn(), info: vi.fn() };
  vi.spyOn(ToastContext, 'useToast').mockReturnValue(toast);

    render(
      <MemoryRouter initialEntries={[`/products/${product.id}`]}>
        <Routes>
          <Route path="/products/:id" element={<ProductDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for the product to render
    const input = await screen.findByLabelText(/Quantity|الكمية/i);
    expect(input).toBeInTheDocument();

    // Increase quantity to 3
    const inc = screen.getByRole('button', { name: /Increase|Plus/i });
    fireEvent.click(inc);
    fireEvent.click(inc);

    const addBtn = screen.getByRole('button', { name: /Add to cart|أضف للسلة/i });
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(addToCart).toHaveBeenCalledWith(expect.objectContaining({ id: product.id }), 3);
    });
  });

  test('wishlist toggle requires auth and warns when not logged in then adds when logged in', async () => {
    const addToWishlist = vi.fn();
    const removeFromWishlist = vi.fn();
    vi.spyOn(CartContext, 'useCart').mockReturnValue({ addToCart: vi.fn() });
    vi.spyOn(WishlistContext, 'useWishlist').mockReturnValue({ wishlistItems: [], addToWishlist, removeFromWishlist });
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
  const toast = { success: vi.fn(), warn: vi.fn(), info: vi.fn() };
  vi.spyOn(ToastContext, 'useToast').mockReturnValue(toast);

    // Unauthenticated
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: null });

    render(
      <MemoryRouter initialEntries={[`/products/${product.id}`]}>
        <Routes>
          <Route path="/products/:id" element={<ProductDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    const wishlistBtn = await screen.findByRole('button', { name: /Add to wishlist|أضف للمفضلة|إزالة من المفضلة/i });
    fireEvent.click(wishlistBtn);

  expect(dispatchSpy).toHaveBeenCalled();
  expect(toast.warn).toHaveBeenCalled();
  // cleanup previous render before re-rendering
  cleanup();

    // Now simulate authenticated user
    vi.restoreAllMocks();
    vi.spyOn(ProductsContext, 'useProducts').mockReturnValue({ getProductById: (id) => product, products: [product] });
    vi.spyOn(WishlistContext, 'useWishlist').mockReturnValue({ wishlistItems: [], addToWishlist, removeFromWishlist });
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: { id: 'user1' } });
  vi.spyOn(ToastContext, 'useToast').mockReturnValue(toast);

    render(
      <MemoryRouter initialEntries={[`/products/${product.id}`]}>
        <Routes>
          <Route path="/products/:id" element={<ProductDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    const wishlistBtn2 = await screen.findByRole('button', { name: /Add to wishlist|أضف للمفضلة/i });
    fireEvent.click(wishlistBtn2);
    await waitFor(() => expect(addToWishlist).toHaveBeenCalledWith(expect.objectContaining({ id: product.id })));
    expect(toast.success).toHaveBeenCalled();
  });
});
