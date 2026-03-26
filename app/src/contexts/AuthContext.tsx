import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {
  authApi,
  setToken,
  setRefreshToken,
  clearTokens,
  type UserProfile,
  type LoginPayload,
  type RegisterPayload,
  type AuthResponse,
} from '../services/api';

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (data: LoginPayload) => Promise<AuthResponse>;
  register: (data: RegisterPayload) => Promise<AuthResponse>;
  loginWithOtp: (phone: string, otp: string) => Promise<AuthResponse>;
  sendOtp: (phone: string) => Promise<{ message: string; otp?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // On mount, check if we have a valid token and load user
  useEffect(() => {
    const token = localStorage.getItem('ys_token');
    if (!token) {
      setState({ user: null, isLoading: false, isAuthenticated: false });
      return;
    }

    authApi
      .getMe()
      .then((data) => {
        setState({ user: data.user, isLoading: false, isAuthenticated: true });
      })
      .catch(() => {
        clearTokens();
        setState({ user: null, isLoading: false, isAuthenticated: false });
      });
  }, []);

  // Save tokens and set user after auth response
  const handleAuthSuccess = useCallback((response: AuthResponse) => {
    setToken(response.token);
    setRefreshToken(response.refreshToken);
    setState({
      user: response.user,
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  const login = useCallback(
    async (data: LoginPayload) => {
      const response = await authApi.login(data);
      handleAuthSuccess(response);
      return response;
    },
    [handleAuthSuccess]
  );

  const register = useCallback(
    async (data: RegisterPayload) => {
      const response = await authApi.register(data);
      handleAuthSuccess(response);
      return response;
    },
    [handleAuthSuccess]
  );

  const sendOtp = useCallback(async (phone: string) => {
    return authApi.sendOtp(phone);
  }, []);

  const loginWithOtp = useCallback(
    async (phone: string, otp: string) => {
      const response = await authApi.verifyOtp(phone, otp);
      handleAuthSuccess(response);
      return response;
    },
    [handleAuthSuccess]
  );

  const logout = useCallback(() => {
    clearTokens();
    setState({ user: null, isLoading: false, isAuthenticated: false });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.getMe();
      setState((prev) => ({ ...prev, user: data.user }));
    } catch {
      // silently fail — user can keep using cached data
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        loginWithOtp,
        sendOtp,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
