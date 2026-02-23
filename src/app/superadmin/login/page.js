import { Suspense } from "react";
import LoginForm from "@/components/Superadmin/LoginForm";

export default function SuperadminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
