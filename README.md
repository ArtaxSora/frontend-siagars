# SiagaRS — Frontend

Frontend Next.js (App Router, TypeScript, Tailwind v4) untuk **SiagaRS**: membantu
keluarga pasien **memutuskan rumah sakit yang tepat** dengan data fasilitas yang
transparan — setiap angka punya sumber, umur, dan tingkat kepastian.
Sub-tema: **Data-Driven Decision Support**.

> **Prototipe.** Data pilot terbatas, bukan layanan gawat darurat — darurat: **112**.
> Versi **0.4.0** (Decision Core), dirilis berpasangan dengan backend dengan tag
> `vX.Y.Z` yang sama. Tim MalasNgoding.

Sumber acuan: folder [`new/`](new/README.md) — [PRD FE](new/PRD.md),
[aturan kerja](new/AGENTS.md), [roadmap & tiket](new/02_ROADMAP_PHASE_VERSI.md),
[kontrak API v1](new/03_KONTRAK_API_v1.md). Dokumen lama ada di
[`docs/archive/`](docs/archive/README.md) dan tidak lagi diikuti.

## Menjalankan

```bash
npm install
cp .env.example .env.local   # opsional; bawaan = backend production
npm run dev                  # http://localhost:3000
```

Buka lewat `http://localhost:3000` persis: login dan mutasi operator hanya
diterima dari origin yang terdaftar di backend (`PUBLIC_ORIGIN`).

Perintah lain: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.
Keempatnya dijalankan CI (`.github/workflows/ci.yml`) di setiap push & PR.

> Catatan versi: proyek memakai Next.js 16.4.3 dengan `cacheComponents` dan
> `partialPrefetching` aktif. Baca `node_modules/next/dist/docs/` (lihat
> `AGENTS.md`) sebelum mengubah pola data/caching.

### Environment & API

Pekerjaan berjalan di branch **`develop`**. Vercel (Preview dan Production)
memakai **backend production** `https://siagars-backend.vercel.app` (publik);
lokal bisa memilih production atau staging lewat `.env.local`. Kontrak yang
diikuti: API **0.4.0** (`new/03_KONTRAK_API_v1.md`), yang sudah live di
production: `GET /recommendations`, `GET /hospitals/markers`, `data_quality` di
DTO Hospital, `hospital_name` di daftar rujukan operator, dan `error.details`.

- `next.config.ts` me-*rewrite* `/api/v1/*` ke `API_BASE_URL` (server-only;
  bawaan `https://siagars-backend.vercel.app`). Browser tetap same-origin
  sehingga cookie sesi operator (`Path=/api/v1`) bekerja dan backend tidak perlu
  CORS.
- Pindah backend cukup dengan mengganti `API_BASE_URL` (lokal: `.env.local`,
  lalu restart dev server; Vercel: env per lingkungan, lalu redeploy). Halaman
  `/status` menampilkan backend yang dipakai: **Production** atau **Staging**.
- Staging terkunci Vercel Authentication: isi juga
  `VERCEL_AUTOMATION_BYPASS_SECRET`. `proxy.ts` lalu me-rewrite `/api/v1` ke
  staging dengan header bypass (server-only). Untuk production header ini
  tidak pernah dipasang, walaupun secret masih terisi.
- Login operator hanya diterima dari origin yang terdaftar di `PUBLIC_ORIGIN`
  backend (`https://frontend-siagars.vercel.app`; per 25 Okt 2026 juga
  `http://localhost:3000`). Origin lain → `403 invalid_origin`.
- Dataset bawaan UI adalah `real` (sama dengan bawaan API). Sejak API 0.2.1,
  RS nyata membawa **data fasilitas/BPJS contoh** (bukan fakta):
  `facility_summary.data_origin`/`bpjs_data_origin` = `"simulation"`. UI selalu
  memberi label "Simulasi" pada nilai itu dan menampilkan pemberitahuan data
  simulasi (`hasSimulatedData` di `lib/hospitals/summary.ts`).
- Status backend dapat dicek di `/status` (`GET /health`, `GET /ready`).

### Deploy ke Vercel

Project Vercel: `artax-sora/frontend-siagars` (https://frontend-siagars.vercel.app),
terhubung ke repo GitHub. Push memicu deploy otomatis sesuai *Production Branch*
di pengaturan Vercel; deploy manual ke Production: `vercel deploy --prod`
(`.vercelignore` mencegah `.env.local` ikut terunggah). Login operator di domain
Vercel baru berfungsi setelah tim backend menambahkan origin domain itu ke
`PUBLIC_ORIGIN` backend.

### Kode demo

- Kode pelacakan demo: `SR-DEMO-001` (sesuai panduan integrasi).
- Operator: login dengan **email** + kata sandi dari tim backend.

## Halaman

| Rute | Isi |
|---|---|
| `/` | Beranda: CTA "Bantu saya pilih RS", cara kerja skor, cari nama, cakupan data, cara membaca informasi |
| `/pilih-rs` | Asisten 3 langkah (layanan → lokasi → preferensi) → rekomendasi ber-skor 0–100 dengan rincian "Kenapa skor ini?", daftar yang belum diketahui, banner 112. Semua langkah di URL (`?step=2&services=nicu…`) |
| `/rumah-sakit` | Pencarian + filter + daftar & peta; peta memuat semua RS di area tampilan (`/hospitals/markers`); semua filter tersimpan di URL |
| `/rumah-sakit/[id]` | Detail: kualitas data, BPJS, tempat tidur, layanan; sumber & waktu per informasi |
| `/lacak-rujukan` | Lookup kode via POST body (tidak di URL/storage) + timeline demo |
| `/cek-bpjs` | **Simulasi** cek kepesertaan BPJS (NIK, nama, tgl lahir via POST body; tidak disimpan di peramban, server hanya menyimpan riwayat tersamar 30 hari) |
| `/bandingkan` | Perbandingan 2–3 RS berbasis keputusan: penanda "Unggul" per baris + ringkasan (`lib/hospitals/compare-winner.ts`) |
| `/tentang-data` | Cakupan pilot, asal data, arti waktu, batas kesegaran, metodologi skor rekomendasi & kualitas data, jarak |
| `/status` | Status server API & database (`/health`, `/ready`) |
| `/operator/login`, `/operator/rujukan`, `/operator/layanan` | Panel operator minimum |

`/bandingkan?ids=a,b[,c]` membandingkan 2–3 RS; tiap ID boleh UUID atau `external_id` (pilih lewat kotak "Bandingkan" di kartu hasil).

## Aturan penting yang dijaga kode

- `available = null` → **Belum diketahui**; `available = 0` → nol menurut sumber.
  Keduanya tidak pernah tertukar (`lib/format/beds.ts`, ada tes).
- `services` memakai logika **AND**; perubahan filter mengembalikan `page` ke 1;
  satu serializer (`lib/hospitals/query.ts`) dipakai URL dan permintaan API.
- Kode pelacakan hanya di memori komponen dan body POST; input tanpa atribut
  `name` agar tidak bocor ke URL bila JS belum aktif.
- Cookie sesi operator HttpOnly dari Go; CSRF token di memori, dikirim sebagai
  `X-CSRF-Token`. Tidak ada retry otomatis untuk mutasi; 409 → muat ulang &
  tinjau; 401 → kembali ke login; 403 → pesan tidak berwenang.
- Jarak = garis lurus (bukan ETA). Label simulasi selalu terlihat. Bed kosong
  bukan jaminan pasien diterima.
- Peta dimuat lazy hanya di client, dibungkus error boundary; daftar tetap
  berfungsi bila peta/tile gagal. Marker hanya untuk halaman hasil aktif.

## Kontrak API

`lib/contracts/types.ts` mengikuti API **0.3.1** sesuai
[`new/03_KONTRAK_API_v1.md`](new/03_KONTRAK_API_v1.md) dan OpenAPI backend versi
yang sama; OpenAPI menang bila berbeda. Kontrak belum ada → minta backend, jangan
menebak. FE **tidak** menghitung skor rekomendasi atau kualitas data — hanya
menampilkan; satu-satunya penilaian FE adalah penanda "Unggul" di `/bandingkan`.

## Struktur

```
app/                  rute (App Router)
components/ui/        primitif UI: badge, skor/kualitas data, tombol, state, field, pagination
features/recommendations/  wizard /pilih-rs, kartu skor, rincian skor
features/hospitals/   pencarian, kartu, filter, detail, bandingkan, peta (tanpa library)
features/referrals/   lookup + timeline
features/operator/    shell, login, rujukan, layanan
lib/contracts/        DTO & label terpusat
lib/api/              fetch wrapper tunggal + endpoint bertipe
tests/unit/           node:test
```

Repo ini memakai `app/` di root (bukan `src/app` seperti target PRD) karena
proyek awal sudah begitu; alias `@/*` menunjuk ke root.

## Catatan teknis

- Peta memakai implementasi Web Mercator sendiri (tile gambar + marker tombol)
  sebagai ganti Leaflet, agar tidak menambah dependency yang belum dapat
  dipasang/diuji. Dapat diganti Leaflet nanti; antarmuka komponen `HospitalMap`
  sudah terisolasi. Tile default `tile.openstreetmap.org` **hanya untuk
  pengembangan/demo ringan** — pilih penyedia sesuai kebijakan untuk produksi
  (`NEXT_PUBLIC_TILE_URL`, `NEXT_PUBLIC_TILE_ATTRIBUTION`).
- Tes unit memakai `node:test` + `--experimental-strip-types` (tanpa dependency
  baru). Berkas di `lib/` yang diuji memakai impor relatif berekstensi `.ts`.
- E2E (Playwright) **belum** disiapkan; lihat daftar alur kritis di PRD §8.
