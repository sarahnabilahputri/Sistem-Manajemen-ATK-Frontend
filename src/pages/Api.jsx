import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

axios.defaults.baseURL = API_BASE_URL;

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

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== "/checkout") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default axios;
