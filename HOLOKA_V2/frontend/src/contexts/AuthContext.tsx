import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { refreshSession, setAccessToken } from '../services/api';
import type { AuthResponse, UserView } from '../services/authService';

interface AuthState { isAuthenticated: boolean; isLoading: boolean; user: UserView | null }
interface AuthContextType extends AuthState {
  login: (token: string, user: UserView) => void;
  logout: () => void;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ isAuthenticated: false, isLoading: true, user: null });
  const login = useCallback((token: string, user: UserView) => {
    setAccessToken(token);
    setState({ isAuthenticated: true, isLoading: false, user });
  }, []);
  const logout = useCallback(() => {
    setAccessToken(null);
    setState({ isAuthenticated: false, isLoading: false, user: null });
  }, []);
  useEffect(() => {
    let active = true;
    // Remove tokens left by the previous client; authentication now uses the server session.
    localStorage.removeItem('holoka_token');
    localStorage.removeItem('holoka_user');
    const restored = (event: Event) => {
      const session = (event as CustomEvent<AuthResponse>).detail;
      if (active) login(session.accessToken, session.user);
    };
    window.addEventListener('session-restored', restored);
    window.addEventListener('auth-change', logout);
    refreshSession().catch(() => { if (active) logout(); });
    return () => {
      active = false;
      window.removeEventListener('session-restored', restored);
      window.removeEventListener('auth-change', logout);
    };
  }, [login, logout]);
  return <AuthContext.Provider value={{ ...state, login, logout }}>{children}</AuthContext.Provider>;
}
// Kept beside its context to preserve existing imports throughout the application.
// oxlint-disable-next-line react/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
