import { useState, useEffect } from 'react';
import { useAdmin } from '../../../contexts/AdminContext';
import {
  listProducts,
  createProduct as apiCreateProduct,
  updateProduct as apiUpdateProduct,
  deleteProduct as apiDeleteProduct,
  importProductsFromExcel,
  exportProductsToExcel
} from '../../../services/api/products';

export const useAdminProducts = () => {
  const { products: contextProducts, addProduct, updateProduct, deleteProduct } = useAdmin();
  const [apiProducts, setApiProducts] = useState([]);
  const [apiBacked, setApiBacked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const products = apiBacked ? apiProducts : contextProducts;

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listProducts();
      if (Array.isArray(list)) {
        setApiProducts(list);
        setApiBacked(true);
      }
    } catch (err) {
      setError(err.message);
      setApiBacked(false);
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData) => {
    setLoading(true);
    setError(null);
    try {
      const created = await apiCreateProduct(productData);
      setApiProducts(prev => [created, ...prev]);
      return created;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (productId, productData) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await apiUpdateProduct(productId, productData);
      setApiProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    setLoading(true);
    setError(null);
    try {
      await apiDeleteProduct(productId);
      setApiProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const importFromExcel = async (file) => {
    setLoading(true);
    setError(null);
    try {
      const summary = await importProductsFromExcel(file);
      await loadProducts(); // Refresh the list
      return summary;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      return await exportProductsToExcel(filters);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct: handleUpdateProduct,
    deleteProduct: handleDeleteProduct,
    importFromExcel,
    exportToExcel,
    refresh: loadProducts
  };
};
