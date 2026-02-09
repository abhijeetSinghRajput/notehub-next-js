import React, { useEffect } from "react";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

const OAuthCallback = () => {
  const redirectUri = `${window.location.origin}/oauth/callback`;
  const router = useRouter();
  const [searchParams] = useSearchParams();
  const { googleLogin } = useAuthStore();

  useEffect(() => {
    const handleAuth = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      if (error) {
        console.error("OAuth Error:", error);
        router.push("/login");
        return;
      }

      if (code) {
        const codeVerifier = sessionStorage.getItem("code_verifier");
        try {
          const result = await googleLogin({ code, codeVerifier, redirectUri });
          router.push(result? "/" : "/login");
        } catch (err) {
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
    };

    handleAuth(); 
  }, []);

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
