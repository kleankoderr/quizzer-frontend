import axios from "axios";
import { API_BASE_URL } from "../config/api";

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// let csrfToken: string | null = null;

// export const setCsrfToken = (token: string) => {
//   csrfToken = token;
// };

// Request interceptor to add CSRF token
// apiClient.interceptors.request.use(
//   (config) => {
//     if (
//       csrfToken &&
//       ["post", "put", "delete", "patch"].includes(
//         config.method?.toLowerCase() || ""
//       )
//     ) {
//       config.headers["x-csrf-token"] = csrfToken;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if we are already on the login or signup page
      if (
        window.location.pathname === "/login" ||
        window.location.pathname === "/signup"
      ) {
        return Promise.reject(error);
      }
      // Clear token and redirect to login
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
