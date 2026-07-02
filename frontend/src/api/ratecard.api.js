import api from './axios';

export const getRateCards = async () => {
  const res = await api.get('/api/ratecards');
  return res.data;
};

export const createRateCard = async (data) => {
  const res = await api.post('/api/ratecards', data);
  return res.data;
};

export const updateRateCard = async (id, data) => {
  const res = await api.put(`/api/ratecards/${id}`, data);
  return res.data;
};

export const deleteRateCard = async (id) => {
  const res = await api.delete(`/api/ratecards/${id}`);
  return res.data;
};
