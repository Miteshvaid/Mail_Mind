import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  // Ensure headers exist
  config.headers = config.headers || {};

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Debug
  console.log("=== FRONTEND REQUEST ===");
  console.log("URL:", config.url);
  console.log("Method:", config.method);
  console.log("Data:", config.data);
  console.log("Headers:", config.headers);
  console.log("=======================");

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("=== API ERROR ===");
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    console.error("===============");

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
