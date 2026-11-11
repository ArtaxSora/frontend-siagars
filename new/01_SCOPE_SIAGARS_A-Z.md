# 01 — Scope SiagaRS A–Z (Versi Baru)

| | |
|---|---|
| Versi dokumen | 1.0 · 26 Okt 2026 |
| Owner | Radja Admiral (PM) |
| Reviewer | Akmal Bariq Yonanda (BE), M. Tauriq Arya (FE) |
| Status | Berlaku. Perubahan scope hanya lewat PM + catatan di [04_RISIKO_DAN_KEPUTUSAN.md](04_RISIKO_DAN_KEPUTUSAN.md) |

---

## A. Visi & positioning

**Tagline:** *"Putuskan rumah sakit yang tepat dengan data yang jujur."*

**Visi:** Keluarga pasien di Indonesia dapat memilih rumah sakit berdasarkan **kebutuhan layanan**, bukan sekadar jarak — dan selalu tahu **seberapa yakin** mereka boleh pada informasi yang dilihat.

**Positioning:** SiagaRS adalah **alat pendukung keputusan berbasis data** untuk memilih RS. Ia **bukan** layanan gawat darurat, bukan sistem rujukan resmi, dan tidak berafiliasi dengan Kemenkes/BPJS Kesehatan.

## B. Masalah & hipotesis

| # | Masalah (hipotesis — belum divalidasi wawancara) | Bukti yang direncanakan |
|---|---|---|
| P1 | Informasi fasilitas RS tersebar di banyak situs, format berbeda | Riset solusi sejenis (PM-11) |
| P2 | RS terdekat belum tentu punya layanan yang dibutuhkan (ICU/NICU/PICU) | Data `/wawasan` kesenjangan layanan (FE-20/BE-20) |
| P3 | Umur & kepastian informasi tidak jelas, sehingga keluarga ragu | Skor kualitas data (BE-11) |
| P4 | Keluarga tidak tahu cara membandingkan pilihan secara cepat | Usability test 5 user (PM-50) |

**Validasi:** usability test 5 orang (target 4/5 menemukan RS cocok < 60 detik). Sebelum ada hasil, semua klaim ditulis sebagai **hipotesis/target**.

## C. Sub-tema: Data-Driven Decision Support

| Fitur | Bagaimana mendukung keputusan berbasis data |
|---|---|
| Asisten Pilih RS | Mengubah kebutuhan pengguna → ranking RS dengan skor terukur & dapat dijelaskan |
| Bandingkan | Menunjukkan pemenang per atribut + alasan |
| Wawasan Data | Agregasi: cakupan RS, kesenjangan layanan per kota, kesegaran data |
| Skor Kualitas Data | Memberi tahu seberapa bisa dipercaya data tiap RS |
| Provenance per nilai (sudah ada) | Setiap angka punya sumber, waktu, dan asal |
| Lacak rujukan & cek BPJS (simulasi) | Fitur pendukung: transparansi proses layanan publik |

## D. Persona

| Persona | Kebutuhan | Fitur utama |
|---|---|---|
| **Rina** (32, ibu, Bekasi) — bayi lahir prematur, perlu RS dengan NICU & menerima BPJS | Cepat tahu RS mana yang cocok & bisa ditelepon | Asisten Pilih RS → Detail → Telepon |
| **Pak Budi** (keluarga pasien lansia) — membandingkan 2–3 RS untuk rawat inap | Perbandingan jelas | Bandingkan |
| **Operator RS** (demo) | Memperbarui status layanan/bed & status rujukan | Panel operator |
| **Pengamat publik / juri / jurnalis data** | Melihat gambaran sistem kesehatan wilayah | Wawasan Data |

## E. Prinsip produk (tidak boleh dilanggar)

1. **Setiap nilai bersumber** — asal (`curated`/`simulation`/`satusehat_sandbox`), URL sumber bila ada, waktu.
2. **Umur data terlihat** — kesegaran fresh/aging/stale/unknown, waktu WIB.
3. **"Belum diketahui" ≠ 0** — null tidak pernah ditampilkan atau dihitung sebagai nol.
4. **Simulasi selalu dilabeli** — label "Simulasi" + border dashed amber; skor rekomendasi memberi penalti untuk data simulasi/unknown.
5. **Skor harus dapat dijelaskan** — tidak ada "kotak hitam"; setiap skor punya rincian komponen.
6. **Jarak = garis lurus**, bukan ETA, bukan ukuran kualitas klinis.
7. **Privasi** — tidak menyimpan NIK mentah; tidak ada data pasien nyata.
8. **Bukan layanan darurat** — CTA 112 selalu terlihat di footer & halaman rekomendasi.

## F. Fitur inti baru (pilar Decision Support)

### F1. Asisten Pilih RS — `/pilih-rs` (v0.4.0)
- Wizard 3 langkah, semua state di URL (bisa dibagikan, tombol back browser aman):
  1. **Butuh layanan apa?** — chip: ICU, NICU, PICU, IGD 24 jam, Ambulans, Rawat inap (multi-pilih, min 1).
  2. **Di mana?** — "Gunakan lokasi saya" (opsional, dibulatkan 3 desimal) **atau** pilih provinsi/kota; radius 5/10/20/50 km (hanya jika lokasi).
  3. **Preferensi** — Wajib menerima BPJS? (Ya/Tidak penting), sertakan data simulasi? (default: ya, berlabel).
- Hasil: maks. 10 RS, diurutkan skor 0–100 dengan tingkat **Tinggi (≥75) / Sedang (50–74) / Rendah (<50)**, rincian komponen (layanan, bed, jarak, BPJS, kepastian data), daftar "yang belum diketahui", tombol **Telepon**, **Rute**, **Detail**, **Bandingkan**.
- Algoritma: [03_KONTRAK_API_v1.md §4](03_KONTRAK_API_v1.md#4-algoritma-skor-rekomendasi).

### F2. Bandingkan berbasis keputusan — `/bandingkan` (v0.4.0)
- Tetap 2–3 RS; setiap baris memberi tanda **unggul** (mis. bed ICU tersedia terbanyak, data paling segar). Nilai null tidak pernah menang.
- Ringkasan di atas tabel: "RS A unggul di 4 dari 7 atribut yang Anda butuhkan."
- Masuk ke navigasi utama.

### F3. Wawasan Data — `/wawasan` (v0.5.0)
- KPI: total RS, % RS dengan data layanan terverifikasi/kurasi, % data segar.
- Grafik: jumlah RS per kota (bar), kesenjangan layanan per kota (tabel/heat — kota tanpa layanan X yang tercatat tersedia), distribusi kesegaran per asal data (stacked bar), rasio nyata vs simulasi.
- Setiap grafik menyebut sumber & waktu agregasi; filter provinsi.

### F4. Skor Kualitas Data (v0.4.0)
- Per RS: skor 0–100 + label **Baik / Cukup / Terbatas** dari kelengkapan, kesegaran, dan asal data. Tampil di kartu, detail, bandingkan, rekomendasi.

## G. Fitur pendukung (dipertahankan & dirapikan)

| Fitur | Route | Perubahan versi baru |
|---|---|---|
| Cari & filter RS + peta | `/rumah-sakit` | Peta memakai endpoint marker ringan (v0.4); badge kualitas data |
| Detail RS | `/rumah-sakit/[id]` | SSR + metadata OG untuk dibagikan; tombol bagikan (v0.5) |
| Lacak rujukan (simulasi) | `/lacak-rujukan` | Tetap |
| Cek BPJS (simulasi) | `/cek-bpjs` | Live di production; **tidak menyimpan NIK mentah** (v0.3.1) |
| Tentang data | `/tentang-data` | Metodologi skor & kualitas data (v0.5) |
| Status sistem | `/status` | Tetap |
| Operator | `/operator/{login,rujukan,layanan,riwayat-bpjs}` | Riwayat BPJS tersamar (v0.5); nama RS tanpa N+1 (v0.3.1) |

## H. Out of scope (tegas)

Diagnosis, triase, rekam medis, data pasien nyata, booking/antrian, pembayaran, klaim BPJS, **cek BPJS nyata**, rujukan resmi/produksi, ETA atau pelacakan ambulans live, kualitas klinis RS, rating/ulasan pengguna, aplikasi mobile native (sebelum v2.0).

## I. Strategi data

| Lapisan | Sumber | Label | Rencana |
|---|---|---|---|
| Identitas RS | SATUSEHAT MSI Sandbox (Jabodetabek, 516 RS) | `satusehat_sandbox` | Tetap; sync manual; pasca-lomba → akses resmi |
| Fasilitas (layanan/bed/BPJS) RS nyata | Kurasi manual dari situs resmi RS/dinkes | `curated` + `source_url` + tanggal | **30–50 RS, ≥10 profil lengkap** (v0.5, PM-20 + BE-21) |
| Fasilitas sisanya | `dummy-facilities` | `simulation` | Diregenerasi harian oleh cron (BE-05) agar demo jujur & tidak stale |
| Demo | Seed 30 RS simulasi, rujukan `SR-DEMO-*`, peserta BPJS NIK `9999…` | `simulation` | Tetap |
| Wilayah | Kode Kemendagri tanpa titik (format MSI) | — | Unifikasi (BE-03) |

## J. Kebutuhan non-fungsional

| Kategori | Target |
|---|---|
| Performa | p95 ≤ 500 ms endpoint publik (warm); LCP ≤ 2,5 s di 4G; Lighthouse Perf & A11y ≥ 90 di `/` dan `/rumah-sakit/[id]` |
| Aksesibilitas | WCAG 2.1 AA; keyboard penuh; status tidak hanya warna |
| Responsif | 360 / 768 / 1440 px tanpa scroll horizontal |
| Browser | Chrome, Edge, Firefox terbaru (syarat lomba) + Safari iOS (best effort) |
| Keamanan | Session HttpOnly, CSRF, Origin allowlist, rate limit **bersama** (bukan per instance) di v0.6, audit transaksional, tanpa secret di git |
| Privasi | Tidak ada NIK mentah tersimpan; log diredaksi; mengikuti semangat UU PDP |
| Ketersediaan | Uptime demo ≥ 99% pada 11 Nov & 28 Nov; fallback offline (video/screenshot) |
| Bahasa | UI Bahasa Indonesia; waktu WIB |

## K. Sitemap final (v1.0)

```
/                      Landing (CTA utama: "Bantu saya pilih RS")
├── /pilih-rs           Asisten Pilih RS (wizard + hasil)          [BARU]
├── /rumah-sakit        Cari & filter + peta
│   └── /[id]           Detail RS
├── /bandingkan         Bandingkan 2–3 RS                          [di nav]
├── /wawasan            Dashboard Wawasan Data                     [BARU]
├── /lacak-rujukan      Lacak rujukan (simulasi)
├── /cek-bpjs           Cek BPJS (simulasi)
├── /tentang-data       Metodologi & sumber
├── /status             Status sistem (footer)
└── /operator
    ├── /login
    ├── /rujukan
    ├── /layanan
    └── /riwayat-bpjs                                              [BARU]
```
Navigasi utama: **Pilih RS · Cari RS · Bandingkan · Wawasan · Lacak Rujukan · Cek BPJS · Tentang Data**.

## L. Metrik keberhasilan

| Metrik | Target | Diukur oleh |
|---|---|---|
| Waktu menemukan RS cocok (usability) | 4/5 peserta < 60 detik | PM-50 |
| Task success Asisten Pilih RS | ≥ 80% | PM-50 |
| RS dengan data kurasi | ≥ 30 (≥ 10 lengkap) | PM-20 / BE-21 |
| Bug kritis saat demo | 0 | PM-31, X-50 |
| E2E alur kritis lulus di CI | 6/6 | X-30 |

## M. Tim & peran

| Orang | Peran | Tanggung jawab utama |
|---|---|---|
| **Radja Admiral** | PM / Ketua / QA / Docs / Pitch | Scope, prioritas, kontrak lintas tim, QA manual, kurasi sumber data, dokumen lomba, video & pitch |
| **Akmal Bariq Yonanda** | Backend | API Go, MongoDB, migrasi, algoritma skor & insight, data pipeline, deploy BE, keamanan |
| **M. Tauriq Arya** | Frontend | Next.js, UI/UX, design system, integrasi API, E2E UI, deploy FE, aksesibilitas |

RACI lengkap: [02_ROADMAP_PHASE_VERSI.md §8](02_ROADMAP_PHASE_VERSI.md#8-matriks-raci).

## N. Alur kerja Git

- Branch: `main` (production) ← `develop` (staging) ← `feat/<ID>-<slug>` / `fix/<ID>-<slug>` / `docs/<slug>`.
- Setiap PR menyebut ID tiket (mis. `BE-10`), lolos CI, minimal 1 review (FE↔BE saling review untuk perubahan kontrak; PM untuk copy/UX).
- Commit: Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- Rilis: merge `develop` → `main`, tag `vX.Y.Z` di **kedua** repo, release notes di CHANGELOG.

## O. Konvensi versi

- **SemVer produk tunggal**: versi FE = versi BE = `info.version` OpenAPI.
- MINOR naik untuk fitur (v0.4.0), PATCH untuk perbaikan (v0.4.1). v1.0.0 = Final Submission.
- FE `package.json.version` wajib sama dengan tag.

## P. Definition of Ready (tiket siap dikerjakan)

Ada ID & owner, acceptance criteria (Given/When/Then), dependensi jelas, kontrak API (bila ada) sudah tertulis di `03_KONTRAK_API_v1.md`, desain/copy disetujui PM untuk tiket UI.

## Q. Definition of Done

Kode merged ke `develop`; CI hijau; test baru untuk perilaku baru; OpenAPI/types/CHANGELOG diperbarui bila kontrak berubah; diuji di staging; label simulasi & null benar; tidak ada regresi a11y; catatan handover di PR (perilaku, file, check yang dijalankan, keterbatasan).

## R. Lingkungan

| Env | FE | BE | DB |
|---|---|---|---|
| Local | `localhost:3000` | `localhost:8080` | `siagars_dev` / lokal |
| Staging | Vercel Preview (`develop`) | `siagars-backend-git-develop-…vercel.app` (Vercel Auth + bypass) | `siagars_dev` |
| Production | `frontend-siagars.vercel.app` | `siagars-backend.vercel.app` | `siagars` |

## S. Deliverable lomba

| Deliverable | Tanggal | Owner |
|---|---|---|
| First Draft: repo publik + README, PDF ≤10 hal `WIA_FSDMIA2026_NamaTim` | 1 Nov | PM (PM-10) |
| Final: proposal ≤30 hal, surat orisinalitas bermaterai, video YouTube ≤5 mnt, situs online | 11 Nov | PM (PM-40) |
| Final onsite: deck ≤15 slide, demo live + cadangan offline | 28 Nov | PM (PM-51) + semua |

## T. Komunikasi & ritme

- **Daily async** (Discord/WA) 09.00: kemarin / hari ini / blocker + ID tiket.
- **Sync 30 menit** setiap Senin, Rabu, Jumat 20.00.
- **Go/No-Go** sebelum setiap rilis production (PM memutuskan).
- Perubahan kontrak API diumumkan di kanal tim + PR ke `03_KONTRAK_API_v1.md`.

## U–Z. Glosarium

| Istilah | Arti |
|---|---|
| Provenance | Asal, sumber URL, dan waktu sebuah nilai |
| Freshness | fresh < 1 jam, aging 1–24 jam, stale > 24 jam, unknown (null/masa depan) — dari `source_updated_at` |
| Data origin | `curated`, `simulation`, `satusehat_sandbox`, `satusehat_production` |
| Skor kecocokan | 0–100, seberapa cocok RS dengan kebutuhan pengguna |
| Skor kualitas data | 0–100, seberapa lengkap/segar/terpercaya data RS |
| MSI | Master Sarana Index SATUSEHAT |
| DDDS | Data-Driven Decision Support |
| HO | Hari-orang (satuan estimasi) |
