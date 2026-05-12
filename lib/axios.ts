import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: () => void; reject: (reason?: unknown) => void }> = [];

// Issue 1C fixed: resolve with no value (void) instead of null token
const processQueue = (error: Error | null) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve()));
  failedQueue = [];
};

const REFRESH_TIMEOUT_MS = 10_000;

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Issue 1B fixed: all early-exit conditions checked BEFORE setting _retry,
    // so _retry is set exactly once on the first retry attempt.
    if (
      status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest._skipRefresh // Issue 1E: skip refresh for checkAuth
    ) {
      return Promise.reject(error);
    }

    // Issue 1B fixed: set _retry BEFORE the isRefreshing branch so queued
    // retries that re-enter the interceptor are also flagged.
    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => axiosInstance(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;

    // Issue 1D fixed: safety timeout so isRefreshing never hangs permanently
    const timeoutId = setTimeout(() => {
      isRefreshing = false;
      processQueue(new Error("Token refresh timed out"));
    }, REFRESH_TIMEOUT_MS);

    try {
      await axiosInstance.post("/auth/refresh");
      clearTimeout(timeoutId);
      processQueue(null);
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      clearTimeout(timeoutId);
      processQueue(refreshError as Error);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
