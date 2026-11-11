import type { ReactNode } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
}

export interface DataTableProps<T> {
  caption: string;
  columns: readonly DataTableColumn<T>[];
  rows: readonly T[];
  rowKey: (row: T) => string;
  hideCaption?: boolean;
}

/**
 * Tabel data aksesibel (PRD §4.6 & §6). Dipakai baik sebagai tampilan utama
 * (kesenjangan layanan) maupun sebagai tabel data alternatif untuk grafik SVG.
 */
export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  hideCaption = false,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-md border border-line bg-surface">
      <table className="w-full border-collapse text-left text-[13px] leading-5">
        <caption
          className={
            hideCaption
              ? "sr-only"
              : "border-b border-line px-3 py-2 text-left text-[12px] font-semibold text-muted"
          }
        >
          {caption}
        </caption>
        <thead>
          <tr className="border-b border-line bg-well text-ink">
            {columns.map((col, idx) => (
              <th
                key={col.key}
                scope="col"
                className={`px-3 py-2.5 font-semibold ${
                  col.align === "right" ? "text-right" : "text-left"
                } ${idx === 0 ? "min-w-[10rem]" : "whitespace-nowrap"}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="hover:bg-well/60">
              {columns.map((col, idx) =>
                idx === 0 ? (
                  <th
                    key={col.key}
                    scope="row"
                    className="px-3 py-2.5 font-semibold text-ink"
                  >
                    {col.render(row)}
                  </th>
                ) : (
                  <td
                    key={col.key}
                    className={`px-3 py-2.5 ${
                      col.align === "right"
                        ? "text-right tabular-nums"
                        : "text-left"
                    }`}
                  >
                    {col.render(row)}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Pembungkus grafik dengan judul, sumber, waktu agregasi WIB, dan
 * `<details>` tabel data alternatif untuk pembaca layar & pengguna keyboard.
 */
export function ChartSection({
  id,
  title,
  description,
  generatedWib,
  sources,
  children,
  altTable,
  altTableLabel = "Tampilkan tabel data alternatif (aksesibilitas)",
}: {
  id: string;
  title: string;
  description?: ReactNode;
  generatedWib: string | null;
  sources?: readonly string[];
  children: ReactNode;
  altTable?: ReactNode;
  altTableLabel?: string;
}) {
  const sourceText =
    sources && sources.length > 0
      ? sources.join(", ")
      : "Agregasi database SiagaRS (SATUSEHAT Sandbox, Kurasi Tim, Simulasi berlabel)";

  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-4 rounded-md border border-line bg-surface p-4 md:p-6"
    >
      <header className="flex flex-col gap-1">
        <h2 id={id} className="text-[20px] font-bold leading-7 tracking-[-0.01em]">
          {title}
        </h2>
        {description && <div className="text-muted">{description}</div>}
      </header>

      {children}

      {altTable && (
        <details className="group rounded-md border border-line bg-well/50">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-[13px] font-semibold text-trust hover:bg-well md:min-h-10 [&::-webkit-details-marker]:hidden">
            <span>{altTableLabel}</span>
            <ChevronDownIcon className="transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-line p-3">{altTable}</div>
        </details>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-line pt-3 text-[12px] leading-[18px] text-faint">
        <span>Sumber: {sourceText}</span>
        <span className="tabular-nums">
          Waktu agregasi: {generatedWib ?? "Belum diketahui"}
        </span>
      </footer>
    </section>
  );
}
