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
cp .env.example .env.local   # opsional
npm run dev                  # http://localhost:3000
```

Perintah lain: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.

> Catatan versi: proyek memakai Next.js 16.4.3 dengan `cacheComponents` dan
> `partialPrefetching` aktif. Baca `node_modules/next/dist/docs/` (lihat
> `AGENTS.md`) sebelum mengubah pola data/caching.

### API online

Frontend memakai backend online `https://siagars-backend.vercel.app`
(dokumentasi: `/docs`, OpenAPI: `/docs/openapi.json`). Tidak ada lagi mock.

- `next.config.ts` meneruskan (rewrite) `/api/v1/*` ke backend, sehingga browser
  tetap same-origin dan cookie sesi (`Path=/api/v1`) bekerja. Ganti target lewat
  `API_PROXY_TARGET` (server-only).
- **Penting:** backend hanya menerima `Origin` yang sama dengan `PUBLIC_ORIGIN`
  miliknya. Origin frontend yang dipakai (mis. `http://localhost:3000`) harus
  didaftarkan di backend, kalau tidak login dan mutasi ditolak.
- Dataset bawaan UI adalah `simulation` (RS fiktif demo), berbeda dari bawaan API
  (`real`). Ubah di `DEFAULT_DATASET` (`lib/hospitals/query.ts`) bila perlu.

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
| `/operator/login`, `/operator/rujukan`, `/operator/layanan` | Panel operator minimum |

`/bandingkan?ids=a,b[,c]` membandingkan 2–3 RS (pilih lewat kotak "Bandingkan" di kartu hasil).

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

`lib/contracts/types.ts` mengikuti *SiagaRS API v0.1 — Panduan Integrasi
Frontend*. Berkas ini ditulis tanpa bisa mengakses backend dari lingkungan
pengembangan, jadi **cocokkan dengan `/docs/openapi.json`** — OpenAPI menang bila
berbeda. Hal yang perlu dicek: nama field provenance, kode wilayah (diteruskan
apa adanya dari respons), dan batas `limit`.

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
