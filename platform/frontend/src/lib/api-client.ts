import axios from "axios";
import { useAuthStore } from "@/features/auth/auth-store";

export const apiClient = axios.create({
  baseURL: "/api/v1",
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
