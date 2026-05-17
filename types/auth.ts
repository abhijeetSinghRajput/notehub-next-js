export interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  otp: string;
}

export interface LoginFormData {
  identifier: string; // email or username
  password: string;
}

export interface ResetPasswordFormData {
  identifier: string; // email or username
  newPassword: string;
  otp: string;
}

export interface UpdateUserProfileData {
  fullName?: string;
  userName?: string;
  avatar?: string;
  cover?: string;
  bio?: string;
  socials?: { url: string }[];
  skills?: string[];
}
