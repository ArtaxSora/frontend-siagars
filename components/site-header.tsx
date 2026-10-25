import Link from "next/link";

const LINKS = [
  { href: "/rumah-sakit", label: "Cari rumah sakit" },
  { href: "/lacak-rujukan", label: "Lacak rujukan" },
  { href: "/tentang-data", label: "Tentang data" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 md:px-8">
        <Link
          href="/"
          className="text-[20px] font-bold tracking-[-0.01em] text-brand-deep"
        >
          SiagaRS
        </Link>
        <nav aria-label="Navigasi utama">
          <ul className="flex flex-wrap items-center gap-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="inline-flex min-h-10 items-center rounded-md px-3 font-semibold text-muted hover:bg-well hover:text-ink"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/operator/login"
                className="inline-flex min-h-10 items-center rounded-md px-3 text-faint hover:bg-well hover:text-ink"
              >
                Operator
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
