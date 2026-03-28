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
import { AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/app/stores/useAuthStore";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import { z } from "zod";
import { LabeledInput } from "@/components/labeled-input";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import NProgress from "nprogress";

const loginSchema = z.object({
  identifier: z.string().min(1, "Username or Email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type FormErrors = Partial<Record<keyof LoginFormData, string>>;

const LogInPage = () => {
  const { isLoggingIn, login } = useAuthStore();

  const [formData, setFormData] = useState<LoginFormData>({
    identifier: "",
    password: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: "" }));
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = loginSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors = result.error.issues.reduce<FormErrors>(
        (acc, curr) => {
          const field = curr.path[0] as keyof LoginFormData;
          acc[field] = curr.message;
          return acc;
        },
        {},
      );
      setErrors(fieldErrors);
      return;
    }

    const success = await login(result.data);
    if (success) {
      NProgress.start();
      router.push("/");
    }
  };

  return (
    <div className="flex p-4 pt-10 items-center justify-center min-h-[calc(100svh-64px)] bg-muted dark:bg-background">
      <h1 className="sr-only">Log In to NoteHub</h1>
      <div className={cn("flex flex-col gap-2 max-w-110 w-full m-auto")}>
        {error && (
          <div className="bg-destructive/20 px-2 p-1.5 rounded-md border border-destructive/50 flex items-center justify-center gap-2 text-destructive">
            <AlertCircle size={18} />
            <p>{error}</p>
          </div>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit}>
              <div className="flex flex-col gap-5">
                <LabeledInput
                  id="identifier"
                  label="Username or Email"
                  type="text"
                  placeholder="Enter username or email"
                  value={formData.identifier}
                  onChange={handleChange}
                  disabled={isLoggingIn}
                  error={errors.identifier}
                  inputClassName={
                    errors.identifier ? "ring-2 ring-red-500" : ""
                  }
                />

                <div className="flex flex-col gap-2">
                  <LabeledInput
                    id="password"
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoggingIn}
                    error={errors.password}
                    showPasswordToggle
                    inputClassName={
                      errors.password ? "ring-2 ring-red-500" : ""
                    }
                  />
                  <Link
                    href="/forgot-password"
                    className="text-sm underline-offset-2 hover:underline w-min whitespace-nowrap"
                  >
                    Forgot your password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 font-semibold rounded-xl"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="animate-spin mr-2" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </div>
            </form>
            <GoogleLoginButton
              className={"mt-4 h-12 font-semibold rounded-xl"}
            />
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="underline font-semibold text-foreground"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
        <div className="text-muted-foreground mt-6 *:[a]:hover:text-primary text-center text-sm text-balance *:[a]:underline *:[a]:underline-offset-4">
          By clicking continue, you agree to our{" "}
          <Link href={"/privacy-policy"} className="underline">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LogInPage;