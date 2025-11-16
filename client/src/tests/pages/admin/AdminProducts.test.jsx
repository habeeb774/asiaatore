import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../../lib/queryClient';
// mock useNavigate to capture navigation calls for tests
const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => ({ ...(await vi.importActual('react-router-dom')), useNavigate: () => navigateMock }));
import { MemoryRouter } from 'react-router-dom';
import AdminProducts from '../../../pages/admin/Products';
import * as productsApi from '../../../services/api/products';
import * as toastCtx from '../../../stores/ToastContext';

describe('AdminProducts', () => {
  beforeEach(() => {
    if (typeof window.matchMedia !== 'function') {
      window.matchMedia = (query) => ({ matches: true, media: query, onchange: null, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false });
    }
    vi.spyOn(productsApi, 'useProducts').mockReturnValue({ data: { items: [ { id:'p1', slug:'p1', name: { en: 'Test' }, price: 100, stock: 10 } ], total: 1 }, isLoading:false, refetch: vi.fn() });
  vi.spyOn(productsApi, 'updateProduct').mockResolvedValue({ ok: true });
    vi.spyOn(productsApi, 'batchDiscount').mockResolvedValue({ ok: true });
  vi.spyOn(productsApi, 'addProductImage').mockResolvedValue({ ok: true });
  vi.spyOn(productsApi, 'addProductImages').mockResolvedValue([{ ok: true }, { ok: true }]);
  vi.spyOn(productsApi, 'useProduct').mockReturnValue({ data: { id: 'p1', images: [] }, isLoading: false, refetch: vi.fn() });
    vi.spyOn(toastCtx, 'useToast').mockReturnValue({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() });
  });

  afterEach(() => { vi.restoreAllMocks(); });

  test('inline price edit commits update', async () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminProducts />
      </MemoryRouter>
      </QueryClientProvider>
    );
    // find price button
  const priceBtn = await screen.findByText(/100\.00/);
    fireEvent.click(priceBtn);
    const input = await screen.findByRole('spinbutton');
    fireEvent.change(input, { target: { value: '80' } });
    const save = await screen.findByRole('button', { name: /Save|حفظ/i });
    // The inline save uses commitEdit button text 'Save' perhaps; otherwise fallback
    fireEvent.click(save);
    await waitFor(() => expect(productsApi.updateProduct).toHaveBeenCalled());
  });

  test('apply batch discount to selected products', async () => {
    window.prompt = vi.fn(() => '20');
    const { container } = render(
      <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminProducts />
      </MemoryRouter>
      </QueryClientProvider>
    );
    const select = await screen.findByLabelText(/select-p1/);
    fireEvent.click(select);
  const applyBtn = await screen.findByRole('button', { name: /Apply discount/i });
    fireEvent.click(applyBtn);
    await waitFor(() => expect(productsApi.batchDiscount).toHaveBeenCalledWith({ productIds: ['p1'], percent: 20 }));
  });

  test('uploads multiple images for a product', async () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminProducts />
      </MemoryRouter>
      </QueryClientProvider>
    );
    // Open drawer: find and click Edit button
  const editBtn = await screen.findByRole('button', { name: /Edit Test/i });
  fireEvent.click(editBtn);
  // wait for the drawer content to appear by finding the uploader control 'Choose files'
  await screen.findByRole('button', { name: /Choose files/i });
  // find the file input inside ImageUploader and trigger change (drawer may render via portal)
  const chooseBtn = await screen.findByRole('button', { name: /Choose files/i });
  const fileInput = chooseBtn.closest('.border')?.querySelector('input[type=file]') || document.querySelector('input[type=file]');
  await waitFor(() => expect(fileInput).toBeTruthy());
    const fileA = new File(['a'], 'a.png', { type: 'image/png' });
    const fileB = new File(['b'], 'b.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [fileA, fileB] } });
  await waitFor(() => expect(productsApi.addProductImages).toHaveBeenCalled());
  expect(productsApi.addProductImages).toHaveBeenCalledTimes(1);
  });

  test('set primary and delete image for product', async () => {
    // override product details to include images
    vi.spyOn(productsApi, 'useProduct').mockReturnValue({ data: { id: 'p1', images: [ { id: 'i1', variants: { original: 'https://example.com/i1.png' }, alt: { en: 'i1' } }, { id: 'i2', variants: { original: 'https://example.com/i2.png' }, alt: { en: 'i2' } } ] }, isLoading: false, refetch: vi.fn() });
    vi.spyOn(productsApi, 'updateProductImage').mockResolvedValue({ ok: true });
    vi.spyOn(productsApi, 'deleteProductImage').mockResolvedValue({ ok: true });

    const { container } = render(
      <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminProducts />
      </MemoryRouter>
      </QueryClientProvider>
    );
  const editBtn = await screen.findByRole('button', { name: /Edit Test/i });
    fireEvent.click(editBtn);
    // Wait for gallery to render: images should be present
    await waitFor(() => expect(document.querySelectorAll('.mt-3.grid img').length).toBeGreaterThanOrEqual(2));

    // Click set primary for first image
    const setPrimaryBtns = await screen.findAllByRole('button', { name: /Set primary/i });
    expect(setPrimaryBtns.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(setPrimaryBtns[0]);
    await waitFor(() => expect(productsApi.updateProductImage).toHaveBeenCalledWith('i1', { sort: 0 }));

  // Click delete for second image - stub confirm true
  vi.stubGlobal('confirm', () => true);
  const wrappers = Array.from(document.querySelectorAll('.mt-3.grid .relative'));
  expect(wrappers.length).toBeGreaterThanOrEqual(2);
  const deleteBtn = wrappers[1].querySelector('button.btn-danger') || wrappers[1].querySelector('button');
  expect(deleteBtn).toBeTruthy();
  fireEvent.click(deleteBtn);
    await waitFor(() => expect(productsApi.deleteProductImage).toHaveBeenCalledWith('i2'));
  });

  test('upload images via Action button', async () => {
    // ensure addProductImages mock
    const mockAddImages = vi.spyOn(productsApi, 'addProductImages').mockResolvedValue([{ ok: true }, { ok: true }]);
    const { container } = render(
      <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminProducts />
      </MemoryRouter>
      </QueryClientProvider>
    );
    // Find the per-row Upload images button
    const uploadBtn = await screen.findByRole('button', { name: /Upload images/i });
    fireEvent.click(uploadBtn);
    // The hidden input is attached to document via ref; find it
    const fileInput = document.querySelector('input[type=file]');
    expect(fileInput).toBeTruthy();
    const fileA = new File(['a'], 'a.png', { type: 'image/png' });
    const fileB = new File(['b'], 'b.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [fileA, fileB] } });
    await waitFor(() => expect(mockAddImages).toHaveBeenCalled());
    expect(mockAddImages).toHaveBeenCalledWith('p1', [fileA, fileB]);
  });

  test('New product button navigates to admin dashboard products view', async () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdminProducts />
        </MemoryRouter>
      </QueryClientProvider>
    );
    const newBtn = await screen.findByRole('button', { name: /New product/i });
    fireEvent.click(newBtn);
  expect(navigateMock).toHaveBeenCalledWith('/admin?view=products&create=1');
  });
  });
