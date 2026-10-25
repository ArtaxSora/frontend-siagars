"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CrossIcon, MenuIcon } from "@/components/ui/icons";

const LINKS = [
  { href: "/rumah-sakit", label: "Cari rumah sakit" },
  { href: "/lacak-rujukan", label: "Lacak rujukan" },
  { href: "/tentang-data", label: "Tentang data" },
] as const;

const OPERATOR_LINK = { href: "/operator/login", label: "Operator" } as const;

function isActive(pathname: string, href: string): boolean {
  if (href === OPERATOR_LINK.href) return pathname.startsWith("/operator");
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Header situs. < md: logo + tombol "Menu" berlabel yang membuka daftar tautan
 * (bukan baris tautan yang terlipat dua). md+: baris tautan biasa.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Tutup menu setelah berpindah halaman.
  const [menuPath, setMenuPath] = useState(pathname);
  if (pathname !== menuPath) {
    setMenuPath(pathname);
    setOpen(false);
  }

  const linkClass = (href: string, subtle = false) =>
    `inline-flex min-h-11 items-center rounded-md px-3 md:min-h-10 ${
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
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-3 font-semibold text-ink hover:bg-well md:hidden"
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
          className={`${open ? "block" : "hidden"} absolute inset-x-0 top-full z-30 border-b border-line bg-surface px-4 pb-3 shadow-level3 md:static md:block md:border-0 md:p-0 md:shadow-none`}
        >
          <ul className="flex flex-col gap-1 md:flex-row md:items-center">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isActive(pathname, l.href) ? "page" : undefined}
                  className={`${linkClass(l.href)} w-full md:w-auto`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={OPERATOR_LINK.href}
                aria-current={isActive(pathname, OPERATOR_LINK.href) ? "page" : undefined}
                className={`${linkClass(OPERATOR_LINK.href, true)} w-full md:w-auto`}
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
