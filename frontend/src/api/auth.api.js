import api from './axios';

export const login = async (email, password) => {
  const res = await api.post('/api/auth/login', { email, password });
  return res.data;
};

export const register = async (name, email, password, role) => {
  const res = await api.post('/api/auth/register', { name, email, password, role });
  return res.data;
};

export const googleLogin = async (credential, role) => {
  const res = await api.post('/api/auth/google-login', { credential, role });
  return res.data;
};

