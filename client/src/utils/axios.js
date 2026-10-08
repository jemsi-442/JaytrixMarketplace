import axios from "axios";

const PRODUCTION_API_URL = "https://perceptive-enthusiasm-production-9455.up.railway.app/api";
export const apiBaseUrl = import.meta.env.VITE_API_URL || PRODUCTION_API_URL;

const instance = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true, // optional if backend uses cookies
});

// Request interceptor: attach token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // JWT stored in localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = /\/auth\/login\/?(?:\?|$)/.test(error.config?.url || "");

    // Let the login form display rejected credentials without reloading the page.
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
