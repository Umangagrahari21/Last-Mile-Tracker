import { useState, useEffect, useCallback } from 'react';
import { getOrders } from '../api/order.api';

export const useOrders = (filters = {}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stringify filters to prevent infinite loops in useEffect
  const filterKey = JSON.stringify(filters);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrders(filters);
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [filterKey]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, refresh: fetchOrders };
};
