// Capa única de acceso al backend. Maneja el token JWT.
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Error' }));
    throw new Error(err.message || `Error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, body?: any) => request<T>(p, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T>(p: string, body?: any) => request<T>(p, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  del: <T>(p: string) => request<T>(p, { method: 'DELETE' }),
};

// --- Atajos por dominio ---
export const authApi = {
  login: (phone: string, password: string) => api.post<{ token: string; user: User }>('/auth/login', { phone, password }),
  register: (data: any) => api.post<{ token: string; user: User }>('/auth/register', data),
  me: () => api.get<User>('/auth/me'),
};

export const ordersApi = {
  list: () => api.get<Order[]>('/orders'),
  one: (id: string) => api.get<Order>(`/orders/${id}`),
  create: (data: any) => api.post<{ order: Order; breakdown: PriceBreakdown }>('/orders', data),
  estimate: (data: any) => api.post<{ distanceKm: number; breakdown: PriceBreakdown }>('/orders/estimate', data),
  setStatus: (id: string, status: string) => api.patch<Order>(`/orders/${id}/status`, { status }),
  assign: (id: string, driverId: string) => api.patch(`/orders/${id}/assign`, { driverId }),
  cancel: (id: string) => api.patch<Order>(`/orders/${id}/cancel`),
};

export const servicesApi = { list: () => api.get<Service[]>('/services') };
export const usersApi = { list: (role?: string) => api.get<User[]>(`/users${role ? `?role=${role}` : ''}`) };
export const deliveriesApi = {
  mine: () => api.get<any[]>('/deliveries/mine'),
  accept: (id: string) => api.patch(`/deliveries/${id}/accept`),
};
export const reportsApi = {
  revenue: () => api.get<{ totalOrders: number; totalRevenue: number }>('/reports/revenue'),
};

// --- Tipos ---
export type Role = 'CLIENT' | 'DRIVER' | 'ADMIN';
export interface User { id: string; name: string; phone: string; email?: string; role: Role; }
export interface Service { id: string; name: string; icon: string; formSchema: { fields: Field[] }; pricingType: string; }
export interface Field { key: string; label: string; type: string; required: boolean; }
export interface PriceBreakdown {
  base: number; distance: number; subtotal: number;
  nightSurcharge: number; urgencySurcharge: number; weightSurcharge: number; total: number;
}
export interface Order {
  id: string; status: string; isUrgent: boolean; distanceKm: number;
  estimatedPrice: number; finalPrice?: number; createdAt: string;
  service?: Service; client?: User; details?: any;
  dropoffAddress?: { text: string; lat: number; lng: number };
  delivery?: { id: string; driverId: string; status: string; driver?: User };
}
