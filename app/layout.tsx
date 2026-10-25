import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { PrototypeBanner } from "@/components/ui/notices";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SiagaRS — Cari rumah sakit berdasarkan fasilitas",
    template: "%s · SiagaRS",
  },
  description:
    "Prototipe untuk mencari rumah sakit berdasarkan fasilitas yang dinyatakan tersedia, lengkap dengan sumber dan umur informasinya. Bukan layanan resmi gawat darurat.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // Ekstensi browser (mis. Night Eye) menambah atribut di <html> sebelum hidrasi.
    <html
      lang="id"
      className={`${jakarta.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-14 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:font-semibold focus:shadow-level3"
        >
          Lewati ke konten utama
        </a>
        <PrototypeBanner />
        <SiteHeader />
        <main
          id="main-content"
          className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 md:px-8 md:py-8"
        >
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
