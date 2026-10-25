import type { Metadata } from "next";
import { ReferralLookup } from "@/features/referrals/referral-lookup";

export const metadata: Metadata = {
  title: "Lacak rujukan",
  description: "Lihat status dan linimasa rujukan simulasi dengan kode demo.",
  robots: { index: false },
};

export default function ReferralTrackingPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-[28px] font-bold leading-9 tracking-[-0.01em] md:text-[36px] md:leading-[44px] md:tracking-[-0.02em]">
        Lacak rujukan
      </h1>
      <p className="text-muted">
        Masukkan kode pelacakan demo untuk melihat status dan linimasa publik.
        Seluruh data di halaman ini adalah <strong>simulasi sintetis</strong>;
        tidak ada rujukan resmi yang dibuat.
      </p>
      <ReferralLookup />
    </div>
  );
}
