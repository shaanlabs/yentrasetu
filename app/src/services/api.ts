/**
 * API Service Layer
 * Centralized HTTP client for all backend API calls.
 * Base URL defaults to Vite proxy (/api) in dev, configurable via env.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

interface ApiError {
  message: string;
  errors?: string[];
  status: number;
}

// Get stored auth token
function getToken(): string | null {
  return localStorage.getItem('ys_token');
}

// Set stored auth token
export function setToken(token: string): void {
  localStorage.setItem('ys_token', token);
}

// Set stored refresh token
export function setRefreshToken(token: string): void {
  localStorage.setItem('ys_refresh_token', token);
}

// Get stored refresh token
export function getRefreshToken(): string | null {
  return localStorage.getItem('ys_refresh_token');
}

// Clear all auth tokens
export function clearTokens(): void {
  localStorage.removeItem('ys_token');
  localStorage.removeItem('ys_refresh_token');
}

// Try to refresh the access token using the refresh token
async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    setToken(data.token);
    setRefreshToken(data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

/**
 * Core fetch wrapper with auth headers, error handling, and token refresh.
 */
async function request<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { skipAuth = false, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((customHeaders as Record<string, string>) || {}),
  };

  // Attach Bearer token if available and not skipped
  if (!skipAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = `${API_BASE}${endpoint}`;
  let res = await fetch(url, { ...rest, headers });

  // If 401 and we have a refresh token, try refreshing
  if (res.status === 401 && !skipAuth) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const newToken = getToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
      }
      res = await fetch(url, { ...rest, headers });
    }
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: res.statusText }));
    const apiError: ApiError = {
      message: errorBody.message || 'Request failed',
      errors: errorBody.errors,
      status: res.status,
    };
    throw apiError;
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

/**
 * Exported convenience client for ad-hoc API calls (e.g. newsletter).
 */
export const apiClient = {
  get: <T = unknown>(endpoint: string) => request<T>(endpoint),
  post: <T = unknown>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  put: <T = unknown>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: data ? JSON.stringify(data) : undefined }),
  delete: <T = unknown>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};

// ─── Auth API ──────────────────────────────────────────

export interface RegisterPayload {
  phone: string;
  email?: string;
  password: string;
  firstName: string;
  lastName: string;
  userType?: string;
}

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: UserProfile;
  token: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  phone: string;
  email: string | null;
  firstName: string;
  lastName: string;
  userType: string;
  accountTier?: string;
  isVerified: boolean;
  companyName?: string;
  gstNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  profileImage?: string;
  rating?: number;
  reviewCount?: number;
  createdAt?: string;
}

export const authApi = {
  register: (data: RegisterPayload) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  login: (data: LoginPayload) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  sendOtp: (phone: string) =>
    request<{ message: string; otp?: string }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
      skipAuth: true,
    }),

  verifyOtp: (phone: string, otp: string) =>
    request<AuthResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
      skipAuth: true,
    }),

  getMe: () => request<{ user: UserProfile }>('/auth/me'),

  updateProfile: (data: Partial<UserProfile>) =>
    request<{ message: string; user: UserProfile }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// ─── Machinery API ─────────────────────────────────────

export interface MachineryListing {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  listingType: 'sale' | 'rent';
  category: string;
  subCategory?: string;
  condition?: string;
  hoursUsed?: number;
  description?: string;
  images?: string[];
  city?: string;
  state?: string;
  status: string;
  isVerified: boolean;
  isFeatured: boolean;
  viewCount: number;
  rentalRateDaily?: number;
  rentalRateWeekly?: number;
  rentalRateMonthly?: number;
  owner?: Partial<UserProfile>;
  createdAt: string;
}

export interface MachineryFilters {
  page?: number;
  limit?: number;
  category?: string;
  subCategory?: string;
  make?: string;
  model?: string;
  listingType?: 'sale' | 'rent';
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  city?: string;
  state?: string;
  isVerified?: boolean;
  isFeatured?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  lat?: number;
  lng?: number;
  radius?: number;
}

export interface PaginatedListings {
  listings: MachineryListing[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface CategoriesResponse {
  categories: Record<string, string[]>;
  makes: string[];
}

export const machineryApi = {
  getListings: (filters?: MachineryFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value));
        }
      });
    }
    const qs = params.toString();
    return request<PaginatedListings>(`/machinery${qs ? `?${qs}` : ''}`);
  },

  getListing: (id: string) =>
    request<{ listing: MachineryListing; otherListingsFromSeller: MachineryListing[] }>(
      `/machinery/${id}`
    ),

  createListing: (data: Partial<MachineryListing>) =>
    request<{ message: string; listing: MachineryListing }>('/machinery', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateListing: (id: string, data: Partial<MachineryListing>) =>
    request<{ message: string; listing: MachineryListing }>(`/machinery/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteListing: (id: string) =>
    request<{ message: string }>(`/machinery/${id}`, { method: 'DELETE' }),

  getMyListings: (page = 1, limit = 20, status?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set('status', status);
    return request<PaginatedListings>(`/machinery/my-listings?${params}`);
  },

  getCategories: () =>
    request<CategoriesResponse>('/machinery/categories', { skipAuth: true }),

  markAsSold: (id: string, status: 'sold' | 'rented') =>
    request<{ message: string; listing: MachineryListing }>(`/machinery/${id}/mark-sold`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  renewListing: (id: string) =>
    request<{ message: string; listing: MachineryListing }>(`/machinery/${id}/renew`, {
      method: 'PUT',
    }),
};

// ─── Parts API ─────────────────────────────────────────
export const partsApi = {
  getParts: (filters?: Record<string, any>) => {
    const p = new URLSearchParams();
    if (filters) Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') p.set(k, String(v)); });
    return request<{ parts: any[]; pagination: any }>(`/parts${p.toString() ? `?${p}` : ''}`);
  },
  getPart: (id: string) => request<{ part: any }>(`/parts/${id}`),
  createPart: (data: any) => request<{ message: string; part: any }>('/parts', { method: 'POST', body: JSON.stringify(data) }),
  deletePart: (id: string) => request<{ message: string }>(`/parts/${id}`, { method: 'DELETE' }),
  getMyParts: () => request<{ parts: any[] }>('/parts/my-parts'),
};

// ─── Operators API ─────────────────────────────────────
export const operatorsApi = {
  getOperators: (filters?: Record<string, any>) => {
    const p = new URLSearchParams();
    if (filters) Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') p.set(k, String(v)); });
    return request<{ operators: any[]; pagination: any }>(`/operators${p.toString() ? `?${p}` : ''}`);
  },
  getOperator: (id: string) => request<{ operator: any }>(`/operators/${id}`),
  createOrUpdate: (data: any) => request<{ message: string; profile: any }>('/operators/profile', { method: 'POST', body: JSON.stringify(data) }),
  getMyProfile: () => request<{ profile: any }>('/operators/my-profile'),
};

// ─── Mechanics API ─────────────────────────────────────
export const mechanicsApi = {
  getMechanics: (filters?: Record<string, any>) => {
    const p = new URLSearchParams();
    if (filters) Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') p.set(k, String(v)); });
    return request<{ mechanics: any[]; pagination: any }>(`/mechanics${p.toString() ? `?${p}` : ''}`);
  },
  getMechanic: (id: string) => request<{ mechanic: any }>(`/mechanics/${id}`),
  createOrUpdate: (data: any) => request<{ message: string; profile: any }>('/mechanics/profile', { method: 'POST', body: JSON.stringify(data) }),
  getMyProfile: () => request<{ profile: any }>('/mechanics/my-profile'),
};

// ─── Reviews API ───────────────────────────────────────
export const reviewsApi = {
  getReviews: (filters?: Record<string, any>) => {
    const p = new URLSearchParams();
    if (filters) Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') p.set(k, String(v)); });
    return request<{ reviews: any[]; pagination: any }>(`/reviews${p.toString() ? `?${p}` : ''}`);
  },
  createReview: (data: any) => request<{ message: string; review: any }>('/reviews', { method: 'POST', body: JSON.stringify(data) }),
  respond: (id: string, response: string) => request<{ message: string }>(`/reviews/${id}/respond`, { method: 'PUT', body: JSON.stringify({ response }) }),
};

// ─── Bookings API ──────────────────────────────────────
export const bookingsApi = {
  create: (data: any) => request<{ message: string; booking: any }>('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  getMyBookings: (role?: string) => request<{ bookings: any[] }>(`/bookings${role ? `?role=${role}` : ''}`),
  updateStatus: (id: string, status: string, reason?: string) =>
    request<{ message: string; booking: any }>(`/bookings/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, reason }) }),
};

// ─── Chats API ─────────────────────────────────────────
export const chatsApi = {
  startOrGet: (sellerId: string, listingType?: string, listingId?: string) =>
    request<{ chat: any }>('/chats', { method: 'POST', body: JSON.stringify({ sellerId, listingType, listingId }) }),
  getMyChats: () => request<{ chats: any[] }>('/chats'),
  getMessages: (chatId: string) => request<{ messages: any[]; chat: any }>(`/chats/${chatId}/messages`),
  sendMessage: (chatId: string, content: string) =>
    request<{ message: any }>(`/chats/${chatId}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),
};

// ─── Admin API ─────────────────────────────────────────
export const adminApi = {
  getDashboard: () => request<{ stats: any }>('/admin/dashboard'),
  getPendingListings: () => request<{ listings: any[] }>('/admin/pending-listings'),
  approveListing: (id: string) => request<{ message: string }>(`/admin/listings/${id}/approve`, { method: 'PUT' }),
  rejectListing: (id: string) => request<{ message: string }>(`/admin/listings/${id}/reject`, { method: 'PUT' }),
  getUsers: () => request<{ users: any[] }>('/admin/users'),
};
