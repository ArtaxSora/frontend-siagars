import type { Freshness } from "@/lib/contracts/types";
import { FRESHNESS_LABEL } from "@/lib/contracts/labels";

export interface StackedBarRow {
  id: string;
  label: string;
  segments: Record<Freshness, number>;
}

const SEGMENT_KEYS: readonly Freshness[] = [
  "fresh",
  "aging",
  "stale",
  "unknown",
];

const SEGMENT_FILL: Record<Freshness, string> = {
  fresh: "var(--color-fresh)",
  aging: "var(--color-aging)",
  stale: "var(--color-stale)",
  unknown: "var(--color-unknown-dot)",
};

const LEGEND_DOT: Record<Freshness, string> = {
  fresh: "bg-fresh",
  aging: "bg-aging",
  stale: "bg-stale",
  unknown: "bg-unknown-dot",
};

/**
 * Grafik stacked bar horizontal SVG untuk distribusi kesegaran per asal data
 * (PRD §4.6 & §6). Setiap segmen memiliki garis pemisah putih agar kontras.
 */
export function StackedBar({
  title,
  rows,
}: {
  title: string;
  rows: readonly StackedBarRow[];
}) {
  const rowHeight = 46;
  const labelWidth = 160;
  const rightPad = 95;
  const barWidth = 360;
  const svgWidth = labelWidth + barWidth + rightPad;
  const svgHeight = Math.max(60, rows.length * rowHeight + 16);

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] leading-[18px] text-muted">
        {SEGMENT_KEYS.map((k) => (
          <li key={k} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={`inline-block h-2.5 w-2.5 rounded-full ${LEGEND_DOT[k]}`}
            />
            {FRESHNESS_LABEL[k]}
          </li>
        ))}
      </ul>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          role="img"
          aria-label={title}
          className="h-auto w-full min-w-[480px] select-none"
        >
          <title>{title}</title>
          {rows.map((row, idx) => {
            const total =
              row.segments.fresh +
              row.segments.aging +
              row.segments.stale +
              row.segments.unknown;
            const y = idx * rowHeight + 8;

            let offsetX = labelWidth;
            const rects =
              total > 0
                ? SEGMENT_KEYS.map((key) => {
                    const count = row.segments[key];
                    if (count <= 0) return null;
                    const w = Math.max(2, (count / total) * barWidth);
                    const x = offsetX;
                    offsetX += w;
                    return { key, x, w, count };
                  }).filter((item): item is NonNullable<typeof item> => item !== null)
                : [];

            const freshPct =
              total > 0 ? Math.round((row.segments.fresh / total) * 100) : 0;

            return (
              <g key={row.id} transform={`translate(0, ${y})`}>
                <text
                  x={labelWidth - 10}
                  y={20}
                  textAnchor="end"
                  fill="var(--color-ink)"
                  fontSize="12"
                  fontWeight="600"
                >
                  {row.label}
                </text>

                <rect
                  x={labelWidth}
                  y={6}
                  width={barWidth}
                  height={22}
                  rx={3}
                  fill="var(--color-well)"
                />

                {rects.map((seg) => (
                  <rect
                    key={seg.key}
                    x={seg.x}
                    y={6}
                    width={Math.max(
                      1,
                      Math.min(seg.w, labelWidth + barWidth - seg.x),
                    )}
                    height={22}
                    fill={SEGMENT_FILL[seg.key]}
                    stroke="var(--color-surface)"
                    strokeWidth="1"
                  />
                ))}

                <text
                  x={labelWidth + barWidth + 8}
                  y={20}
                  fill="var(--color-ink)"
                  fontSize="12"
                  fontWeight="700"
                >
                  {total} ({freshPct}% segar)
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
