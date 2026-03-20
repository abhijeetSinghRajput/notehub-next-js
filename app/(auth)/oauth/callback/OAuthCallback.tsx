"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const OAuthCallback = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { googleLogin } = useAuthStore();
  const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!;

  useEffect(() => {
    const handleAuth = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      if (error) {
        console.error("OAuth error:", error);
        router.push(`/login?error=${encodeURIComponent(error)}`);
        return;
      }

      if (!code) {
        console.error("Authorization code missing");
        router.push("/login?error=Authorization code missing");
        return;
      }

      const codeVerifier = sessionStorage.getItem("code_verifier");

      if (!codeVerifier) {
        console.error("Code verifier not found in session storage");
        router.push("/login?error=Session expired. Please try again.");
        return;
      }

      sessionStorage.removeItem("code_verifier");

      try {
        const result = await googleLogin({
          code,
          codeVerifier,
          redirectUri,
        });

        if (!result) {
          router.push("/login?error=Authentication failed");
          return;
        }

        router.push("/");
      } catch (err) {
        console.error("OAuth callback error:", err);
        router.push("/login?error=Something went wrong");
      }
    };

    handleAuth();
  }, [searchParams, router, googleLogin, redirectUri]);

  return (
    <div className="h-screen flex items-center justify-center">
      <h1 className="sr-only">Completing Sign In</h1>
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin size-8" />
        <span className="text-muted-foreground">Completing sign in...</span>
      </div>
    </div>
  );
};

export default OAuthCallback;