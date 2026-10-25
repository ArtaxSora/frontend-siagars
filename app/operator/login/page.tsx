import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/features/operator/login-form";
import { LoadingBlock } from "@/components/ui/states";

export const metadata: Metadata = {
  title: "Masuk operator",
  robots: { index: false, follow: false },
};

export default function OperatorLoginPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[28px] font-bold leading-9">Masuk operator</h1>
      <p className="max-w-prose text-muted">
        Khusus operator demo. Anda hanya dapat mengelola rumah sakit yang
        ditugaskan kepada akun Anda.
      </p>
      <Suspense fallback={<LoadingBlock rows={1} />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
