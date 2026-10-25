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
cp .env.example .env.local   # opsional; bawaan = backend production
npm run dev                  # http://localhost:3000
```

Buka lewat `http://localhost:3000` persis: backend staging hanya menerima login
dan mutasi operator dari origin itu.

Perintah lain: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.

> Catatan versi: proyek memakai Next.js 16.4.3 dengan `cacheComponents` dan
> `partialPrefetching` aktif. Baca `node_modules/next/dist/docs/` (lihat
> `AGENTS.md`) sebelum mengubah pola data/caching.

### Environment & API

Pekerjaan berjalan di branch **`develop`**. Frontend memakai **backend
production** `https://siagars-backend.vercel.app` (API 0.2.1, publik) di semua
lingkungan: lokal, Preview, dan Production Vercel. Rujukan backend:
`HANDOVER_PRODUCTION_v0.2.1` dari backend, `HANDOVER_v0.2.md`, dan
`CHANGELOG_API.md` (salinan changelog backend). Serah terima FE → BE:
`handover.md`.

- `next.config.ts` me-*rewrite* `/api/v1/*` ke `API_BASE_URL` (server-only;
  bawaan `https://siagars-backend.vercel.app`). Browser tetap same-origin
  sehingga cookie sesi operator (`Path=/api/v1`) bekerja dan backend tidak perlu
  CORS. Tidak ada header bypass di kode mana pun.
- Pindah backend cukup dengan mengganti `API_BASE_URL` (lokal: `.env.local`;
  Vercel: env per lingkungan) lalu redeploy. Staging backend terkunci Vercel
  Authentication sehingga **tidak** bisa dipakai lewat rewrite ini.
- Login operator production hanya diterima dari origin
  `https://frontend-siagars.vercel.app` (`PUBLIC_ORIGIN` backend). Dari
  `http://localhost:3000` login/mutasi ditolak `403`; bagian publik tetap jalan.
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
| `/` | Beranda: pencarian, pencarian cepat, CTA lacak rujukan, cakupan data aktual |
| `/rumah-sakit` | Pencarian + filter + daftar & peta; semua filter tersimpan di URL |
| `/rumah-sakit/[id]` | Detail: BPJS, tempat tidur, layanan; sumber & waktu per informasi |
| `/lacak-rujukan` | Lookup kode via POST body (tidak di URL/storage) + timeline demo |
| `/cek-bpjs` | **Simulasi** cek kepesertaan BPJS (NIK, nama, tgl lahir via POST body; kontrak diusulkan di `handover-bpjs.md`, menunggu backend) |
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
