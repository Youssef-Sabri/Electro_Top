import { useContext } from 'react';
import { OrdersContext, OrdersContextType } from '../context/OrdersContext';

export function useOrders(): OrdersContextType {
  const context = useContext(OrdersContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
}
