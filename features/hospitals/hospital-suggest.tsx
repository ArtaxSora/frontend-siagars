"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { suggestHospitals } from "@/lib/api/endpoints";
import type { Dataset, Suggestion } from "@/lib/contracts/types";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { sanitizeSearchText } from "@/lib/hospitals/query";
import { inputClasses } from "@/components/ui/field";
import { OriginBadge } from "@/components/ui/badges";

const SUGGEST_DEBOUNCE_MS = 300;
const SUGGEST_LIMIT = 8;
const MIN_CHARS = 2;

/**
 * Kolom cari dengan autocomplete GET /hospitals/suggest (pola ARIA combobox).
 * Mengetik tetap memfilter daftar lewat `onChange`; memilih saran membuka detail.
 */
export function HospitalSuggestInput({
  id,
  value,
  onChange,
  dataset,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  dataset: Dataset;
  placeholder?: string;
}) {
  const router = useRouter();
  const listId = `${id}-suggestions`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [term, setTerm] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setTerm(sanitizeSearchText(value)), SUGGEST_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [value]);

  const enabled = term.length >= MIN_CHARS;
  const suggest = useApiResource<Suggestion[]>(`suggest:${dataset}:${term}`, (signal) =>
    enabled
      ? suggestHospitals(term, dataset, SUGGEST_LIMIT, signal).then((r) => r.data)
      : Promise.resolve([]),
  );
  // Saran usang (untuk term lama) tidak ditampilkan saat memuat ulang.
  const items = enabled && !suggest.loading ? (suggest.data ?? []) : [];
  const expanded = open && items.length > 0;

  function choose(item: Suggestion) {
    setOpen(false);
    router.push(`/rumah-sakit/${encodeURIComponent(item.id)}`);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
      return;
    }
    if (!expanded) {
      if (e.key === "ArrowDown") setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0 && items[active]) {
      // Enter tanpa saran aktif tetap mengirim form pencarian.
      e.preventDefault();
      choose(items[active]);
    }
  }

  return (
    <div className="relative">
      <input
        id={id}
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={
          expanded && active >= 0 ? `${listId}-${active}` : undefined
        }
        inputMode="search"
        autoComplete="off"
        enterKeyHint="search"
        className={inputClasses}
        placeholder={placeholder}
        value={value}
        maxLength={100}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      <ul
        id={listId}
        role="listbox"
        aria-label="Saran rumah sakit"
        hidden={!expanded}
        className="absolute inset-x-0 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded-md border border-line bg-surface py-1 shadow-level3"
      >
        {items.map((item, i) => (
          <li
            key={item.id}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            // mousedown mendahului blur input, jadi daftar tidak tertutup lebih dulu.
            onMouseDown={(e) => e.preventDefault()}
          >
            <Link
              href={`/rumah-sakit/${encodeURIComponent(item.id)}`}
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-[14px] ${
                i === active ? "bg-brand-tint" : "hover:bg-well"
              }`}
            >
              <span className="flex flex-col">
                <span className="font-semibold text-ink">{item.name}</span>
                <span className="text-[12px] text-muted">{item.city_name}</span>
              </span>
              {item.data_origin === "simulation" && (
                <OriginBadge origin={item.data_origin} />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
