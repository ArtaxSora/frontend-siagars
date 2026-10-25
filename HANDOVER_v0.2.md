# Serah Terima Backend SiagaRS v0.2 untuk Frontend

Untuk: M. Tauriq Arya dan tim frontend. Dari: Akmal Bariq Yonanda (backend). Tanggal: 25 Oktober 2026. Versi API: **0.2.0** (staging, branch `develop`). Production masih **0.1.0**.

Dokumen ini adalah pintu masuk. Rujukan lain:

| Butuh | Buka |
|---|---|
| Daftar perubahan per versi | [`CHANGELOG.md`](CHANGELOG.md) |
| Panduan integrasi lengkap, contoh kode | [`API_FRONTEND.md`](API_FRONTEND.md) |
| Kontrak resmi (skema, enum, contoh galat) | [`openapi.yaml`](openapi.yaml), atau UI interaktif di `/docs` |
| Contoh respons siap tempel | [`fixtures.json`](fixtures.json) |

Bila dokumen berbeda dengan OpenAPI, ikuti OpenAPI dan kabari backend.

## 1. Mulai dalam 10 menit

1. Minta ke Akmal lewat kanal privat: **secret bypass staging** dan **akun uji operator**. Keduanya tidak ada di git.
2. Buat `.env.local` di FE:
   ```text
   STAGING_API_URL=https://siagars-backend-git-develop-akmal-yonans-projects.vercel.app
   VERCEL_AUTOMATION_BYPASS_SECRET=<dari Akmal>
   ```
3. Salin route handler proxy dari [`API_FRONTEND.md`](API_FRONTEND.md) bagian 2a ke `app/api/v1/[...path]/route.ts`. Semua kode FE cukup memanggil path relatif `/api/v1/...`.
4. Jalankan FE di `http://localhost:3000` (backend staging menerima login operator hanya dari origin itu; lihat bagian 3).
5. Cek: `GET /api/v1/health` harus `{"data":{"status":"ok"}}`, lalu `GET /api/v1/hospitals?dataset=simulation&limit=3`.

Dokumentasi interaktif staging memakai UI Scalar di `<STAGING_API_URL>/docs`. Karena staging terkunci, buka lewat akun Vercel milik backend, atau lihat `openapi.yaml` di repo.

## 2. Environment

| | Staging (pakai ini sekarang) | Production |
|---|---|---|
| Branch | `develop` | `main` |
| URL | URL staging di atas (tetap sama; setiap push `develop` men-deploy ulang) | `https://siagars-backend.vercel.app` |
| Versi API | 0.2.0 | 0.1.0 (belum ada endpoint/field 0.2) |
| Database | `siagars_dev` | `siagars` |
| Akses | Terkunci Vercel Authentication; perlu header bypass dari server FE | Publik |
| Data | 30 RS simulasi + 516 RS nyata Jabodetabek (SATUSEHAT sandbox) | Belum disinkron ke 0.2 |

Aturan: **jangan** menaruh secret bypass di kode browser, di repo, atau di variabel `NEXT_PUBLIC_*`. Header bypass hanya dipasang oleh route handler server.

## 3. Login operator di staging

- Alur: `POST /auth/login` -> cookie `siagars_session` (HttpOnly, dikelola browser) -> `GET /auth/csrf` bila perlu token baru -> semua mutasi (`POST`/`PATCH`) wajib header `X-CSRF-Token` dan `Origin`.
- Backend memeriksa `Origin` sama persis dengan `PUBLIC_ORIGIN`. Nilainya sekarang `http://localhost:3000`. Bila FE jalan di port/alamat lain atau di-deploy, **kabari Akmal** supaya diubah; tanpa itu login dan semua mutasi gagal `403 invalid_origin`.
- Akun uji hanya punya akses ke **RS Simulasi Siaga 01** (`10000000-0000-4000-8000-000000000001`). Mencoba RS lain -> `403`.
- Batas percobaan login: 5 gagal per 15 menit per kombinasi IP+email -> `429` (`Retry-After: 60`). Saat mengembangkan form login, jangan menekan submit berulang dengan password salah.
- Sesi berlaku 8 jam. `401` berarti sesi habis atau tidak ada: arahkan ke halaman login.

## 4. Peta endpoint (19 operasi, prefix `/api/v1`)

**Publik**

| Endpoint | Dipakai untuk |
|---|---|
| `GET /health`, `GET /ready` | Pemeriksaan hidup/siap |
| `GET /services` | Master layanan (`icu`, `nicu`, `picu`, `igd-24h`, `ambulance`, `rawat-inap`) untuk filter |
| `GET /regions` **(baru)** | Dropdown provinsi -> kota; `code` dipakai apa adanya untuk filter |
| `GET /hospitals` | Daftar + filter + pagination + peta |
| `GET /hospitals/suggest` **(baru)** | Autocomplete kotak cari |
| `GET /hospitals/{id}` | Detail RS |
| `GET /hospitals/compare?ids=a,b[,c]` | Perbandingan 2-3 RS |
| `POST /referrals/lookup` | Lacak rujukan sintetis (demo: `SR-DEMO-001`) |

**Auth operator**: `POST /auth/login`, `GET /auth/me`, `GET /auth/csrf`, `POST /auth/logout`.

**Operator (perlu sesi)**

| Endpoint | Dipakai untuk |
|---|---|
| `GET /admin/hospitals` **(baru)** | RS yang dikelola operator |
| `GET /admin/hospitals/{id}` **(baru)** | Detail + `version` terbaru sebelum mengubah |
| `GET /admin/referrals`, `PATCH /admin/referrals/{id}/status` | Daftar dan ubah status rujukan |
| `PATCH /admin/hospitals/{id}/services/{slug}`, `.../beds/{category}` | Ubah layanan / bed |

Format umum: JSON `snake_case`, waktu RFC3339 UTC. Sukses `{data, meta?}`; galat `{error:{code,message}, request_id}`. Sertakan `request_id` saat melaporkan bug ke backend.

## 5. Objek `Hospital` (versi 0.2)

Dipakai di list, detail, compare, dan tujuan lookup. Field baru ditandai **baru**; tidak ada field lama yang berubah atau dihapus.

```jsonc
{
  "id": "813e16c6-fd09-481d-821e-124f2e62ad5f",     // UUID lokal
  "external_id": "1004673817",                       // baru: kode SATUSEHAT; null untuk simulasi
  "source_namespace": "satusehat:msi:sandbox",       // baru
  "name": "...", "address": "...", "phone": null,
  "city_code": "3216", "city_name": "...", "province_code": "32", "province_name": "...",
  "latitude": -6.2, "longitude": 106.8, "distance_km": null,
  "facility_class": { "code": "B", "name": "Kelas B" },       // baru; atau null
  "facility_subtype": { "code": "10402", "name": "Rumah Sakit Khusus" }, // baru; atau null
  "operational": true,                               // baru; true/false/null
  "bpjs": null, "bpjs_source_url": null, "bpjs_source_updated_at": null,  // baru: sumber BPJS
  "facility_summary": {                              // baru: pakai ini untuk badge & filter
    "icu": "unknown", "nicu": "unknown", "picu": "unknown", "rawat_inap": "unknown",
    "bpjs": null,
    "inpatient_beds": { "total": null, "available": null, "freshness": "unknown" },
    "last_source_updated_at": null
  },
  "data_origin": "satusehat_sandbox", "freshness": "unknown",
  "services": [], "beds": []
}
```

### Aturan tampilan yang wajib diikuti

1. **`unknown`/`null` artinya belum diketahui, bukan "tidak ada".** Tampilkan "Belum diketahui" atau abu-abu; jangan merah/"tidak tersedia". Bed `0` adalah angka nyata (penuh), beda dari `null`.
2. **RS nyata dari SATUSEHAT belum punya data ICU/NICU/PICU/bed/rawat inap/BPJS.** Sumbernya memang tidak menyediakan. Di staging, semua RS nyata akan menampilkan `unknown`. Ini bukan bug. Data terisi hanya bila backend sudah mengkurasi dari sumber bertanggal.
3. **Data lengkap untuk membangun UI ada di RS simulasi**: pakai `dataset=simulation` (atau `all`). Tampilkan label "Simulasi" bila `data_origin == "simulation"`; jangan sajikan sebagai fakta RS nyata.
4. **Kesegaran data** (`freshness`): `fresh` < 1 jam, `aging` 1-24 jam, `stale` > 24 jam, `unknown` bila tidak ada tanggal sumber. Terpisah dari asal data dan verifikasi.
5. `facility_class.name` bisa `null`; tampilkan `code` (mis. "Kelas B" -> "B").
6. **Rawat inap** = layanan `rawat-inap` dan bed kategori `general`. `facility_summary.inpatient_beds` sudah merangkumnya.
7. `distance_km` adalah jarak garis lurus (Haversine), bukan estimasi waktu tempuh, dan bukan ukuran kualitas klinis. Hanya terisi bila `lat`/`lng` dikirim.

## 6. Resep untuk layar yang sering dibutuhkan

**Daftar + filter**
`GET /hospitals?dataset=all&province_code=32&city_code=3216&services=icu,rawat-inap&bpjs=true&has_available_beds=true&sort=distance&lat=-6.2&lng=106.8&page=1&limit=20`
- `services` berlaku **AND**; hanya layanan `available`/`limited` yang cocok.
- `limit` default 20, maks 50. Parameter yang tidak dikenal, kosong, atau berulang -> `422`.
- `dataset`: `real` (default, tanpa simulasi), `simulation`, `all`.
- Hasil nol RS nyata yang cocok filter layanan itu **normal** (datanya belum ada); sarankan `dataset=all`.

**Dropdown wilayah**: panggil `GET /regions` sekali, simpan. Pakai `code` persis; kode seed (`31.71`) dan SATUSEHAT (`3171`) adalah wilayah berbeda, jangan diformat ulang atau disamakan.

**Autocomplete**: `GET /hospitals/suggest?q=rumah%20sakit&limit=8&dataset=all` (debounce 250-300 ms; `q` wajib, maks 100 karakter). Hasilnya ringkas; ambil detail lewat `id` atau `external_id`.

**Compare**: `GET /hospitals/compare?ids=<id1>,<id2>[,<id3>]`.
- Tiap ID boleh UUID (`id`) **atau** `external_id`; campuran boleh. 2-3 ID unik.
- Dua ID yang menunjuk RS sama -> `422`. Salah satu tidak ditemukan -> `404` untuk seluruh request (tidak ada hasil parsial).
- Jangan kirim parameter lain (termasuk `dataset`).

**Detail**: `GET /hospitals/{id}` menerima UUID atau `external_id`. Link ke halaman detail disarankan memakai `id` (UUID) karena stabil.

**Dashboard operator**: login -> `GET /admin/hospitals` -> pilih RS -> `GET /admin/hospitals/{id}` untuk `version`. Update layanan/bed dikirim dengan `version` terakhir; bentrok -> `409`, muat ulang lalu ulangi.

**Status rujukan (state machine)**: `submitted -> verified -> searching -> confirmed -> completed`; `verified`/`searching` -> `rejected`; `confirmed -> searching` wajib `public_note` (alasan pengalihan); `completed` dan `rejected` terminal. Tombol aksi di UI hanya menampilkan transisi yang sah.

## 7. Penanganan galat

| Status | `error.code` | Tindakan FE |
|---|---|---|
| 400 | `invalid_json` | Bug FE (body rusak / field tak dikenal) |
| 401 | `unauthorized`, `invalid_credentials` | Ke halaman login / pesan "email atau password salah" |
| 403 | `invalid_origin`, `invalid_csrf`, `forbidden` | Cek `Origin`, ambil CSRF baru, atau RS di luar scope |
| 404 | `not_found` | RS/rujukan tidak ada |
| 409 | `conflict` | Versi usang atau transisi tidak sah; muat ulang |
| 413 | `body_too_large` | Body > 64 KB |
| 422 | `validation_error` | Tampilkan `message` |
| 429 | `rate_limited` | Hormati `Retry-After` |
| 5xx | `internal_error`, `not_ready` | Pesan umum + `request_id` |

Pesan galat login sengaja sama untuk "email tidak ada" dan "password salah"; jangan membedakan di UI.

## 8. Batasan yang diketahui (v0.2)

- Staging memakai `PUBLIC_ORIGIN=http://localhost:3000`; FE di origin lain butuh perubahan konfigurasi dari backend.
- Rate limit per instance server (Vercel serverless): angkanya bisa lebih longgar dari tertulis, jangan dijadikan jaminan.
- Peta memakai data halaman list aktif; belum ada endpoint bounding box/radius.
- Belum ada endpoint membuat rujukan publik (di luar scope V0.1; rujukan hanya demo sintetis). Tidak ada data pasien, NIK, atau diagnosis.
- Data ICU/NICU/PICU/bed/BPJS RS nyata kosong sampai dikurasi.
- Pencarian `q` melipat huruf besar-kecil hanya untuk ASCII. `q` berawalan `$` adalah teks biasa.
- Production (0.1.0) belum punya endpoint/field 0.2; jangan mengarahkan FE ke production sebelum rilis.

## 9. Checklist integrasi Arya

- [ ] Secret bypass + akun uji sudah diterima dan disimpan di `.env.local` (tidak di-commit).
- [ ] Proxy `app/api/v1/[...path]/route.ts` berjalan; `GET /api/v1/health` sukses dari browser.
- [ ] Daftar RS: filter wilayah memakai `GET /regions`; `unknown` tampil sebagai "Belum diketahui".
- [ ] Badge ICU/NICU/PICU/Rawat Inap/BPJS membaca `facility_summary`.
- [ ] Compare memakai `id` atau `external_id`; menangani `404` dan `422`.
- [ ] Autocomplete memakai `/hospitals/suggest` dengan debounce.
- [ ] Login operator, `/admin/hospitals`, update layanan/bed dengan `version` dan penanganan `409`.
- [ ] Label "Simulasi" tampil untuk `data_origin: "simulation"`.
- [ ] Kabari Akmal: origin FE yang dipakai (untuk `PUBLIC_ORIGIN`) dan temuan bug beserta `request_id`.

## 10. Kontak dan alur kerja

- Backend: Akmal Bariq Yonanda. Perubahan kontrak (endpoint, enum, makna `null`) harus lewat backend dan akan tercatat di [`CHANGELOG.md`](CHANGELOG.md) dengan kenaikan versi.
- Setiap perubahan backend yang di-push ke `develop` otomatis tampil di staging; cek `CHANGELOG.md` dan `info.version` di `/docs/openapi.json` untuk melihat versi yang sedang berjalan.
- Rilis ke production dilakukan backend setelah database production dimigrasi; FE akan diberi tahu.
