# PRD Frontend — SiagaRS v1 (`frontend-siagars`)

| | |
|---|---|
| Versi dokumen | 1.0 · 26 Okt 2026 |
| Owner | M. Tauriq Arya (FE) |
| Approver | Radja Admiral (PM) |
| Menggantikan | README "Baseline PRD v0.1", `API_FRONTEND.md`, `handover*.md`, `HANDOVER_*.md` (menjadi arsip) |
| Acuan bersama | [01_SCOPE](01_SCOPE_SIAGARS_A-Z.md) · [02_ROADMAP](02_ROADMAP_PHASE_VERSI.md) · [03_KONTRAK_API](03_KONTRAK_API_v1.md) |

> Catatan path: di repo `frontend-siagars`, dokumen bersama berada di folder `new/` yang sama dengan file ini.

## 1. Ringkasan

Frontend SiagaRS adalah web app Next.js yang membantu keluarga pasien **memutuskan RS yang tepat** (sub-tema Data-Driven Decision Support). Tugas FE: menyajikan rekomendasi, perbandingan, dan wawasan data dengan **jujur** (sumber, umur, kepastian, label simulasi) dan **mudah** (mobile-first, aksesibel, Bahasa Indonesia).

## 2. Tujuan & metrik FE

| Tujuan | Metrik |
|---|---|
| Pengguna menemukan RS cocok dengan cepat | 4/5 peserta usability < 60 detik lewat `/pilih-rs` |
| Fungsionalitas terbukti | 6/6 E2E alur kritis hijau di CI |
| Aksesibel & responsif | 0 pelanggaran axe kritis; 360/768/1440 tanpa scroll horizontal; Chrome/Edge/Firefox |
| Cepat | Lighthouse Perf & A11y ≥ 90 di `/` dan `/rumah-sakit/[id]` |

## 3. Stack & arsitektur (tetap)

- Next.js **16.4.3** App Router (`cacheComponents`, `proxy.ts`), React **19.3**, TypeScript strict, Tailwind v4 (`@theme` di `app/globals.css`), Plus Jakarta Sans.
- Tanpa lib UI/state; peta tile Mercator custom (`lib/geo`, `features/hospitals/map`).
- `app/` = halaman tipis; logika di `features/<domain>/`; util murni di `lib/`.
- Semua panggilan API lewat `lib/api/client.ts` → rewrite `/api/v1/*` ke `API_BASE_URL`.
- Data client-side via `useApiResource`; **baru:** halaman detail RS fetch di server untuk metadata/OG (FE-21).

## 4. Fitur & acceptance criteria

### 4.1 Asisten Pilih RS — `/pilih-rs` (v0.4.0 · FE-10, FE-11)

**User story:** Sebagai keluarga pasien, saya ingin menyebutkan kebutuhan layanan & lokasi agar mendapat daftar RS yang paling cocok beserta alasannya.

- **Langkah 1 – Layanan:** chip multi-pilih dari `GET /services`; tombol Lanjut nonaktif sampai ≥ 1 dipilih.
- **Langkah 2 – Lokasi:** tombol "Gunakan lokasi saya" (izin hanya saat diklik; koordinat dibulatkan 3 desimal) + pilihan radius 5/10/20/50 km; **atau** provinsi → kota dari `GET /regions`.
- **Langkah 3 – Preferensi:** BPJS (Wajib / Tidak penting), dataset (default nyata; opsi sertakan simulasi).
- State tiap langkah di URL (`/pilih-rs?step=2&services=nicu&...`); tombol back browser kembali ke langkah sebelumnya.
- **Hasil** (`GET /recommendations`):
  - Kartu per RS: nama, kota, **skor 0–100 + level** (Tinggi/Sedang/Rendah; ikon + teks + warna), jarak "± x,x km (garis lurus)", `DataQualityBadge`, label Simulasi bila `flags` memuat `contains_simulated_data`.
  - "Kenapa skor ini?" (expand) → daftar `components` (label, kontribusi, `reason`) + daftar `unknowns` sebagai "Belum diketahui".
  - CTA: **Telepon** (`tel:`), **Rute** (Google Maps), **Detail**, **+ Bandingkan** (maks 3, lanjut ke `/bandingkan`).
  - `meta.excluded` ditampilkan ringkas: "3 RS tidak ditampilkan karena NICU tercatat tidak tersedia."
  - Banner tetap: "Darurat? Hubungi **112**. Skor ini tentang kecocokan kebutuhan & kepastian data, bukan kualitas medis."
- **State:** loading skeleton, kosong (saran perluas radius/hapus syarat BPJS), error dengan `request_id` + coba lagi, 422 → kembali ke langkah terkait dengan pesan.

```
Given pengguna memilih NICU, lokasi Bekasi radius 20 km, BPJS wajib
When  ia menekan "Lihat rekomendasi"
Then  tampil ≤ 10 RS terurut skor, masing-masing dengan level, jarak, rincian skor, dan label simulasi bila ada
And   URL hasil dapat dibuka ulang di tab baru dengan hasil yang sama
```

### 4.2 Kualitas Data — `DataQualityBadge` (v0.4.0 · FE-12)
- Label Baik/Cukup/Terbatas + skor; tooltip/popover menjelaskan kelengkapan, kesegaran, asal; tautan ke `/tentang-data#kualitas-data`.
- Tampil di kartu cari, detail, bandingkan, rekomendasi.

### 4.3 Bandingkan berbasis keputusan — `/bandingkan` (v0.4.0 · FE-13)
- Logika `lib/hospitals/compare-winner.ts` (fungsi murni + unit test): per baris tentukan nilai terbaik (status: available > limited > unavailable; bed: available terbesar; data: freshness terbaik; BPJS: true). **Null/unknown tidak pernah unggul**; seri → semua ditandai.
- Tanda "Unggul" = ikon + teks, bukan warna saja. Ringkasan: "RS A unggul di 4 dari 7 atribut."
- Masuk nav utama.

### 4.4 Landing baru — `/` (v0.4.0 · FE-14)
- Hero: "Putuskan rumah sakit yang tepat dengan data yang jujur." CTA utama **"Bantu saya pilih RS"** → `/pilih-rs`; CTA sekunder pencarian nama.
- Seksi: Cara kerja skor (3 langkah), Cakupan data (live dari `/insights/summary` sejak v0.5; sebelumnya `/hospitals?limit=1`), prinsip "Cara membaca informasi", tautan Wawasan.

### 4.5 Peta markers (v0.4.0 P1 · FE-15)
- Map memanggil `GET /hospitals/markers?bbox=` saat pan/zoom selesai (debounce 400 ms, abort sebelumnya); marker dibedakan `match` (ikon + teks di popup). `truncated=true` → pesan "Perbesar peta untuk melihat semua RS".

### 4.6 Wawasan Data — `/wawasan` (v0.5.0 · FE-20)
- KPI kartu (summary), bar jumlah RS per kota (coverage), tabel kesenjangan per layanan (pilih layanan; `gap` ditandai ikon + teks), stacked bar kesegaran per asal.
- Filter provinsi; setiap grafik punya judul, sumber, `generated_at` (WIB), dan **tabel data alternatif** (aksesibilitas).
- SVG ringan buatan sendiri (`components/charts/*`), warna dari token.
- Catatan wajib: "Kesenjangan = tidak ada RS yang **tercatat** tersedia di data kami."

### 4.7 Detail RS SSR + Bagikan (v0.5.0 · FE-21)
- `generateMetadata` mengambil `GET /hospitals/{id}` di server (judul, deskripsi, OG); konten interaktif tetap client.
- Tombol Bagikan: `navigator.share` bila ada, fallback salin tautan + toast `aria-live`.

### 4.8 Cek BPJS (v0.3.1 · FE-02)
- Terhubung ke `POST /bpjs/check` production. Copy: "Simulasi — bukan BPJS Kesehatan. Kami tidak menyimpan NIK lengkap Anda; riwayat tersamar disimpan 30 hari."
- Form dibersihkan setelah hasil; input tidak pernah masuk URL/localStorage/log.

### 4.9 Operator (v0.3.1–v0.5.0 · FE-05, FE-22)
- Daftar rujukan memakai `hospital_name` (hapus N+1).
- `/operator/riwayat-bpjs`: tabel tersamar (NIK/nama tersamar, tahun lahir, hasil, waktu WIB), paginasi; **tidak ada** tombol reveal.

### 4.10 Halaman lain
- `/tentang-data` (FE-01, FE-23): hapus "Versi 0.1"; seksi metodologi skor rekomendasi & kualitas data (rumus dari kontrak §4–§5, bahasa awam).
- `/rumah-sakit`, `/lacak-rujukan`, `/status`: tetap; tambah badge kualitas data.

## 5. Sitemap & navigasi
Lihat [01_SCOPE §K](01_SCOPE_SIAGARS_A-Z.md#k-sitemap-final-v10). Nav utama: Pilih RS · Cari RS · Bandingkan · Wawasan · Lacak Rujukan · Cek BPJS · Tentang Data. Footer: Status, 112, disclaimer, Operator.

## 6. Design system "Civic Transparency" (didokumentasikan ulang)

Token di `app/globals.css` (`@theme`) — **jangan hardcode warna**.

| Kelompok | Token | Pakai untuk |
|---|---|---|
| Permukaan | `canvas #f8fafc`, `surface #fff`, `well #f1f5f9`, `line #e2e8f0`, `line-strong` | Latar, kartu, garis |
| Teks | `ink #0f172a`, `muted #475569`, `faint #64748b` | Teks utama/sekunder |
| Brand | `brand #0d7a75`, `brand-deep`, `brand-tint` | CTA utama, fokus |
| Trust | `trust #1e40af`, `trust-action`, `trust-wash` | Tautan, info |
| Status | `ok-*`, `warn-*`, `bad-*`, `unk-*` (fg/bg/line) | Status layanan, level skor (high=ok, medium=warn, low=bad) |
| Asal data | `kurasi-*` (sky), `sim-*` (amber, **border dashed**), `sandbox-*` (indigo) | `OriginBadge` |
| Kesegaran | `fresh`, `aging`, `stale`, `unknown-dot` | `FreshnessLabel` |
| Bayangan | `shadow-level2`, `shadow-level3` | Kartu, popover |

**Komponen baru:** `ScoreBadge`, `ScoreBreakdown`, `DataQualityBadge`, `WizardStepper`, `WinnerMark`, `charts/{BarChart,StackedBar,KpiCard,DataTable}`, `ShareButton`, `EmergencyBanner`.

**Aturan keras:** status = ikon + teks + warna · simulasi = label "Simulasi" + border dashed amber · null = "Belum diketahui" (abu), 0 = "0 tersedia (nol menurut sumber)" · waktu WIB · jarak "garis lurus" · target sentuh 44 px mobile · fokus ring 3 px teal · `prefers-reduced-motion`.

## 7. Kontrak yang dikonsumsi

Semua endpoint di [03_KONTRAK_API §2](03_KONTRAK_API_v1.md#2-daftar-endpoint-v10) kecuali `/internal/*`. Baru untuk FE: `/recommendations`, `/hospitals/markers`, `/insights/*`, `data_quality`, `hospital_name`. Dihapus: pemanggilan reveal (tidak pernah dibuat di FE — pastikan tidak ditambahkan).

## 8. Test plan

| Lapisan | Alat | Cakupan |
|---|---|---|
| Unit | `node:test` (`tests/unit`) | parser URL wizard, `compare-winner`, format skor/level, mapping data quality, validasi bbox |
| E2E UI | **Playwright** (`tests/e2e`, baru di X-30) | 6 alur kritis (lihat Roadmap §4), viewport 360 & 1440, Chromium + Firefox |
| A11y | `@axe-core/playwright` di E2E + manual keyboard/screen reader | semua halaman publik |
| Visual/manual | Checklist PM-31 | 3 breakpoint × 3 browser |

CI (`.github/workflows/ci.yml`): `npm ci` → `lint` → `typecheck` → `test` → `build` → E2E (terhadap staging, opsional di PR, wajib sebelum rilis).

## 9. Rilis & deploy
- Vercel project `frontend-siagars`; `develop` → Preview, `main` → Production.
- `package.json.version` = tag rilis (v0.3.1, v0.4.0, …). Tag & release notes di setiap rilis.
- Env: `API_BASE_URL` (server), `VERCEL_AUTOMATION_BYPASS_SECRET` (server, staging saja), `NEXT_PUBLIC_API_BASE_PATH`, `NEXT_PUBLIC_TILE_URL`, `NEXT_PUBLIC_TILE_ATTRIBUTION`. Tidak ada secret dengan prefix `NEXT_PUBLIC_`.

## 10. Tiket FE (ringkas; detail di Roadmap)

| Versi | Tiket |
|---|---|
| v0.3.1 | FE-01, FE-02, FE-03, FE-04, FE-05 |
| v0.4.0 | FE-10, FE-11, FE-12, FE-13, FE-14, FE-15 |
| v0.5.0 | FE-20, FE-21, FE-22, FE-23 |
| v0.6.0 | FE-30, FE-31, FE-32, X-30 (UI) |
| v1.0.0 | FE-40 |
| v1.1.0 | FE-50, FE-51 |

## 11. Pertanyaan terbuka
1. Apakah `/pilih-rs` menjadi halaman default dari tombol "Cari" di header mobile? (usul: ya, sejak v0.4) — PM putuskan 28 Okt.
2. Bila FE-15 tidak selesai di v0.4, peta tetap memakai halaman hasil (`/hospitals`) — diterima.
