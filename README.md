# SiagaRS — Frontend

Frontend Next.js (App Router, TypeScript, Tailwind v4) untuk **SiagaRS**: membantu
keluarga pasien mencari rumah sakit berdasarkan fasilitas yang *dinyatakan*
tersedia, memeriksa sumber dan umur informasinya, menghubungi RS, dan melihat
progres rujukan **simulasi**. Subtema: Public Service Tracking.

> **Prototipe.** Data pilot terbatas, bukan layanan resmi gawat darurat.
> Baseline: PRD v0.1 (23 Oktober 2026). Tim MalasNgoding.

Sumber acuan: `PRD.md` dan `AGENTS.md` (instruksi agen) serta
`template-web/DESIGN.md` untuk token visual.

## Menjalankan

```bash
npm install
cp .env.example .env.local   # wajib: isi VERCEL_AUTOMATION_BYPASS_SECRET
npm run dev                  # http://localhost:3000
```

Buka lewat `http://localhost:3000` persis: backend staging hanya menerima login
dan mutasi operator dari origin itu.

Perintah lain: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.

> Catatan versi: proyek memakai Next.js 16.4.3 dengan `cacheComponents` dan
> `partialPrefetching` aktif. Baca `node_modules/next/dist/docs/` (lihat
> `AGENTS.md`) sebelum mengubah pola data/caching.

### Environment & API

Pekerjaan berjalan di branch **`develop`**, yang juga menjadi **production
branch** di Vercel (setiap push `develop` langsung ter-deploy ke Production).
Frontend memakai backend **staging v0.2.1** di semua lingkungan, karena backend
production masih 0.1.0. Rujukan backend: `HANDOVER_v0.2.md` dan
`CHANGELOG_API.md` (salinan changelog backend).

| | Lokal | Vercel (Preview & Production) |
|---|---|---|
| Branch FE | `develop` | `develop` → Production |
| `API_PROXY_TARGET` | URL staging (lihat `.env.example`) | URL staging |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | wajib (dari tim backend) | wajib (env Secret di Vercel) |
| Versi API | 0.2.1 | 0.2.1 |

Backend production (`https://siagars-backend.vercel.app`, 0.1.0) **jangan**
dipakai sampai backend merilis 0.2; ganti `API_PROXY_TARGET` (dan kosongkan
secret) di env Production Vercel saat rilis itu tiba.

- `/api/v1/*` ditangani route handler `app/api/v1/[...path]/route.ts`: proxy
  server-only yang menambahkan header bypass staging. Browser tetap same-origin
  sehingga cookie sesi operator bekerja, dan secret tidak pernah sampai ke browser.
- `API_PROXY_TARGET` wajib diisi; bila kosong proxy membalas
  `proxy_not_configured` (tidak ada fallback diam-diam ke production).
- Backend hanya menerima `Origin` yang sama dengan `PUBLIC_ORIGIN` miliknya
  (staging: `http://localhost:3000`). Origin lain → login/mutasi `403 invalid_origin`.
- Dataset bawaan UI adalah `real` (sama dengan bawaan API). Sejak API 0.2.1,
  RS nyata di staging membawa **data fasilitas/BPJS contoh** (bukan fakta):
  `facility_summary.data_origin`/`bpjs_data_origin` = `"simulation"`. UI selalu
  memberi label "Simulasi" pada nilai itu dan menampilkan pemberitahuan data
  simulasi (`hasSimulatedData` di `lib/hospitals/summary.ts`).
- Status backend dapat dicek di `/status` (`GET /health`, `GET /ready`).

### Deploy ke Vercel

Project Vercel: `artax-sora/frontend-siagars`, terhubung ke repo GitHub. Push ke
`develop` = deploy Production otomatis; deploy manual: `vercel deploy --prod`
(`.vercelignore` mencegah `.env.local` ikut terunggah). Login operator di domain
Vercel baru berfungsi setelah tim backend menambahkan origin domain itu ke
`PUBLIC_ORIGIN` staging.

### Kode demo

- Kode pelacakan demo: `SR-DEMO-001` (sesuai panduan integrasi).
- Operator: login dengan **email** + kata sandi dari tim backend.

## Halaman

| Rute | Isi |
|---|---|
| `/` | Beranda: pencarian, pencarian cepat, CTA lacak rujukan, cakupan data aktual |
| `/rumah-sakit` | Pencarian + filter + daftar & peta; semua filter tersimpan di URL |
| `/rumah-sakit/[id]` | Detail: BPJS, tempat tidur, layanan; sumber & waktu per informasi |
| `/lacak-rujukan` | Lookup kode via POST body (tidak di URL/storage) + timeline demo |
| `/bandingkan` | Perbandingan 2–3 RS (`GET /hospitals/compare`) |
| `/tentang-data` | Cakupan pilot, asal data, arti waktu, batas kesegaran, jarak |
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

`lib/contracts/types.ts` mengikuti OpenAPI staging **v0.2.1**
(`<staging>/docs/openapi.json`) dan `HANDOVER_v0.2.md`. OpenAPI menang bila
berbeda. `API_FRONTEND.md` di repo ini masih panduan v0.1.

## Struktur

```
app/                  rute (App Router)
components/ui/        primitif UI: badge, tombol, state, field, pagination
features/hospitals/   pencarian, kartu, filter, detail, peta (tanpa library)
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
