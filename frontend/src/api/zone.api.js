import api from './axios';

export const getZones = async () => {
  const res = await api.get('/api/zones');
  return res.data;
};

export const createZone = async (name) => {
  const res = await api.post('/api/zones', { name });
  return res.data;
};

export const deleteZone = async (zoneId) => {
  const res = await api.delete(`/api/zones/${zoneId}`);
  return res.data;
};

export const addArea = async (zoneId, { pincode, name }) => {
  const res = await api.post(`/api/zones/${zoneId}/areas`, { pincode, name });
  return res.data;
};

export const deleteArea = async (areaId) => {
  const res = await api.delete(`/api/zones/areas/${areaId}`);
  return res.data;
};
