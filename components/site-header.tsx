"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CrossIcon, MenuIcon } from "@/components/ui/icons";

const LINKS = [
  { href: "/pilih-rs", label: "Pilih RS" },
  { href: "/rumah-sakit", label: "Cari RS" },
  { href: "/bandingkan", label: "Bandingkan" },
  { href: "/lacak-rujukan", label: "Lacak rujukan" },
  { href: "/cek-bpjs", label: "Cek BPJS" },
  { href: "/tentang-data", label: "Tentang data" },
] as const;

// /operator -> panel bila sesi aktif, atau ke halaman login bila belum.
const OPERATOR_LINK = { href: "/operator", label: "Operator" } as const;

function isActive(pathname: string | null, href: string): boolean {
  if (pathname === null) return false;
  if (href === OPERATOR_LINK.href) return pathname.startsWith("/operator");
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Header situs. < lg: logo + tombol "Menu" berlabel yang membuka daftar tautan
 * (bukan baris tautan yang terlipat dua). lg+: baris tautan biasa.
 *
 * usePathname di layout menahan prerender rute dengan param dinamis
 * (cacheComponents), jadi dibungkus Suspense; fallback = header yang sama
 * tanpa penanda tautan aktif.
 */
export function SiteHeader() {
  return (
    <Suspense fallback={<SiteHeaderView pathname={null} />}>
      <CurrentSiteHeader />
    </Suspense>
  );
}

function CurrentSiteHeader() {
  return <SiteHeaderView pathname={usePathname()} />;
}

function SiteHeaderView({ pathname }: { pathname: string | null }) {
  const [open, setOpen] = useState(false);
  // Tutup menu setelah berpindah halaman.
  const [menuPath, setMenuPath] = useState(pathname);
  if (pathname !== menuPath) {
    setMenuPath(pathname);
    setOpen(false);
  }

  const linkClass = (href: string, subtle = false) =>
    `inline-flex min-h-11 items-center whitespace-nowrap rounded-md px-3 lg:min-h-10 ${
      isActive(pathname, href)
        ? "bg-brand-tint font-semibold text-brand-deep"
        : subtle
          ? "text-faint hover:bg-well hover:text-ink"
          : "font-semibold text-muted hover:bg-well hover:text-ink"
    }`;

  return (
    <header className="relative border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-x-6 px-4 py-1.5 md:px-8 md:py-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center text-[20px] font-bold tracking-[-0.01em] text-brand-deep"
        >
          SiagaRS
        </Link>

        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-3 font-semibold text-ink hover:bg-well lg:hidden"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <CrossIcon /> : <MenuIcon />}
          Menu
        </button>

        <nav
          id="site-nav"
          aria-label="Navigasi utama"
          className={`${open ? "block" : "hidden"} absolute inset-x-0 top-full z-30 border-b border-line bg-surface px-4 pb-3 shadow-level3 lg:static lg:block lg:border-0 lg:p-0 lg:shadow-none`}
        >
          <ul className="flex flex-col gap-1 lg:flex-row lg:items-center">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isActive(pathname, l.href) ? "page" : undefined}
                  className={`${linkClass(l.href)} w-full lg:w-auto`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={OPERATOR_LINK.href}
                aria-current={isActive(pathname, OPERATOR_LINK.href) ? "page" : undefined}
                className={`${linkClass(OPERATOR_LINK.href, true)} w-full lg:w-auto`}
              >
                {OPERATOR_LINK.label}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
