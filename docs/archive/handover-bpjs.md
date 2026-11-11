# Usulan Kontrak API: Cek Kepesertaan BPJS (Simulasi)

Untuk: Akmal Bariq Yonanda (backend). Dari: M. Tauriq Arya (frontend). Tanggal: 25 Oktober 2026.
Status: **usulan dari FE**, belum ada di backend. Bila kalian ingin bentuk lain, kabari; FE akan menyesuaikan.

## 1. Ringkasan

FE sudah membuat halaman **`/cek-bpjs`** di https://frontend-siagars.vercel.app. Pengguna mengisi **NIK, nama, dan tanggal lahir**, lalu melihat status kepesertaan BPJS Kesehatan.

Fitur ini **simulasi**: backend mencocokkan input ke **data peserta sintetis** yang dibuat backend, bukan ke sistem BPJS Kesehatan. Kami tidak punya kerja sama atau kredensial resmi BPJS (VClaim), dan handover v0.2 menyatakan sistem tidak menyimpan NIK/data pasien.

Saat ini endpoint belum ada (`404`), dan FE menampilkan "Fitur cek BPJS belum tersedia di server". Begitu endpoint dirilis dengan bentuk di bawah, fitur langsung jalan tanpa perubahan FE.

## 2. Endpoint

```
POST /api/v1/bpjs/check
Content-Type: application/json
```

- **Publik**, tanpa sesi operator dan tanpa CSRF (sama seperti `POST /referrals/lookup`).
- Data pribadi **hanya di body**, tidak pernah di URL/query.

## 3. Request (yang dikirim FE)

```json
{
  "nik": "3171010101900001",
  "name": "Budi Santoso",
  "birth_date": "1990-01-01"
}
```

| Field | Tipe | Aturan (sudah divalidasi FE; mohon divalidasi ulang di BE) |
|---|---|---|
| `nik` | string | Tepat 16 digit angka. FE sudah membuang spasi dan tanda hubung. |
| `name` | string | 1–100 karakter; huruf (termasuk huruf beraksen), spasi, `.`, `'`, `-`. FE sudah merapikan spasi ganda dan spasi di awal/akhir. Huruf besar-kecil dikirim apa adanya. |
| `birth_date` | string | `YYYY-MM-DD`, tanggal valid, tidak di masa depan (WIB), tidak sebelum 1900-01-01. |

Field lain tidak dikirim. Mohon tolak field tak dikenal (`400 invalid_json`), konsisten dengan endpoint lain.

**Pencocokan yang kami sarankan:** NIK sama persis; tanggal lahir sama persis; nama dibandingkan setelah huruf kecil semua dan spasi dirapikan.

## 4. Response sukses (output dari BE)

Selalu `200` bila input valid, **termasuk saat data tidak cocok**. Jangan pakai `404` untuk "tidak cocok", karena FE memakai `404` sebagai tanda endpoint belum tersedia.

### 4a. Peserta ditemukan

```json
{
  "data": {
    "result": "found",
    "participant": {
      "nik_masked": "3171********0001",
      "name_masked": "BU** SA*****",
      "status": "inactive",
      "inactive_reason": "Tunggakan iuran 3 bulan",
      "membership_type": { "code": "PBPU", "name": "Pekerja Bukan Penerima Upah" },
      "care_class": "3",
      "primary_facility": { "code": "0123B456", "name": "Puskesmas Kebayoran Baru" }
    },
    "data_origin": "simulation",
    "checked_at": "2026-10-25T08:00:00Z"
  }
}
```

### 4b. Data tidak cocok

```json
{
  "data": {
    "result": "not_found",
    "participant": null,
    "data_origin": "simulation",
    "checked_at": "2026-10-25T08:00:00Z"
  }
}
```

### Arti field

| Field | Tipe | Keterangan |
|---|---|---|
| `result` | `"found"` \| `"not_found"` | `not_found` = NIK/nama/tanggal lahir tidak cocok. Jangan bedakan "NIK tidak ada" dan "nama salah" (mencegah enumerasi). |
| `participant` | objek \| `null` | `null` bila `not_found`. |
| `participant.nik_masked` | string | **Wajib disamarkan**; usulan: 4 digit awal + 8 `*` + 4 digit akhir. |
| `participant.name_masked` | string | **Wajib disamarkan**; usulan: 2 huruf awal tiap kata, sisanya `*`. |
| `participant.status` | `"active"` \| `"inactive"` | Status kepesertaan. |
| `participant.inactive_reason` | string \| `null` | Alasan tidak aktif, teks siap tampil (Bahasa Indonesia). `null` bila aktif. |
| `participant.membership_type` | `{code, name}` \| `null` | Jenis kepesertaan, mis. `PBI`, `PBPU`, `PPU`, `BP`. FE menampilkan `name ?? code`; `null` → "Belum diketahui". |
| `participant.care_class` | `"1"` \| `"2"` \| `"3"` \| `null` | Kelas rawat. |
| `participant.primary_facility` | `{code, name}` \| `null` | Faskes tingkat pertama terdaftar. |
| `data_origin` | enum `DataOrigin` | Selalu `"simulation"` untuk fitur ini. FE selalu memberi label "Simulasi". |
| `checked_at` | RFC3339 UTC | Waktu pemeriksaan; FE menampilkannya dalam WIB. |

FE sengaja **tidak meminta** NIK atau nama lengkap dikembalikan tanpa samaran.

## 5. Galat

Format galat sama dengan endpoint lain: `{error:{code,message}, request_id}`.

| Status | `error.code` | Kapan | Yang ditampilkan FE |
|---|---|---|---|
| 400 | `invalid_json` | Body rusak atau ada field tak dikenal | Pesan umum + `request_id` |
| 422 | `validation_error` | NIK bukan 16 digit, tanggal tidak valid, dll. | `message` dari BE apa adanya (mohon Bahasa Indonesia, tanpa menggemakan nilai input) |
| 429 | `rate_limited` | Terlalu banyak percobaan | Hitung mundur dari header `Retry-After` |
| 404 / 405 / 501 | – | Endpoint belum dirilis | "Fitur cek BPJS belum tersedia di server" |
| 5xx | `internal_error` | Galat server | Pesan umum + `request_id` |

## 6. Privasi dan keamanan (mohon dipenuhi)

1. **Jangan simpan** NIK/nama/tanggal lahir dari request, baik di database, cache, maupun audit.
2. **Jangan log** body request, termasuk di log Vercel atau saat galat. Cukup log `request_id`, status, dan durasi.
3. **Rate limit** per IP, mis. 10 permintaan per menit, karena endpoint publik dengan NIK rawan enumerasi. Balas `429` + `Retry-After`.
4. Respons **`Cache-Control: no-store`**.
5. Data peserta **sintetis**: buat NIK yang jelas fiktif, dan jangan memakai data orang nyata.

Di sisi FE: data hanya ada di memori komponen, input tanpa atribut `name` (tidak bocor ke URL), formulir dikosongkan setelah hasil diterima, dan pengguna wajib mencentang "Saya mengerti ini simulasi dan hanya memakai data demo".

## 7. Data demo yang kami butuhkan

Mohon sediakan minimal **4 peserta sintetis** dan bagikan NIK, nama, serta tanggal lahirnya (boleh di repo, karena fiktif), agar kami bisa menguji dan mendemokan:

| Kasus | Yang diharapkan |
|---|---|
| Aktif, data lengkap | `status: active`, semua field terisi |
| Tidak aktif | `status: inactive` + `inactive_reason` |
| Aktif, sebagian kosong | mis. `primary_facility: null`, `care_class: null` (uji tampilan "Belum diketahui") |
| PBI | `membership_type.code: "PBI"` |

## 8. Checklist BE

- [ ] `POST /api/v1/bpjs/check` dengan request dan response seperti §3–§4, dan tercantum di OpenAPI.
- [ ] `not_found` dibalas `200` dengan `result: "not_found"`, bukan `404`.
- [ ] NIK dan nama di respons selalu disamarkan.
- [ ] Tidak menyimpan dan tidak me-log data input.
- [ ] Rate limit + `Retry-After`, `Cache-Control: no-store`.
- [ ] Data peserta sintetis + daftar data demo untuk FE.
- [ ] Kabari FE versi API yang memuat endpoint ini (dan catat di CHANGELOG).
