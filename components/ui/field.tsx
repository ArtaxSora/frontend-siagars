import type { ReactNode } from "react";

export const inputClasses =
  "block min-h-11 w-full md:min-h-10 rounded-md border border-line-strong bg-surface px-3 text-[14px] leading-5 text-ink placeholder:text-faint focus-visible:border-2 focus-visible:border-brand";

/** Label + kontrol + petunjuk/galat, saling terhubung untuk pembaca layar. */
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold leading-4 text-ink">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-[12px] leading-[18px] text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-[12px] font-semibold leading-[18px] text-bad-fg"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/** Nilai aria-describedby untuk kontrol di dalam <Field>. */
export function describedBy(
  id: string,
  options: { hint?: boolean; error?: boolean },
): string | undefined {
  if (options.error) return `${id}-error`;
  if (options.hint) return `${id}-hint`;
  return undefined;
}
