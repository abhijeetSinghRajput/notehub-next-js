"use client";
import React, { useEffect } from "react";
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
        router.push(`/login?error=${encodeURIComponent(error)}`);
        return;
      }

      if (code) {
        const codeVerifier = sessionStorage.getItem("code_verifier");
        console.log({codeVerifier});
        try {
          const result = await googleLogin({
            code,
            codeVerifier,
            redirectUri,
          });
          console.log({result});

          if (!result) {
            router.push("/login?error=Authentication failed");
            return;
          }

          router.push("/");
        } catch {
          router.push("/login?error=Something went wrong");
        }
      } else {
        router.push("/login?error=Authorization code missing");
      }
    };

    handleAuth();
  }, [searchParams, router, googleLogin, redirectUri]);

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="flex gap-2">
        <Loader2 className="animate-spin" />
        <span>Logging in</span>
      </div>
    </div>
  );
};

export default OAuthCallback;
