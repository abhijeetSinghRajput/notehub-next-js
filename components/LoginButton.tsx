"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import nProgress from "nprogress";
import { Button } from "@/components/ui/button";

export default function LoginButton() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <Button
      onClick={() => {
        nProgress.start();

        const currentUrl =
          pathname +
          (searchParams.toString()
            ? `?${searchParams.toString()}`
            : "");

        router.push(
          `/login?redirect=${encodeURIComponent(currentUrl)}`
        );
      }}
    >
      Login
    </Button>
  );
}