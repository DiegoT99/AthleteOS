import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

const CategoryContext = createContext(null);

export const CategoryProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    localStorage.getItem('athleteos_selected_category') || ''
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setCategories([]);
      setSelectedCategoryId('');
      return;
    }

    const loadCategories = async () => {
      const { data } = await api.get('/api/categories');
      setCategories(data);

      if (!selectedCategoryId && data[0]) {
        setSelectedCategoryId(data[0].id);
      }
    };

    loadCategories();
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedCategoryId) {
      localStorage.setItem('athleteos_selected_category', selectedCategoryId);
    }
  }, [selectedCategoryId]);

  const selectedCategory = categories.find((item) => item.id === selectedCategoryId) || null;

  const value = useMemo(
    () => ({
      categories,
      selectedCategory,
      selectedCategoryId,
      setSelectedCategoryId,
      setCategories,
    }),
    [categories, selectedCategory, selectedCategoryId]
  );

  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
};

export const useCategory = () => {
  const ctx = useContext(CategoryContext);
  if (!ctx) {
    throw new Error('useCategory must be used within CategoryProvider');
  }
  return ctx;
};
