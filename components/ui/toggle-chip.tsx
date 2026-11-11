import type { ReactNode } from "react";

/** Chip yang dapat di-toggle; checkbox asli tetap ada untuk keyboard & pembaca layar. */
export function ToggleChip({
  checked,
  onChange,
  title,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title?: string;
  children: ReactNode;
}) {
  return (
    <label
      title={title}
      className={`inline-flex min-h-11 cursor-pointer md:min-h-9 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-semibold focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-brand ${
        checked
          ? "border-brand bg-brand text-white"
          : "border-line bg-well text-muted hover:border-line-strong"
      }`}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span aria-hidden="true">{checked ? "✓" : "+"}</span>
      {children}
    </label>
  );
}
