# AGENTS.md — SiagaRS Frontend (v1)

Instruksi untuk developer & coding agent di repo `frontend-siagars`. Berlaku sejak 26 Okt 2026. **Baca dulu:** `new/PRD.md`, `new/02_ROADMAP_PHASE_VERSI.md` (cari tiket `FE-xx` Anda), `new/03_KONTRAK_API_v1.md`.

## Next.js 16 — wajib
Ini **bukan** Next.js yang Anda kenal dari data latih. Sebelum menulis kode yang menyentuh API Next (routing, `cacheComponents`, `proxy.ts`, metadata, fetch server), baca panduan di `node_modules/next/dist/docs/` dan patuhi deprecation notice. Blok aturan Next.js di `AGENTS.md` root ditulis ulang oleh `next dev` — jangan dihapus.

## Mandat & kepemilikan
- FE: **M. Tauriq Arya**. BE: Akmal Bariq Yonanda. PM/approver scope & copy: Radja Admiral.
- Kerjakan hanya tiket dengan owner **FE** atau **X** (bagian UI). Perubahan di luar tiket → tanya PM.
- Sub-tema: **Data-Driven Decision Support**. Fitur utama: `/pilih-rs`, skor & kualitas data, bandingkan berbasis keputusan, `/wawasan`.

## Struktur kode
- `app/` → halaman tipis (server component) yang merender komponen dari `features/<domain>/`.
- `features/{home,hospitals,recommendations,insights,referrals,bpjs,operator,system}` → komponen fitur (client bila perlu).
- `components/ui/*` → primitive bersama (badge, button, field, notices, states, pagination, icons); `components/charts/*` → grafik SVG.
- `lib/api/{client,endpoints,backend}.ts` → satu-satunya jalur HTTP. Jangan `fetch` langsung ke backend dari komponen.
- `lib/contracts/{types,labels}.ts` → tipe DTO (mengikuti OpenAPI versi yang sama) & label Bahasa Indonesia untuk setiap enum.
- `lib/{format,geo,hospitals,hooks,bpjs}` → fungsi murni yang **wajib** punya unit test.
- Import antar file `lib/` yang diuji memakai path relatif `.ts` (test runner `node --experimental-strip-types`).

## Kontrak API
- Prefix `/api/v1`, di-rewrite ke `API_BASE_URL` oleh `next.config.ts`.
- Jangan menebak bentuk respons. Bila kontrak belum ada di `new/03_KONTRAK_API_v1.md`/OpenAPI → minta BE (tiket X).
- Sebelum endpoint live, bangun terhadap contoh di `backend/docs/fixtures.json` (aturan anti-blokir).
- FE **tidak** menghitung skor rekomendasi/kualitas data; tampilkan apa adanya dari BE. Pengecualian: penanda "unggul" di `/bandingkan`.
- Tangani: 401 (operator → navigasi penuh ke login), 409 (muat ulang data), 422 (pesan per field), 429 (`Retry-After` countdown), 5xx (ErrorState + `request_id`).

## Aturan UI keras (jangan dilanggar)
1. Status = ikon + teks + warna, tidak pernah warna saja.
2. Data simulasi → label "Simulasi" + border dashed amber (`OriginBadge`, `SimulatedTag`, `hasSimulatedData()`).
3. `null` → "Belum diketahui" (abu); `0` → "0 tersedia (nol menurut sumber)".
4. Waktu selalu WIB (`lib/format/time.ts`); jarak "± x,x km (garis lurus)", tidak pernah ETA.
5. Setiap skor punya penjelasan yang bisa dibuka; tampilkan banner 112 di hasil rekomendasi.
6. Pakai token warna `@theme`; jangan hardcode hex.
7. Mobile-first; target sentuh ≥ 44 px; fokus terlihat; `prefers-reduced-motion`; semua grafik punya tabel alternatif.
8. Semua copy Bahasa Indonesia; label enum dari `labels.ts`.

## Privasi & keamanan
- Tidak ada secret dengan prefix `NEXT_PUBLIC_`. `VERCEL_AUTOMATION_BYPASS_SECRET` hanya server (`proxy.ts`).
- Input BPJS (NIK/nama/tgl lahir) **tidak** boleh masuk URL, localStorage, analytics, atau `console.log`; bersihkan form setelah hasil.
- Kode tracking rujukan dikirim di body POST, tidak di URL.
- Geolocation hanya setelah klik pengguna; bulatkan 3 desimal.
- Jangan pernah membuat UI "reveal" data BPJS.

## Perintah
```bash
npm run dev         # localhost:3000
npm run lint
npm run typecheck
npm run test        # unit (node:test)
npm run build
npx playwright test # E2E (setelah X-30)
```
Semua harus lulus sebelum PR. Laporkan bila ada yang tidak bisa dijalankan.

## Git & rilis
- Branch: `feat/FE-xx-slug`, `fix/FE-xx-slug` dari `develop`; PR ke `develop`; judul PR memuat ID tiket.
- Conventional Commits. Rilis: `develop` → `main`, tag `vX.Y.Z` **sama dengan BE**, `package.json.version` disamakan.
- Jangan deploy production, mengubah env Vercel, atau push ke `main` tanpa persetujuan PM (Go/No-Go).

## Definition of Done (FE)
Lint/typecheck/test/build hijau · unit test untuk logika baru · state loading/kosong/error/simulasi/unknown ditangani · keyboard & screen reader dicek · 360/768/1440 dicek · tipe sesuai OpenAPI · PR berisi: perilaku berubah, file, screenshot mobile+desktop, check yang dijalankan, keterbatasan.

## Dokumen
Sumber kebenaran: folder `new/`. Dokumen lama (`API_FRONTEND.md`, `handover*.md`, `HANDOVER_*.md`, `CHANGELOG_API.md`) dipindah ke `docs/archive/` di tiket FE-01 dan tidak lagi diikuti.
