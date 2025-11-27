import { useState, useEffect } from 'react';
import api from '../../../services/api/client';

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.listCategories();
      const next = Array.isArray(list?.categories)
        ? list.categories
        : Array.isArray(list)
          ? list
          : Array.isArray(list?.data)
            ? list.data
            : [];
      setCategories(next);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (categoryData) => {
    setLoading(true);
    setError(null);
    try {
      const created = await api.createCategory(categoryData);
      const payload = created?.category || created?.data || null;
      if (payload) {
        setCategories(prev => [payload, ...prev]);
      }
      return payload || created;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (categoryId, categoryData) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await api.updateCategory(categoryId, categoryData);
      const payload = updated?.category || updated?.data || null;
      if (payload) {
        setCategories(prev => prev.map(c => (c.id === payload.id ? payload : c)));
      }
      return payload || updated;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (categoryId) => {
    setLoading(true);
    setError(null);
    try {
      await api.deleteCategory(categoryId);
      setCategories(prev => prev.filter(c => c.id !== categoryId && c.slug !== categoryId));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refresh: loadCategories
  };
};
