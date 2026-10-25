import type { ApiError } from "@/lib/api/client";
import { describeApiError } from "@/components/ui/states";

/**
 * Pesan galat mutasi operator. 401 ditangani terpisah (kembali ke login);
 * 409 berarti data dimuat ulang dan operator harus meninjau ulang.
 */
export function mutationMessage(error: ApiError): string {
  switch (error.status) {
    case 403:
      return "Anda tidak berwenang melakukan perubahan ini.";
    case 409:
      return "Data telah diubah pihak lain. Data dimuat ulang — tinjau lagi, lalu simpan kembali bila masih perlu.";
    case 422:
      return error.message || "Data tidak valid. Periksa isian Anda.";
    default:
      return describeApiError(error);
  }
}
