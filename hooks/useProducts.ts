import { useContext } from 'react';
import { ProductsContext, type ProductsContextType } from '@/providers/ProductsContext';

export function useProducts(): ProductsContextType {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
}
