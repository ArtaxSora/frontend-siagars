"use client";
import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { SiteLogo } from "@/components/site-logo";
import { OperatorAccount } from "@/features/operator/operator-account";
import { usePathname } from "next/navigation";
import { CrossIcon, MenuIcon } from "@/components/ui/icons";

const LINKS = [
  { href: "/rumah-sakit", label: "Cari RS" },
  { href: "/cek-bpjs", label: "Cek BPJS" },
  { href: "/bandingkan", label: "Bandingkan" },
  { href: "/wawasan", label: "Wawasan" },
  // { href: "/tentang-data", label: "Tentang data" },
] as const;

export function SiteHeader() {
  return <Suspense fallback={<Header pathname={null} />}><CurrentHeader /></Suspense>;
}
function CurrentHeader() { return <Header pathname={usePathname()} />; }
function Header({ pathname }: { pathname: string | null }) {
  const [open, setOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  const trigger = useRef<HTMLButtonElement>(null);
  const operatorPanel = pathname?.startsWith("/operator") && pathname !== "/operator/login";
  if (menuPath !== pathname) { setMenuPath(pathname); setOpen(false); }
  return (
    <header className="site-header" onKeyDown={(e) => {
      if (e.key === "Escape" && open) { setOpen(false); trigger.current?.focus(); }
    }}>
      <div className="site-header-inner">
        <Link href="/" aria-label="SiagaRS, beranda" className="site-wordmark gap-1"><SiteLogo /><span><strong className="font-extrabold">Siaga</strong>RS</span></Link>
        {operatorPanel ? <>
          <Link href="/rumah-sakit" className="ml-3 hidden min-h-11 items-center text-sm text-muted hover:text-brand-deep md:inline-flex">Kembali ke situs</Link>
          <OperatorAccount />
        </> : <>
        <button ref={trigger} type="button" className="menu-toggle" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen(!open)}>
          {open ? <CrossIcon /> : <MenuIcon />} Menu
        </button>
        <nav id="site-nav" aria-label="Navigasi utama" className={`site-nav ${open ? "is-open" : ""}`}>
          {LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname?.startsWith(`${href}/`);
            return <Link key={href} href={href} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}>{label}</Link>;
          })}
        </nav>
        {/* <a
          href="tel:112"
          className="darurat-pill ml-2 hidden items-center gap-1.5 rounded-full border border-red-200 bg-red-50/90 px-3 py-1.5 text-[12px] font-bold text-red-700 transition-colors hover:bg-red-100 md:inline-flex"
          title="Panggilan darurat bebas pulsa 112"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
          </span>
          <span>Darurat 112</span>
        </a> */}
        </>}
      </div>
    </header>
  );
}
