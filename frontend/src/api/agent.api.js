import api from './axios';

export const getAgents = async () => {
  const res = await api.get('/api/agents');
  return res.data;
};

export const assignAgent = async (orderId, agentId) => {
  const res = await api.post(`/api/orders/${orderId}/assign`, { agentId });
  return res.data;
};

export const autoAssign = async (orderId) => {
  const res = await api.post(`/api/orders/${orderId}/auto-assign`);
  return res.data;
};

export const updateLocation = async (currentZoneId) => {
  const res = await api.patch('/api/agents/location', { currentZoneId });
  return res.data;
};
