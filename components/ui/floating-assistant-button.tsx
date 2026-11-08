"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SparklesIcon } from "@/components/ui/icons";

export function FloatingAssistantButton() {
  return (
    <Suspense fallback={null}>
      <CurrentFloatingButton />
    </Suspense>
  );
}

function CurrentFloatingButton() {
  const pathname = usePathname();
  if (pathname === "/asisten") return null;

  return (
    <Link
      href="/asisten"
      className="fixed bottom-6 right-6 z-40 inline-flex min-h-12 items-center gap-2 rounded-full border border-brand/20 bg-brand px-4 py-2 text-[14px] font-bold text-white shadow-level3 transition-transform hover:scale-105 hover:bg-brand-deep focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
      aria-label="Buka Asisten AI Pencari Rumah Sakit"
    >
      <SparklesIcon className="h-4 w-4" />
      <span>Tanya Asisten AI</span>
    </Link>
  );
}
