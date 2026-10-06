import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: any | null;
}

interface AuthContextType extends AuthState {
  login: (token: string, user: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const token = localStorage.getItem('holoka_token');
    const userJson = localStorage.getItem('holoka_user');
    return {
      isAuthenticated: !!token,
      token,
      user: userJson ? JSON.parse(userJson) : null,
    };
  });

  const login = (token: string, user: any) => {
    localStorage.setItem('holoka_token', token);
    localStorage.setItem('holoka_user', JSON.stringify(user));
    setAuthState({ isAuthenticated: true, token, user });
  };

  const logout = () => {
    localStorage.removeItem('holoka_token');
    localStorage.removeItem('holoka_user');
    setAuthState({ isAuthenticated: false, token: null, user: null });
  };

  useEffect(() => {
    const handleAuthChange = () => {
      const token = localStorage.getItem('holoka_token');
      if (!token) {
        logout();
      }
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
