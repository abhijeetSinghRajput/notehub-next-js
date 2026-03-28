"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { LabeledInput } from "@/components//labeled-input";
import BadgeIcon from "@/components/icons/BadgeIcon";
import { useRouter } from "next/navigation";
import CloudinaryImage from "@/components/ui/cloudinary-image";

type UserPreview = {
  fullName: string;
  email: string;
  avatar: string;
  role: "user" | "admin";
};

const ForgotPasswordPage = () => {
  const {
    requestResetPasswordOtp,
    resetPassword,
    isSendingOtp,
    isResettingPassword,
    getUser,
  } = useAuthStore();
  const router = useRouter();

  const [identifier, setIdentifier] = useState(""); // Changed from email to identifier
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [identifierError, setIdentifierError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [user, setUser] = useState<UserPreview | null>(null);
  const [isValidIdentifier, setIsValidIdentifier] = useState(false);
  const [isCheckingIdentifier, setIsCheckingIdentifier] = useState(false);

  // Identifier validation (both username and email)
  const validateIdentifierFormat = (identifier: string): boolean => {
    // Username pattern (alphanumeric with possible underscores/dots, 3-20 chars)
    const usernamePattern = /^[a-zA-Z0-9_.]{3,20}$/;
    // Email pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return usernamePattern.test(identifier) || emailPattern.test(identifier);
  };

  // Password validation
  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  // Confirm password validation
  const validateConfirmPassword = (
    password: string,
    confirmPassword: string,
  ): boolean => {
    return password === confirmPassword;
  };

  // Debounced identifier lookup
  useEffect(() => {
    if (!identifier) {
      setIdentifierError("");
      setIsValidIdentifier(false);
      setUser(null);
      setIsCheckingIdentifier(false);
      return;
    }

    if (!validateIdentifierFormat(identifier)) {
      setIdentifierError("Please enter a valid username or email address");
      setIsValidIdentifier(false);
      setUser(null);
      setIsCheckingIdentifier(false);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setIsCheckingIdentifier(true);

      try {
        const userData = await getUser(identifier, controller.signal);

        if (!controller.signal.aborted) {
          setUser(userData);
          setIdentifierError("");
          setIsValidIdentifier(true);
        }
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          (error as any).code === "ERR_CANCELED"
        )
          return;

        if (!controller.signal.aborted) {
          setUser(null);
          setIdentifierError("No account found with this username/email");
          setIsValidIdentifier(false);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsCheckingIdentifier(false);
        }
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [identifier, getUser]);

  // Cooldown timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleSendOtp = async () => {
    if (!isValidIdentifier) {
      setIdentifierError("Please enter a valid registered username or email");
      return;
    }
    const res = await requestResetPasswordOtp(identifier);
    if (res) {
      setCooldown(60);
    }
  };

  const handleResetPassword = async () => {
    if (!validatePassword(password)) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (!validateConfirmPassword(password, confirmPassword)) {
      setConfirmPasswordError("Passwords do not match.");
      return;
    }
    if (otp.length !== 6) {
      return;
    }
    const res = await resetPassword({
      identifier, // Changed from email to identifier
      newPassword: password.trim(),
      otp,
    });

    if (res) {
      router.push("/login");
    }
  };

  return (
    <div className="flex p-4 pt-8 items-center justify-center min-h-[calc(100svh-64px)] bg-muted dark:bg-background">
      <h1 className="sr-only">Reset Your Password</h1>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>
            Enter your username or email to receive a password reset OTP
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {/* User preview when identifier is valid */}
            {user && (
              <div className="flex gap-2 bg-accent/50 p-2 rounded-xl items-center">
                <div className="relative size-10 shrink-0 rounded-full overflow-hidden">
                  <CloudinaryImage
                    src={user.avatar || "/avatar.svg"}
                    alt={user?.fullName || "User"}
                    fill
                    sizes="40px"
                    className="object-cover"
                    preload
                    fetchPriority="high"
                  />
                </div>

                <div className="text-sm">
                  <div className="flex gap-1.5 items-center">
                    <strong className="font-semibold">{user.fullName}</strong>
                    {user.role === "admin" && (
                      <BadgeIcon className="size-3.5 text-blue-500" />
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">{user.email}</p>
                </div>
              </div>
            )}

            {/* Identifier Field */}
            <LabeledInput
              id="identifier"
              label="Username or Email"
              type="text"
              placeholder="Enter username or email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={isSendingOtp || isResettingPassword}
              loading={isCheckingIdentifier}
              error={identifierError}
            />

            {/* Password Field */}
            <LabeledInput
              id="password"
              label="New Password"
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(
                  validatePassword(e.target.value)
                    ? ""
                    : "Password must be at least 6 characters.",
                );
              }}
              disabled={isResettingPassword}
              error={passwordError}
              showPasswordToggle
            />

            {/* Confirm Password Field */}
            <LabeledInput
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setConfirmPasswordError(
                  validateConfirmPassword(password, e.target.value)
                    ? ""
                    : "Passwords do not match.",
                );
              }}
              disabled={isResettingPassword}
              error={confirmPasswordError}
              showPasswordToggle
            />

            {/* OTP Field */}
            <div className="space-y-2">
              <div className="relative flex flex-col sm:flex-row items-center gap-4">
                <div className="space-y-1">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    pattern={REGEXP_ONLY_DIGITS}
                    disabled={isResettingPassword}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  <p className="text-xs text-muted-foreground">
                    Enter the 6-digit OTP sent to your email
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleSendOtp}
                  disabled={
                    !user || cooldown > 0 || isSendingOtp || !isValidIdentifier
                  }
                >
                  {isSendingOtp ? (
                    <Loader2 className="animate-spin mr-2 size-4" />
                  ) : cooldown > 0 ? (
                    cooldown
                  ) : (
                    "Get OTP"
                  )}
                </Button>
              </div>
            </div>

            {/* Reset Password Button */}
            <Button
              onClick={handleResetPassword}
              className="h-12 font-semibold rounded-xl"
              disabled={
                isResettingPassword ||
                Boolean(passwordError) ||
                Boolean(confirmPasswordError) ||
                otp.length !== 6
              }
            >
              {isResettingPassword ? (
                <>
                  <Loader2 className="animate-spin mr-2 size-4" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
