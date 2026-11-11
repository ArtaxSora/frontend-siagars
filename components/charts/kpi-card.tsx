import type { ReactNode } from "react";

export interface KpiCardProps {
  label: string;
  value: string;
  detail?: ReactNode;
  badge?: ReactNode;
}

/**
 * Kartu KPI ringkas untuk /wawasan (FE-20).
 * Angka utama memakai tabular-nums agar mudah dipindai berdampingan.
 */
export function KpiCard({ label, value, detail, badge }: KpiCardProps) {
  return (
    <div className="flex flex-col justify-between gap-2 rounded-md border border-line bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <dt className="text-[13px] font-semibold text-muted">{label}</dt>
        {badge}
      </div>
      <dd className="flex flex-col gap-1">
        <span className="text-[28px] font-bold leading-9 tracking-[-0.02em] text-ink tabular-nums">
          {value}
        </span>
        {detail && (
          <span className="text-[12px] leading-[18px] text-muted">{detail}</span>
        )}
      </dd>
    </div>
  );
}
