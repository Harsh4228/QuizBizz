import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401 (token expired / invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      Cookies.remove("token");
      Cookies.remove("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/**
 * Returns a human-friendly error message.
 * Detects network/offline errors and surfaces them clearly.
 */
export function getErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const e = err as { response?: { data?: string | { message?: string } }; code?: string; message?: string };
  // Network error — server is down or unreachable
  if (!e.response && (e.code === "ERR_NETWORK" || e.code === "ECONNREFUSED" || e.message?.includes("Network Error"))) {
    return "Cannot connect to the server. Please make sure the backend is running.";
  }
  const data = e.response?.data;
  if (typeof data === "string" && data.trim()) return data.trim();
  if (typeof data === "object" && data?.message) return data.message;
  return fallback;
}

export default api;
