"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/app/stores/useAuthStore";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { LabeledInput } from "@/components/labeled-input";
import { isEmail, isEmpty, isLength, isNumeric } from "@/lib/validator";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ✅ Typed useDebounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ✅ Type definitions
type EmailStatus = "available" | "taken" | null;

interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  otp: string;
}

interface FormErrors {
  name: string;
  email: string;
  password: string;
  otp: string;
}

const SignupPage = () => {
  const { isSigningUp, signup, sendSignupOtp, isSendingOtp, isEmailAvailable } =
    useAuthStore();
  const [cooldown, setCooldown] = useState(0);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<EmailStatus>(null);
  const router = useRouter();

  const [formData, setFormData] = useState<SignupFormData>({
    fullName: "",
    email: "",
    password: "",
    otp: "",
  });

  const [errors, setErrors] = useState<FormErrors>({
    name: "",
    email: "",
    password: "",
    otp: "",
  });

  const debouncedEmail = useDebounce(formData.email, 500);

  // ✅ Typed interval
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cooldown]);

  useEffect(() => {
    const checkEmailAvailability = async () => {
      const trimmedEmail = formData.email.trim();
      if (!trimmedEmail || !isEmail(trimmedEmail)) {
        setEmailStatus(null);
        return;
      }

      setIsCheckingEmail(true);
      try {
        const isAvailable = await isEmailAvailable(trimmedEmail);
        setEmailStatus(isAvailable ? "available" : "taken");
        setErrors((prev) => ({
          ...prev,
          email: isAvailable ? "" : "Email is already registered",
        }));
      } catch (error) {
        console.error("Email check failed:", error);
        setEmailStatus(null);
      } finally {
        setIsCheckingEmail(false);
      }
    };

    checkEmailAvailability();
  }, [debouncedEmail, isEmailAvailable, formData.email]);

  // ✅ Typed event handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));

    if (id === "email") {
      setErrors((prev) => ({ ...prev, email: "" }));
      setEmailStatus(null);
    } else {
      setErrors((prev) => ({ ...prev, [id]: "" }));
    }
  };

  const handleSendotp = async () => {
    const trimmedEmail = formData.email.trim();

    if (!trimmedEmail) {
      setErrors((prev) => ({ ...prev, email: "Email is required" }));
      return;
    }

    if (!isEmail(trimmedEmail)) {
      setErrors((prev) => ({ ...prev, email: "Invalid email format" }));
      return;
    }

    if (emailStatus === "taken") {
      return;
    }

    try {
      const result = await sendSignupOtp(trimmedEmail);
      // ✅ Type assertion for result
      if (result && typeof result === 'object' && 'status' in result) {
        const status = (result as { status: number }).status;
        if (status >= 200) {
          setCooldown(60);
        }
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
    }
  };

  const validateForm = () => {
    // Create trimmed form data
    const trimmedData: SignupFormData = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      password: formData.password.trim(),
      otp: formData.otp.trim(),
    };

    let valid = true;
    const newErrors: FormErrors = {
      name: "",
      email: "",
      password: "",
      otp: "",
    };

    // Name validation
    if (!trimmedData.fullName) {
      newErrors.name = "Name is required";
      valid = false;
    } else if (!isLength(trimmedData.fullName, { min: 3 })) {
      newErrors.name = "Name must be at least 3 characters";
      valid = false;
    }

    // Email validation
    if (!trimmedData.email) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!isEmail(trimmedData.email)) {
      newErrors.email = "Invalid email format";
      valid = false;
    } else if (emailStatus === "taken") {
      newErrors.email = "Email is already registered";
      valid = false;
    }

    // Password validation
    if (!trimmedData.password) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (isEmpty(trimmedData.password)) {
      newErrors.password = "Password cannot be empty";
      valid = false;
    } else if (!isLength(trimmedData.password, { min: 6 })) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    // OTP validation
    if (!trimmedData.otp) {
      newErrors.otp = "OTP is required";
      valid = false;
    } else if (
      !isNumeric(trimmedData.otp) ||
      !isLength(trimmedData.otp, { min: 6, max: 6 })
    ) {
      newErrors.otp = "OTP must be 6 digits";
      valid = false;
    }

    setErrors(newErrors);
    return { valid, trimmedData };
  };

  // ✅ Typed form submit handler
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { valid, trimmedData } = validateForm();
    if (!valid) return;

    try {
      await signup(trimmedData);
      router.push("/");
    } catch (error) {
      console.error("Signup failed:", error);
    }
  };

  return (
    <div className="flex p-4 pt-8 items-center justify-center bg-[#f5f5f5] dark:bg-background">
      <h1 className="sr-only">Create a NoteHub Account</h1>
      <div className={cn("flex flex-col gap-2 max-w-110 w-full m-auto")}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Signup</CardTitle>
            <CardDescription>
              Fill this form to create an account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit}>
              <div className="flex flex-col gap-5">
                {/* Name Field */}
                <LabeledInput
                  id="fullName"
                  label="Full Name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={isSigningUp}
                  error={errors.name}
                  inputClassName={errors.name ? "ring-2 ring-red-500" : ""}
                />

                {/* Email Field */}
                <LabeledInput
                  id="email"
                  label="Email Address"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSigningUp}
                  error={errors.email}
                  inputClassName={errors.email ? "ring-2 ring-red-500" : ""}
                  loading={isCheckingEmail}
                  rightElement={
                    !isCheckingEmail && emailStatus === "available" ? (
                      <Check className="size-4 text-green-500" />
                    ) : null
                  }
                />

                {/* Password Field */}
                <LabeledInput
                  id="password"
                  label="Password"
                  type="password"
                  placeholder="Create a secure password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSigningUp}
                  error={errors.password}
                  showPasswordToggle
                  inputClassName={errors.password ? "ring-2 ring-red-500" : ""}
                />

                {/* OTP Input */}
                <div className="flex flex-col gap-1">
                  <div className="relative flex flex-col sm:flex-row items-center gap-4">
                    <InputOTP
                      maxLength={6}
                      id="otp"
                      value={formData.otp}
                      onChange={(value) =>
                        setFormData((prev) => ({ ...prev, otp: value }))
                      }
                      pattern={REGEXP_ONLY_DIGITS}
                      disabled={false}
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
                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleSendotp}
                      disabled={
                        cooldown > 0 ||
                        isSendingOtp ||
                        emailStatus !== "available"
                      }
                    >
                      {isSendingOtp ? (
                        <Loader2 className="animate-spin mr-2 size-4" />
                      ) : cooldown > 0 ? (
                        cooldown
                      ) : (
                        "Send OTP"
                      )}
                    </Button>
                    {errors.otp && (
                      <p className="text-xs absolute left-0 -bottom-4 text-red-500">
                        {errors.otp}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 font-semibold rounded-xl"
                  disabled={isSigningUp || emailStatus === "taken"}
                >
                  {isSigningUp ? (
                    <>
                      <Loader2 className="animate-spin mr-2 size-4" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </div>
            </form>
            <GoogleLoginButton
              className={"mt-4 h-12 font-semibold rounded-xl"}
            />
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href={"/login"}
                className="underline font-semibold text-foreground"
              >
                Login
              </Link>
            </div>
          </CardContent>
        </Card>
        <div className="text-muted-foreground mt-6 text-center text-sm text-balance">
          By clicking continue, you agree to our{" "}
          <Link href={"/privacy-policy"} className="underline">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;