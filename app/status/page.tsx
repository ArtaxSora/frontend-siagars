import type { Metadata } from "next";
import { SystemStatus } from "@/features/system/system-status";

export const metadata: Metadata = {
  title: "Status sistem",
  description: "Periksa apakah server API dan database SiagaRS sedang berjalan.",
  robots: { index: false },
};

export default function SystemStatusPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <h1 className="text-[28px] font-bold leading-9 tracking-[-0.01em] md:text-[36px] md:leading-[44px] md:tracking-[-0.02em]">
        Status sistem
      </h1>
      <p className="text-muted">
        Bila pencarian atau pelacakan gagal dimuat, halaman ini membantu
        memastikan apakah gangguan berasal dari server. Server yang baru
        bangun (cold start) bisa membutuhkan beberapa detik.
      </p>
      <SystemStatus />
    </div>
  );
}
