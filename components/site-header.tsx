"use client";
import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { SiteLogo } from "@/components/site-logo";
import { usePathname } from "next/navigation";
import { CrossIcon, MenuIcon } from "@/components/ui/icons";

const LINKS = [
  { href: "/rumah-sakit", label: "Cari RS" },
  { href: "/cek-bpjs", label: "Cek BPJS" },
  { href: "/bandingkan", label: "Bandingkan" },
  { href: "/wawasan", label: "Wawasan" },
] as const;

export function SiteHeader() {
  return <Suspense fallback={<Header pathname={null} />}><CurrentHeader /></Suspense>;
}
function CurrentHeader() { return <Header pathname={usePathname()} />; }
function Header({ pathname }: { pathname: string | null }) {
  const [open, setOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  const trigger = useRef<HTMLButtonElement>(null);
  if (menuPath !== pathname) { setMenuPath(pathname); setOpen(false); }
  return (
    <header className="site-header" onKeyDown={(e) => {
      if (e.key === "Escape" && open) { setOpen(false); trigger.current?.focus(); }
    }}>
      <div className="site-header-inner">
        <Link href="/" aria-label="SiagaRS, beranda" className="site-wordmark gap-1"><SiteLogo /><span><strong className="font-extrabold">Siaga</strong>RS</span></Link>
        <span className="hidden border-l border-line pl-5 text-[13px] text-muted xl:block">Informasi jelas. Pilihan lebih tepat.</span>
        <button ref={trigger} type="button" className="menu-toggle" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen(!open)}>
          {open ? <CrossIcon /> : <MenuIcon />} Menu
        </button>
        <nav id="site-nav" aria-label="Navigasi utama" className={`site-nav ${open ? "is-open" : ""}`}>
          {LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname?.startsWith(`${href}/`);
            return <Link key={href} href={href} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}>{label}</Link>;
          })}
        </nav>
      </div>
    </header>
  );
}
