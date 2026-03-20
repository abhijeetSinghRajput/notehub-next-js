import { Suspense } from "react";
import LogInPage from "./LogInPage";

export default function LoginPage() {
  return (
    <Suspense>
      <LogInPage />
    </Suspense>
  );
}