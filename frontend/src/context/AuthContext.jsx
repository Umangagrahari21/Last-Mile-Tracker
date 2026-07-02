import React, { createContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, googleLogin as apiGoogleLogin } from '../api/auth.api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [role, setRole] = useState(localStorage.getItem('role') || null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Rehydrate state on mount
    const savedToken = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedRole && savedUser) {
      setToken(savedToken);
      setRole(savedRole);
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        // Clear corrupt state
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password, isAdmin = false) => {
    const data = await apiLogin(email, password, isAdmin);
    const { token: receivedToken, user: receivedUser } = data;
    
    setToken(receivedToken);
    setRole(receivedUser.role);
    setUser(receivedUser);

    localStorage.setItem('token', receivedToken);
    localStorage.setItem('role', receivedUser.role);
    localStorage.setItem('user', JSON.stringify(receivedUser));

    return receivedUser;
  };

  const loginWithGoogle = async (credential, roleInput, isAdmin = false) => {
    const data = await apiGoogleLogin(credential, roleInput, isAdmin);
    const { token: receivedToken, user: receivedUser } = data;

    setToken(receivedToken);
    setRole(receivedUser.role);
    setUser(receivedUser);

    localStorage.setItem('token', receivedToken);
    localStorage.setItem('role', receivedUser.role);
    localStorage.setItem('user', JSON.stringify(receivedUser));

    return receivedUser;
  };

  const register = async (name, email, password, roleInput) => {
    const data = await apiRegister(name, email, password, roleInput);

    const { token: receivedToken, user: receivedUser } = data;

    setToken(receivedToken);
    setRole(receivedUser.role);
    setUser(receivedUser);

    localStorage.setItem('token', receivedToken);
    localStorage.setItem('role', receivedUser.role);
    localStorage.setItem('user', JSON.stringify(receivedUser));

    return receivedUser;
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setUser(null);

    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ token, role, user, login, logout, register, loginWithGoogle, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
