/**
 * Validasi formulir cek BPJS (simulasi). Fungsi murni; tidak menyimpan atau
 * mencatat nilai apa pun. Server tetap memvalidasi ulang (422).
 */
import type { BpjsCheckRequest } from "../contracts/types.ts";

export const NIK_LENGTH = 16;
export const MAX_NAME_LENGTH = 100;
const MIN_BIRTH_DATE = "1900-01-01";

export type BpjsField = keyof BpjsCheckRequest;
export type BpjsFieldErrors = Partial<Record<BpjsField, string>>;

/** Buang spasi/tanda hubung yang sering ikut saat menyalin NIK. */
export function normalizeNik(raw: string): string {
  return raw.replace(/[\s-]/g, "");
}

/** Rapikan spasi ganda; huruf besar-kecil dibiarkan (server yang mencocokkan). */
export function normalizeName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
  );
}

/** `today` (YYYY-MM-DD) diberikan pemanggil agar fungsi ini murni dan bisa diuji. */
export function validateBpjsForm(input: BpjsCheckRequest, today: string): BpjsFieldErrors {
  const errors: BpjsFieldErrors = {};
  const nik = normalizeNik(input.nik);
  if (nik === "") errors.nik = "NIK wajib diisi.";
  else if (!/^\d+$/.test(nik)) errors.nik = "NIK hanya berisi angka.";
  else if (nik.length !== NIK_LENGTH) errors.nik = `NIK harus ${NIK_LENGTH} digit.`;

  const name = normalizeName(input.name);
  if (name === "") errors.name = "Nama wajib diisi.";
  else if (name.length > MAX_NAME_LENGTH) errors.name = `Nama maksimal ${MAX_NAME_LENGTH} karakter.`;
  else if (!/^[\p{L}][\p{L} .'-]*$/u.test(name))
    errors.name = "Nama hanya berisi huruf, spasi, titik, apostrof, atau tanda hubung.";

  if (input.birth_date === "") errors.birth_date = "Tanggal lahir wajib diisi.";
  else if (!isValidIsoDate(input.birth_date)) errors.birth_date = "Tanggal lahir tidak valid.";
  else if (input.birth_date > today) errors.birth_date = "Tanggal lahir tidak boleh di masa depan.";
  else if (input.birth_date < MIN_BIRTH_DATE) errors.birth_date = "Tanggal lahir tidak valid.";

  return errors;
}

/** Body yang dikirim: sudah dinormalkan. */
export function toBpjsRequest(input: BpjsCheckRequest): BpjsCheckRequest {
  return {
    nik: normalizeNik(input.nik),
    name: normalizeName(input.name),
    birth_date: input.birth_date,
  };
}
