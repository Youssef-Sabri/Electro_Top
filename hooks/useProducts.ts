import { useContext } from 'react';
import { ProductsContext, ProductsContextType } from '@/context/ProductsContext';

export function useProducts(): ProductsContextType {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
}
