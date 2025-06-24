// src/api/axiosConfig.js (atau nama file yang Anda gunakan)
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

axios.defaults.baseURL = API_BASE_URL;

// Request interceptor: sisipkan token kalau ada
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor: jika 401, cek path; 
// hanya redirect kalau bukan di /checkout
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      // Jika bukan di /checkout, redirect ke login
      if (currentPath !== "/checkout") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        // Ganti dengan path login Anda, misalnya "/login"
        window.location.href = "/";
      }
      // Jika sedang di /checkout, biarkan error diteruskan
    }
    return Promise.reject(error);
  }
);

export default axios;
