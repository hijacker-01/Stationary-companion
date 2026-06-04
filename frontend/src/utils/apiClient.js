import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const apiClient = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 15000,
  withCredentials: true
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Idempotency key for POST/PUT requests
  if (config.method === "post" || config.method === "put") {
    config.headers["X-Idempotency-Key"] = uuidv4();
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
