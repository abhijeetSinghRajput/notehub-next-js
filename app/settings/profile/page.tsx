import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ProfileSettingsClient from "./ProfileSettingsClient";

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-10">
          <Loader2 className="size-5 animate-spin" />
        </div>
      }
    >
      <ProfileSettingsClient />
    </Suspense>
  );
}