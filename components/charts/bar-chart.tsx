export interface BarChartDatum {
  id: string;
  label: string;
  value: number;
  secondaryValue?: number;
  metaText?: string;
}

export interface BarChartProps {
  title: string;
  data: readonly BarChartDatum[];
  primaryLabel: string;
  secondaryLabel?: string;
}

/**
 * Grafik batang horizontal SVG ringan (tanpa library eksternal, PRD §4.6 & §6).
 * Memakai variabel CSS token `@theme` agar selaras dengan sistem desain.
 */
export function BarChart({
  title,
  data,
  primaryLabel,
  secondaryLabel,
}: BarChartProps) {
  const maxVal = Math.max(1, ...data.map((d) => d.value));
  const rowHeight = 36;
  const labelWidth = 175;
  const rightPad = 78;
  const barAreaWidth = 360;
  const svgWidth = labelWidth + barAreaWidth + rightPad;
  const svgHeight = Math.max(60, data.length * rowHeight + 16);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4 text-[12px] leading-[18px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 rounded-xs bg-brand"
          />
          {primaryLabel}
        </span>
        {secondaryLabel && (
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block h-3 w-3 rounded-xs border border-kurasi-line bg-kurasi-fg"
            />
            {secondaryLabel}
          </span>
        )}
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          role="img"
          aria-label={title}
          className="h-auto w-full min-w-[480px] select-none"
        >
          <title>{title}</title>
          {data.map((item, idx) => {
            const y = idx * rowHeight + 8;
            const totalW = Math.max(
              item.value > 0 ? 4 : 0,
              Math.round((item.value / maxVal) * barAreaWidth),
            );
            const secVal = item.secondaryValue ?? 0;
            const secW =
              secVal > 0
                ? Math.max(3, Math.round((secVal / maxVal) * barAreaWidth))
                : 0;

            return (
              <g key={item.id} transform={`translate(0, ${y})`}>
                <text
                  x={labelWidth - 10}
                  y={18}
                  textAnchor="end"
                  fill="var(--color-ink)"
                  fontSize="12"
                  fontWeight="600"
                >
                  {item.label.length > 23
                    ? `${item.label.slice(0, 22)}…`
                    : item.label}
                </text>

                <rect
                  x={labelWidth}
                  y={5}
                  width={barAreaWidth}
                  height={18}
                  rx={3}
                  fill="var(--color-well)"
                />

                {totalW > 0 && (
                  <rect
                    x={labelWidth}
                    y={5}
                    width={totalW}
                    height={18}
                    rx={3}
                    fill="var(--color-brand)"
                  />
                )}

                {secW > 0 && (
                  <rect
                    x={labelWidth}
                    y={17}
                    width={Math.min(secW, totalW)}
                    height={6}
                    rx={2}
                    fill="var(--color-kurasi-fg)"
                  />
                )}

                <text
                  x={labelWidth + barAreaWidth + 8}
                  y={18}
                  fill="var(--color-ink)"
                  fontSize="12"
                  fontWeight="700"
                >
                  {item.value} RS
                  {secVal > 0 ? ` (${secVal} kurasi)` : ""}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
