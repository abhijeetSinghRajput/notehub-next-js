import { create } from "zustand";
import { toast } from "sonner";
import { axiosInstance } from "@/lib/axios";
import { AxiosError } from "axios";

import type { IUser, INote, IGetAllUsersResponse } from "@/types/model";
import {
  LoginFormData,
  ResetPasswordFormData,
  SignupFormData,
  UpdateUserProfileData,
} from "@/types/auth";

type ApiMessageResponse = {
  message?: string;
  [key: string]: unknown;
};

type ApiErrorResponse = { message?: string };

function getApiErrorMessage(error: unknown, fallback: string) {
  const err = error as AxiosError<ApiErrorResponse>;
  return err?.response?.data?.message || err?.message || fallback;
}

export interface AuthStore {
  authUser: IUser | null;
  isCheckingAuth: boolean;
  isSigningUp: boolean;
  isLoggingIn: boolean;
  isLoggingOut: boolean;
  isVerifyingEmail: boolean;
  emailStatus: string;
  isUploadingAvatar: boolean;
  isUploadingCover: boolean;
  isRemovingAvatar: boolean;
  isRemovingCover: boolean;
  isSendingOtp: boolean;
  isResettingPassword: boolean;
  isUpdatingEmail: boolean;
  onlineUsers: IUser[];

  requestEmailUpdateOtp: (email: string) => Promise<ApiMessageResponse | null>;
  confirmEmailUpdate: (data: {
    email: string;
    otp: string;
  }) => Promise<ApiMessageResponse | null>;
  requestResetPasswordOtp: (
    identifier: string,
  ) => Promise<ApiMessageResponse | null>;
  isEmailAvailable: (email: string, signal?: AbortSignal) => Promise<boolean | null>;
  resetPassword: (
    data: ResetPasswordFormData,
  ) => Promise<ApiMessageResponse | null>;
  updatePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<ApiMessageResponse | null>;
  getUser: (identifier: string, signal?: AbortSignal) => Promise<IUser | null>;
  getAllUsers: (options?: {
    page?: number;
    limit?: number;
    search?: string;
    filter?: string;
  }) => Promise<IGetAllUsersResponse>;
  searchUsers: (query: string) => Promise<IUser[]>;
  searchNotes: (query: string) => Promise<INote[]>;
  checkAuth: () => Promise<void>;
  signup: (data: SignupFormData) => Promise<{ success: boolean }>;
  sendSignupOtp: (email: string) => Promise<ApiMessageResponse | null>;
  login: (data: LoginFormData) => Promise<boolean>;
  googleLogin: (data: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
  }) => Promise<boolean | null>;
  logout: () => Promise<void>;
  resendEmailOTP: () => Promise<{ success: boolean }>;
  updateUserField: (
    apiEndPoint: string,
    data: UpdateUserProfileData,
  ) => Promise<boolean>;
  uploadUserAvatar: (file: File) => Promise<IUser | null>;
  removeUserAvatar: () => Promise<IUser | null>;
  uploadUserCover: (file: File) => Promise<IUser | null>;
  removeUserCover: () => Promise<IUser | null>;
  checkEmailStatus: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  isLoggingOut: false,
  isVerifyingEmail: false,
  emailStatus: "",
  isUploadingAvatar: false,
  isUploadingCover: false,
  isRemovingAvatar: false,
  isRemovingCover: false,
  isSendingOtp: false,
  isResettingPassword: false,
  isUpdatingEmail: false,
  onlineUsers: [],

  requestEmailUpdateOtp: async (email) => {
    set({ isSendingOtp: true });
    try {
      const response = await axiosInstance.post(
        "/user/request-update-email-otp",
        {
          email,
        },
      );
      toast.success(response.data.message || "OTP sent successfully!");
      return response.data;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to send OTP"));
      console.error("Request update email OTP error:", error);
      return null;
    } finally {
      set({ isSendingOtp: false });
    }
  },

  confirmEmailUpdate: async ({ email, otp }) => {
    set({ isUpdatingEmail: true });
    try {
      const response = await axiosInstance.post("/user/update-email", {
        email,
        otp,
      });
      toast.success(response.data.message || "email update successfully!");
      if (response.data.user) {
        set({ authUser: response.data.user });
      }

      return response.data;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update email"));
      console.error("Update email error:", error);
      return null;
    } finally {
      set({ isUpdatingEmail: false });
    }
  },

  requestResetPasswordOtp: async (identifier) => {
    set({ isSendingOtp: true });
    try {
      const response = await axiosInstance.post(
        "/password/request-reset-password-otp",
        {
          identifier,
        },
      );
      toast.success(response.data.message || "OTP sent successfully!");
      return response.data;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to send OTP"));
      console.error("Request reset password OTP error:", error);
      return null;
    } finally {
      set({ isSendingOtp: false });
    }
  },

  isEmailAvailable: async (email, signal?) => {
    try {
      const response = await axiosInstance.get(`/user/check-email/${email}`, {
        signal,
      });
      return response.data.available;
    } catch (error) {
      console.error("Email check failed:", error);
      return false;
    }
  },

  resetPassword: async ({ identifier, newPassword, otp }) => {
    set({ isResettingPassword: true });
    try {
      const response = await axiosInstance.post("/password/reset-password", {
        identifier,
        newPassword,
        otp,
      });
      toast.success(response.data.message || "Password reset successfully!");
      return response.data;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to reset password"));
      console.error("Reset password error:", error);
      return null;
    } finally {
      set({ isResettingPassword: false });
    }
  },

  updatePassword: async ({ currentPassword, newPassword }) => {
    try {
      set({ isResettingPassword: true });
      const response = await axiosInstance.put("/password/update", {
        currentPassword,
        newPassword,
      });
      toast.success(response.data.message || "Password updated successfully!");
      return response.data;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update password"));
      console.error("Update password error:", error);
      return null;
    } finally {
      set({ isResettingPassword: false });
    }
  },

  getUser: async (identifier, signal) => {
    try {
      const response = await axiosInstance.get(`/user/${identifier}`, {
        signal,
      });
      return response.data;
    } catch (_) {
      return null;
    }
  },
  getAllUsers: async ({
    page = 1,
    limit = 10,
    search = "",
    filter = "all",
  } = {}) => {
    try {
      const response = await axiosInstance.get("/user", {
        params: { page, limit, search, filter },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching users:", error);
      return {
        users: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalUsers: 0,
          usersPerPage: limit,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }
  },
  searchUsers: async (query) => {
    try {
      const response = await axiosInstance.get(`/search/users`, {
        params: { query },
      });
      return response.data;
    } catch (_) {
      return [];
    }
  },
  searchNotes: async (query) => {
    try {
      const response = await axiosInstance.get(`/search/notes`, {
        params: { query },
      });
      return response.data;
    } catch (_) {
      return [];
    }
  },

  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const res = await axiosInstance.get("/user/me");
      set({ authUser: res.data });
    } catch (error) {
      set({ authUser: null });
      console.error(error);
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      const { message, user } = res.data;
      set({ authUser: user });
      toast.success(message);
      return { success: true };
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Signup failed"));
      return { success: false };
    } finally {
      set({ isSigningUp: false });
    }
  },

  sendSignupOtp: async (email) => {
    set({ isSendingOtp: true });
    try {
      const response = await axiosInstance.post("/auth/send-signup-otp", {
        email,
      });
      toast.success(response.data.message || "OTP sent successfully!");
      return response.data;
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      if (err?.response?.status === 429) {
        toast.error("Too many requests. Please try again later.");
        return null;
      }
      toast.error(getApiErrorMessage(error, "Failed to send email"));
      console.error("Send OTP error:", error);
      return null;
    } finally {
      set({ isSendingOtp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      const { user } = res.data;
      set({ authUser: user });
      toast.success("Log in successful");
      return true;
    } catch (error) {
      set({ authUser: null });
      console.error(error);
      toast.error(getApiErrorMessage(error, "error while logging in"));
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  // 📂 client/src/stores/useAuthStore.js
  googleLogin: async ({ code, codeVerifier, redirectUri }) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("auth/google-login", {
        code,
        codeVerifier,
        redirectUri,
      });
      set({ authUser: res.data.user });
      toast.success("Log in successful");
      return true;
    } catch (error) {
      set({ authUser: null });
      toast.error(getApiErrorMessage(error, "OAuth Login Failed"));
      return null;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    set({ isLoggingOut: true });
    try {
      const res = await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success(res.data.message);
    } catch (error) {
      set({ authUser: null });
      toast.error(getApiErrorMessage(error, "Logout failed"));
    } finally {
      set({ isLoggingOut: false });
    }
  },

  resendEmailOTP: async () => {
    try {
      const res = await axiosInstance("/email/resend-otp");
      toast.success(res.data.message);
      return { success: true };
    } catch (error) {
      console.error(error);
      toast.error(getApiErrorMessage(error, "Failed to resend OTP"));
      return { success: false };
    }
  },

  updateUserField: async (apiEndPoint, data) => {
    try {
      const res = await axiosInstance.put(apiEndPoint, data);
      set({ authUser: res.data.user });
      toast.success(res.data.message);
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Update failed"));
      console.error(error);
      return false;
    }
  },

  uploadUserAvatar: async (file) => {
    set({ isUploadingAvatar: true });
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axiosInstance.post("/user/upload-avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      set({ authUser: res.data.user });
      toast.success(res.data.message);
      return res.data.user;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Avatar upload failed"));
      console.error(error);
      return null;
    } finally {
      set({ isUploadingAvatar: false });
    }
  },

  removeUserAvatar: async () => {
    set({ isRemovingAvatar: true });
    try {
      const res = await axiosInstance.delete("/user/remove-avatar");
      set({ authUser: res.data.user });
      toast.success(res.data.message);
      return res.data.user;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to remove avatar"));
      console.error(error);
      return null;
    } finally {
      set({ isRemovingAvatar: false });
    }
  },

  uploadUserCover: async (file) => {
    set({ isUploadingCover: true });
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axiosInstance.post("/user/upload-cover", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      set({ authUser: res.data.user });
      toast.success(res.data.message);
      return res.data.user;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Cover upload failed"));
      console.error(error);
      return null;
    } finally {
      set({ isUploadingCover: false });
    }
  },

  removeUserCover: async () => {
    set({ isRemovingCover: true });
    try {
      const res = await axiosInstance.delete("/user/remove-cover");
      set({ authUser: res.data.user });
      toast.success(res.data.message);
      return res.data.user;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to remove cover"));
      console.error(error);
      return null;
    } finally {
      set({ isRemovingCover: false });
    }
  },

  checkEmailStatus: async () => {
    try {
      const res = await axiosInstance.get("email/check-status");
      set({ emailStatus: res.data.status });
    } catch (error) {
      console.error(error);
      set({ emailStatus: "" });
    }
  },
}));
