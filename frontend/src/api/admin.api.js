import api from './axios';
import { getOrders, updateStatus, createOrder } from './order.api';

export const getAllOrders = getOrders;
export const overrideStatus = updateStatus;
export const createOrderForCustomer = createOrder;

export const getDashboardMetrics = async () => {
  const res = await api.get('/api/admin/dashboard');
  return res.data;
};

export const getCustomers = async () => {
  const res = await api.get('/api/admin/customers');
  return res.data;
};
