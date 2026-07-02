import api from './axios';

export const previewCharge = async (orderData) => {
  const res = await api.post('/api/orders/preview', orderData);
  return res.data;
};

export const createOrder = async (orderData) => {
  const res = await api.post('/api/orders', orderData);
  return res.data;
};

export const getOrders = async (filters = {}) => {
  const res = await api.get('/api/orders', { params: filters });
  return res.data;
};

export const getOrderById = async (orderId) => {
  const res = await api.get(`/api/orders/${orderId}`);
  return res.data;
};

export const getTracking = async (orderId) => {
  const res = await api.get(`/api/orders/${orderId}/tracking`);
  return res.data;
};

export const updateStatus = async (orderId, { status, note, rescheduleDate }) => {
  const res = await api.patch(`/api/orders/${orderId}/status`, { status, note, rescheduleDate });
  return res.data;
};

export const reschedule = async (orderId, { newDate, reason }) => {
  const res = await api.post(`/api/orders/${orderId}/reschedule`, { newDate, reason });
  return res.data;
};
