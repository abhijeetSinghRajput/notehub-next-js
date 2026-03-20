import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import OAuthCallback from "./OAuthCallback";

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin size-8" />
            <span className="text-muted-foreground">Completing sign in...</span>
          </div>
        </div>
      }
    >
      <OAuthCallback />
    </Suspense>
  );
}