import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductsView from '../../../pages/admin/views/ProductsView.jsx';
import * as adminProductsHook from '../../../pages/admin/hooks/useAdminProducts';
import * as categoriesHook from '../../../pages/admin/hooks/useCategories';
import * as toastCtx from '../../../contexts/ToastContext';

const sampleCategories = [{ id: 'cat-1', name: 'إلكترونيات' }];
const sampleProducts = [{
  id: 'p1',
  name: 'منتج اختبار',
  sku: 'SKU-1',
  brand: 'ماركة',
  price: 100,
  stock: 10,
  minStock: 2,
  status: 'active',
  categoryId: 'cat-1'
}];

const useAdminProductsSpy = vi.spyOn(adminProductsHook, 'useAdminProducts');
const useCategoriesSpy = vi.spyOn(categoriesHook, 'useCategories');
const useToastSpy = vi.spyOn(toastCtx, 'useToast');

const renderProductsView = ({ products = sampleProducts, categories = sampleCategories } = {}) => {
  const mocks = {
    createProduct: vi.fn().mockResolvedValue({ id: 'p-new' }),
    updateProduct: vi.fn().mockResolvedValue({ id: 'p1' }),
    deleteProduct: vi.fn().mockResolvedValue({}),
    importFromExcel: vi.fn(),
    exportToExcel: vi.fn().mockResolvedValue(new Blob())
  };

  useAdminProductsSpy.mockReturnValue({
    products,
    loading: false,
    error: null,
    ...mocks
  });

  useCategoriesSpy.mockReturnValue({ categories, loading: false, error: null });

  useToastSpy.mockReturnValue({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() });

  render(<ProductsView />);
  return mocks;
};

describe('ProductsView', () => {
  beforeEach(() => {
    useAdminProductsSpy.mockReset();
    useCategoriesSpy.mockReset();
    useToastSpy.mockReset();
  });

  test('renders product row and updates product via form submission', async () => {
    const { updateProduct } = renderProductsView();

    expect(screen.getByText('منتج اختبار')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'تعديل' }));

    // Updated placeholder text after form refactor
    const nameInput = screen.getByPlaceholderText('مثال: قميص قطني عالي الجودة');
    expect(nameInput.value).toBe('منتج اختبار');
    fireEvent.change(nameInput, { target: { value: 'منتج معدل' } });

    const priceInput = screen.getAllByPlaceholderText('0.00')[0];
    fireEvent.change(priceInput, { target: { value: '120.5' } });

    fireEvent.click(screen.getByRole('button', { name: 'تحديث المنتج' }));

    await waitFor(() => expect(updateProduct).toHaveBeenCalledWith('p1', expect.any(Object)));
    const payload = updateProduct.mock.calls[0][1];
    expect(payload.name).toBe('منتج معدل');
    expect(payload.price).toBe(120.5);
  });

  test('creates a new product when the form is submitted without editing product', async () => {
    const { createProduct } = renderProductsView();
    // Open the creation modal before accessing form fields (modal closed by default)
    fireEvent.click(screen.getByRole('button', { name: 'إضافة منتج' }));
    fireEvent.change(screen.getByPlaceholderText('مثال: قميص قطني عالي الجودة'), { target: { value: 'منتج جديد' } });
    fireEvent.change(screen.getAllByPlaceholderText('0.00')[0], { target: { value: '55' } });

    const selectCategory = screen.getAllByRole('combobox').find(el => el.hasAttribute('required'));
    expect(selectCategory).toBeTruthy();
    fireEvent.change(selectCategory, { target: { value: 'cat-1' } });

    // Trigger submit via the submit button (type=submit) and ensure form submit fires.
    fireEvent.click(screen.getByRole('button', { name: 'إضافة المنتج' }));
    // Fallback explicit submit in case click does not propagate in test environment.
    const formEl = screen.getByPlaceholderText('مثال: قميص قطني عالي الجودة').closest('form');
    if (formEl) {
      fireEvent.submit(formEl);
    }

    await waitFor(() => expect(createProduct).toHaveBeenCalledWith(expect.objectContaining({
      name: 'منتج جديد',
      category: 'cat-1',
      price: 55
    })));
  });

  test('deletes a product from the table actions', async () => {
    const { deleteProduct } = renderProductsView();

    fireEvent.click(screen.getByRole('button', { name: 'حذف' }));

    await waitFor(() => expect(deleteProduct).toHaveBeenCalledWith('p1'));
  });
});
