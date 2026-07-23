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
  accessToken: string;
  refreshToken: string;
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
  telegramId?: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: { id: string; name: string } | string;
  isActive?: boolean;
  isBanned?: boolean;
  isMuted?: boolean;
  isPremium?: boolean;
  xp?: number;
  level?: number;
  coins?: number;
  createdAt: string;
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

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const auth = {
  login: (credentials: LoginCredentials) =>
    api.post<LoginResponse>("/auth/admin-login", credentials),
  getProfile: () => api.get<AdminUser>("/auth/profile"),
};

export const movies = {
  getMovies: (params?: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: string; genre?: string; year?: number; country?: string; language?: string; quality?: string; ageRating?: string; isFeatured?: boolean }) =>
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
  getUsers: (params?: { page?: number; limit?: number; query?: string; status?: string }) =>
    api.get<PaginatedResponse<User>>("/users", { params }),
  getUser: (id: string) => api.get<User>(`/users/${id}`),
  banUser: (id: string) => api.put(`/users/${id}/ban`),
  unmuteUser: (id: string) => api.put(`/users/${id}/unmute`),
};

export const stats = {
  getDashboardStats: () => api.get<DashboardStats>("/admin/dashboard"),
};

export const admin = {
  broadcast: (data: Partial<Broadcast>) => api.post<Broadcast>("/admin/broadcast", data),
  getBroadcasts: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Broadcast>>("/admin/broadcasts", { params }),
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

export const health = {
  getHealth: () => api.get("/health"),
};

export default api;
