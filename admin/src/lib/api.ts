import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("admin_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("admin_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AdminUser;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface Movie {
  id: string;
  title: string;
  slug: string;
  description: string;
  poster: string;
  backdrop?: string;
  trailer?: string;
  year: number;
  duration: number;
  rating: number;
  imdbRating?: number;
  type: "movie" | "series";
  status: "published" | "draft" | "archived";
  genres: Genre[];
  countries: Country[];
  languages: Language[];
  seasons?: Season[];
  createdAt: string;
  updatedAt: string;
  views?: number;
}

export interface Season {
  id: string;
  number: number;
  title: string;
  episodes: Episode[];
}

export interface Episode {
  id: string;
  number: number;
  title: string;
  duration: number;
  description?: string;
}

export interface Series {
  id: string;
  title: string;
  slug: string;
  description: string;
  poster: string;
  backdrop?: string;
  trailer?: string;
  year: number;
  status: "ongoing" | "completed" | "upcoming";
  rating: number;
  imdbRating?: number;
  genres: Genre[];
  countries: Country[];
  languages: Language[];
  seasons: Season[];
  createdAt: string;
  updatedAt: string;
  views?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  status: "active" | "banned" | "muted";
  createdAt: string;
  lastLogin?: string;
  watchHistory?: number;
  watchlist?: number;
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
}

export interface Country {
  id: string;
  name: string;
  code: string;
}

export interface Language {
  id: string;
  name: string;
  code: string;
}

export interface Broadcast {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "urgent";
  status: "sent" | "scheduled" | "draft";
  targetAudience: string;
  sentAt?: string;
  scheduledAt?: string;
  createdAt: string;
  sentCount?: number;
}

export interface DashboardStats {
  totalMovies: number;
  totalSeries: number;
  totalUsers: number;
  activeToday: number;
  totalViews: number;
  newUsersToday: number;
  topMovies: Movie[];
  recentActivity: Activity[];
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  user?: string;
  createdAt: string;
}

export interface Analytics {
  daily: { date: string; views: number; users: number }[];
  monthly: { month: string; views: number; users: number }[];
  topContent: { title: string; views: number; type: string }[];
  userGrowth: { date: string; count: number }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Report {
  id: string;
  type: string;
  content: string;
  reason: string;
  status: "pending" | "reviewed" | "resolved";
  reportedBy: string;
  contentId: string;
  contentType: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
}

export interface AdminAction {
  id: string;
  action: string;
  details: string;
  adminId: string;
  adminName: string;
  targetId?: string;
  targetType?: string;
  createdAt: string;
}

export interface HealthStatus {
  status: string;
  uptime: number;
  memory: { used: number; total: number };
  database: string;
  api: string;
  version: string;
}

export const auth = {
  login: (credentials: LoginCredentials) =>
    api.post<LoginResponse>("/auth/login", credentials),
  getProfile: () => api.get<AdminUser>("/auth/profile"),
};

export const movies = {
  getMovies: (params?: { page?: number; limit?: number; search?: string; genre?: string; year?: number; status?: string }) =>
    api.get<PaginatedResponse<Movie>>("/movies", { params }),
  getMovie: (id: string) => api.get<Movie>(`/movies/${id}`),
  createMovie: (data: Partial<Movie>) => api.post<Movie>("/movies", data),
  updateMovie: (id: string, data: Partial<Movie>) => api.put<Movie>(`/movies/${id}`, data),
  deleteMovie: (id: string) => api.delete(`/movies/${id}`),
  bulkExport: (ids: string[]) => api.post("/movies/export", { ids }, { responseType: "blob" }),
};

export const series = {
  getSeries: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    api.get<PaginatedResponse<Series>>("/series", { params }),
  getSeriesItem: (id: string) => api.get<Series>(`/series/${id}`),
  createSeries: (data: Partial<Series>) => api.post<Series>("/series", data),
  updateSeries: (id: string, data: Partial<Series>) => api.put<Series>(`/series/${id}`, data),
  deleteSeries: (id: string) => api.delete(`/series/${id}`),
};

export const users = {
  getUsers: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    api.get<PaginatedResponse<User>>("/users", { params }),
  getUser: (id: string) => api.get<User>(`/users/${id}`),
  banUser: (id: string) => api.put(`/users/${id}/ban`),
  unmuteUser: (id: string) => api.put(`/users/${id}/unmute`),
};

export const stats = {
  getDashboardStats: () => api.get<DashboardStats>("/stats/dashboard"),
  getAnalytics: (params?: { period?: string }) =>
    api.get<Analytics>("/stats/analytics", { params }),
};

export const admin = {
  getDashboard: () => api.get<DashboardStats>("/admin/dashboard"),
  broadcast: (data: Partial<Broadcast>) => api.post<Broadcast>("/admin/broadcast", data),
  getBroadcasts: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Broadcast>>("/admin/broadcasts", { params }),
  getAdminActions: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<AdminAction>>("/admin/actions", { params }),
};

export const genres = {
  getGenres: () => api.get<Genre[]>("/genres"),
  createGenre: (data: Partial<Genre>) => api.post<Genre>("/genres", data),
  updateGenre: (id: string, data: Partial<Genre>) => api.put<Genre>(`/genres/${id}`, data),
  deleteGenre: (id: string) => api.delete(`/genres/${id}`),
};

export const countries = {
  getCountries: () => api.get<Country[]>("/countries"),
  createCountry: (data: Partial<Country>) => api.post<Country>("/countries", data),
  updateCountry: (id: string, data: Partial<Country>) => api.put<Country>(`/countries/${id}`, data),
  deleteCountry: (id: string) => api.delete(`/countries/${id}`),
};

export const languages = {
  getLanguages: () => api.get<Language[]>("/languages"),
  createLanguage: (data: Partial<Language>) => api.post<Language>("/languages", data),
  updateLanguage: (id: string, data: Partial<Language>) => api.put<Language>(`/languages/${id}`, data),
  deleteLanguage: (id: string) => api.delete(`/languages/${id}`),
};

export const search = {
  global: (query: string) => api.get("/search", { params: { q: query } }),
};

export const notifications = {
  getNotifications: (params?: { page?: number; unread?: boolean }) =>
    api.get<PaginatedResponse<Notification>>("/notifications", { params }),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put("/notifications/read-all"),
};

export const reports = {
  getReports: (params?: { page?: number; status?: string }) =>
    api.get<PaginatedResponse<Report>>("/reports", { params }),
  updateReportStatus: (id: string, status: string) =>
    api.put(`/reports/${id}`, { status }),
};

export const health = {
  getHealth: () => api.get<HealthStatus>("/health"),
};

export default api;
