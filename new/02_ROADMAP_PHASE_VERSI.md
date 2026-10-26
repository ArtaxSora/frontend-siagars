# 02 — Roadmap, Phase & Versi (dengan Pembagian Pengerjaan)

| | |
|---|---|
| Versi dokumen | 1.0 · 26 Okt 2026 |
| Owner | Radja Admiral (PM) |
| Aturan | Setiap tiket punya **owner tunggal**. Prefix ID = pemilik pekerjaan |

## Legenda owner

| Prefix | Owner | PIC |
|---|---|---|
| `BE-xx` | **Backend** | Akmal Bariq Yonanda |
| `FE-xx` | **Frontend** | M. Tauriq Arya |
| `PM-xx` | **PM / QA / Docs / Pitch** | Radja Admiral |
| `X-xx` | **Bersama** (BE + FE, difasilitasi PM) | Disebut per tiket |

Estimasi dalam **HO** (hari-orang). Prioritas: **P0** wajib untuk versi tsb, **P1** sebaiknya, **P2** bila sempat.

## 0. Gambaran besar

```
26 Okt ── v0.3.1 ── 28 Okt ── v0.4.0 ── 31 Okt │1 Nov FIRST DRAFT│ 2 Nov ── v0.5.0 ── 6 Nov │mentor 3–6, feedback 7│
  Stabilisasi          Decision Core                        Insights & Data
7 Nov ── v0.6.0 ── 10 Nov │11 Nov v1.0.0 FINAL SUBMISSION│ 12 Nov ── v1.1.0 ── 28 Nov │FINAL ONSITE│ Des+ v1.2 → v2.0
  Hardening                                                   Onsite Prep                   Produk pasca-lomba
```

| Phase | Versi | Tanggal (2026) | Tema | Gate |
|---|---|---|---|---|
| 0 | **v0.3.1** | 26–28 Okt | Stabilisasi fondasi | Prod 0.3.1 live, CI hijau di 2 repo, kontrak v0.4 dibekukan |
| 1 | **v0.4.0** | 28–31 Okt | Decision Core | `/pilih-rs` jalan end-to-end di prod 31 Okt |
| — | v0.4.0 | **1 Nov** | **First Draft** | PDF + repo publik terkirim |
| 2 | **v0.5.0** | 2–6 Nov | Insights & Data Nyata | `/wawasan` live, ≥30 RS kurasi |
| 3 | **v0.6.0** | 7–10 Nov | Hardening + Feedback | E2E 6/6 hijau, a11y & responsif lulus |
| — | **v1.0.0** | **11 Nov** | **Final Submission** | Tag, proposal, video terkirim |
| 4 | **v1.1.0** | 12–28 Nov | Onsite Prep & Validasi | Usability test selesai, dry-run demo lulus |
| 5 | v1.2 → v2.0 | Des 2026+ | Produk | — |

---

## 1. Phase 0 — v0.3.1 "Stabilisasi" (26–28 Okt)

**Tujuan:** fondasi bersih & jujur sebelum fitur baru: BPJS tanpa NIK mentah di production, data tidak stale, CI, dokumen tunggal.

| ID | Judul | Owner | P | Est | Depends | Definition of Done |
|---|---|---|---|---|---|---|
| BE-01 | BPJS tanpa NIK mentah: migrasi `006_bpjs_no_raw` (`$unset raw_enc`, update validator), hapus `POST /admin/bpjs-checks/{id}/reveal`, `BPJS_HISTORY_KEY` hanya untuk HMAC | **BE** | P0 | 0,5 | — | Endpoint reveal 404; dokumen lama tak punya `raw_enc`; test BPJS lulus; OpenAPI 0.3.1 |
| BE-02 | Rilis 0.3.1 ke production (migrasi 005+006, seed peserta sintetis, env prod) + smoke test | **BE** | P0 | 0,5 | BE-01, BE-06 | `/bpjs/check` 200 di prod; smoke 32+15 cek lulus |
| BE-03 | Unifikasi kode wilayah ke format MSI tanpa titik (migrasi `007_region_codes` + update seed) | **BE** | P0 | 1 | — | `/regions` tanpa nama kota ganda; filter kota tetap benar |
| BE-04 | CI GitHub Actions: `gofmt -l`, `go vet`, `go test ./...`, `go test -race` (ubuntu) | **BE** | P0 | 0,5 | — | Workflow hijau di PR |
| BE-05 | Regenerasi data simulasi harian: Vercel Cron → `POST /internal/jobs/refresh-simulation` (header secret), tidak menyentuh data `curated` | **BE** | P0 | 1 | — | Data simulasi `fresh` setiap pagi; endpoint 401 tanpa secret |
| BE-06 | Perbaikan kontrak: enum `bpjs_data_origin` = `DataOrigin \| null`, `csrf_token` optional, format error seragam | **BE** | P0 | 0,25 | — | OpenAPI & fixtures diperbarui |
| BE-07 | Bersihkan docs BE: dokumen lama → `docs/archive/`, `backend/PRD.md` ditandai *superseded* → `new/PRD.md`, README versi benar | **BE** | P1 | 0,25 | — | Tidak ada dokumen aktif yang bertentangan |
| BE-08 | Tambah `hospital_name` di DTO `GET /admin/referrals` | **BE** | P1 | 0,25 | — | FE tidak perlu N+1 |
| FE-01 | Sinkron versi & docs FE: `package.json` 0.3.1, `/tentang-data` tanpa "Versi 0.1", handover lama → `docs/archive/`, hapus aset bawaan `public/` | **FE** | P0 | 0,5 | — | Tidak ada referensi "v0.1" aktif |
| FE-02 | `/cek-bpjs` live terhadap 0.3.1 + copy privasi baru ("tidak menyimpan NIK lengkap") | **FE** | P0 | 0,5 | BE-02 | Alur sukses/tidak terdaftar/429 berjalan di prod |
| FE-03 | CI GitHub Actions: lint, typecheck, test, build | **FE** | P0 | 0,5 | — | Workflow hijau di PR |
| FE-04 | Quick fixes: `NOTE_MAX` 500, `/bandingkan` di nav, `.env.example` rapi | **FE** | P1 | 0,25 | — | — |
| FE-05 | Operator pakai `hospital_name` (hapus `use-hospital-names` N+1) | **FE** | P1 | 0,25 | BE-08 | 1 request untuk daftar rujukan |
| X-01 | **Bekukan kontrak v0.4** (`03_KONTRAK_API_v1.md` §3–§5): BE tulis OpenAPI draft, FE review tipe | **BE+FE** (PM approve) | P0 | 0,5 | — | PR kontrak di-merge 28 Okt; FE generate `types.ts` dari draft |
| PM-01 | Repo publik: scan secret (gitleaks) di riwayat git kedua repo, rotasi kredensial bila bocor, putuskan publikasi 2 repo | **PM** (+BE rotasi) | P0 | 0,5 | — | Laporan scan bersih; repo siap publik |
| PM-02 | Kirim pertanyaan A1/A3/A4/A6 ke panitia | **PM** | P0 | 0,1 | — | Email/WA terkirim, jawaban dicatat |
| PM-03 | Kickoff dokumen `new/` ke tim + buat board tiket (GitHub Projects) | **PM** | P0 | 0,25 | — | Semua tiket di board |

**Gate v0.3.1 (28 Okt):** BE-01/02/03/05 + FE-01/02/03 + X-01 selesai.

---

## 2. Phase 1 — v0.4.0 "Decision Core" (28–31 Okt)

**Tujuan:** pilar sub-tema hidup: rekomendasi ber-skor + kualitas data + compare berbasis keputusan + landing baru. Siap untuk screenshot First Draft.

| ID | Judul | Owner | P | Est | Depends | Definition of Done |
|---|---|---|---|---|---|---|
| BE-10 | `GET /recommendations` + paket `internal/service/recommend` (fungsi murni scoring, test tabel ≥ 15 kasus) | **BE** | P0 | 2 | X-01 | Sesuai kontrak §4; p95 ≤ 500 ms; test lulus |
| BE-11 | `data_quality` pada DTO Hospital (list, detail, compare, rekomendasi) | **BE** | P0 | 0,75 | X-01 | Sesuai kontrak §5 |
| BE-12 | `GET /hospitals/markers?bbox=` (marker ringan ≤ 500) + index `{dataset, lat, lng}` (migrasi `008_geo_insights_indexes`) | **BE** | P1 | 1 | X-01 | Peta seluruh viewport tanpa paginasi |
| BE-13 | Rilis 0.4.0: staging 30 Okt, production 31 Okt; OpenAPI, CHANGELOG, fixtures | **BE** | P0 | 0,25 | BE-10/11 | Tag `v0.4.0` |
| FE-10 | Wizard `/pilih-rs` (3 langkah, state di URL, a11y, mobile-first) | **FE** | P0 | 1,5 | X-01 | Bisa diselesaikan keyboard-only; URL dapat dibagikan |
| FE-11 | Hasil rekomendasi: kartu skor, level, rincian komponen, daftar "belum diketahui", CTA Telepon/Rute/Detail/Bandingkan, banner 112 | **FE** | P0 | 1,5 | BE-10 | Sesuai PRD FE §4.1 |
| FE-12 | Komponen `DataQualityBadge` di kartu, detail, compare | **FE** | P0 | 0,5 | BE-11 | — |
| FE-13 | Compare berbasis keputusan: tanda unggul per baris + ringkasan | **FE** | P0 | 1 | — | Null tidak pernah unggul; unit test logika pemenang |
| FE-14 | Landing baru (CTA utama "Bantu saya pilih RS", narasi sub-tema, cakupan data) | **FE** | P0 | 0,75 | — | Screenshot siap PDF |
| FE-15 | Peta memakai `/hospitals/markers` | **FE** | P1 | 0,75 | BE-12 | — |
| PM-10 | **First Draft**: PDF ≤ 10 hal (konsep, sitemap, wireframe, fitur, screenshot landing + `/pilih-rs`), README repo publik, submit | **PM** | P0 | 1,5 | FE-14, FE-10 | Terkirim ≤ 1 Nov |
| PM-11 | Riset 3–5 solusi sejenis (orisinalitas) | **PM** | P1 | 0,5 | — | Tabel pembanding di PDF |
| X-10 | Demo run di staging 30 Okt → Go/No-Go production 31 Okt | **BE+FE** (PM pimpin) | P0 | 0,25 | semua P0 | Skenario "Rina" lulus |

**Gate v0.4.0 (31 Okt):** skenario Rina — buka landing → Pilih RS (NICU + BPJS, Bekasi) → hasil ber-skor → detail → telepon — berhasil di production.

---

## 3. Phase 2 — v0.5.0 "Insights & Data Nyata" (2–6 Nov)

**Tujuan:** konten kuat (20%) & orisinalitas: dashboard wawasan + data kurasi nyata; detail RS bisa dibagikan.

| ID | Judul | Owner | P | Est | Depends | Definition of Done |
|---|---|---|---|---|---|---|
| BE-20 | `GET /insights/summary`, `/insights/coverage`, `/insights/service-gaps`, `/insights/freshness` (aggregation pipeline, cache 5 menit) | **BE** | P0 | 2 | — | Sesuai kontrak §6 |
| BE-21 | Terapkan data kurasi (`curate --apply`) batch per hari | **BE** | P0 | 0,5 | PM-20 | ≥ 30 RS `curated` di prod |
| BE-22 | Audit log untuk `curate` & job refresh | **BE** | P1 | 0,5 | — | Entri `audit_logs` per eksekusi |
| BE-23 | Pastikan `GET /admin/bpjs-checks` hanya tersamar + paginasi | **BE** | P1 | 0,25 | BE-01 | — |
| FE-20 | `/wawasan`: KPI, bar per kota, tabel kesenjangan, stacked kesegaran (SVG ringan, tanpa lib berat), filter provinsi | **FE** | P0 | 2 | BE-20 | Grafik punya teks alternatif/tabel |
| FE-21 | SSR + `generateMetadata` (OG) untuk `/rumah-sakit/[id]`, tombol Bagikan (Web Share + salin tautan) | **FE** | P0 | 1 | — | Pratinjau link di WA menampilkan nama RS |
| FE-22 | `/operator/riwayat-bpjs` (tersamar, tanpa reveal) | **FE** | P1 | 0,5 | BE-23 | — |
| FE-23 | `/tentang-data`: metodologi skor rekomendasi & kualitas data | **FE** (copy: PM) | P0 | 0,5 | — | — |
| PM-20 | Kumpulkan & verifikasi sumber 30–50 RS (situs resmi RS/dinkes), isi template CSV kurasi | **PM** | P0 | 2 | — | CSV valid `curate` dry-run |
| PM-21 | Siapkan materi mentor review (3–6 Nov) | **PM** | P1 | 0,25 | — | — |
| X-20 | Rilis 0.5.0 (6 Nov) | **BE+FE** | P0 | 0,25 | P0 di atas | Tag `v0.5.0` kedua repo |

---

## 4. Phase 3 — v0.6.0 "Hardening & Feedback" (7–10 Nov)

**Tujuan:** fungsionalitas (25%) terbukti: E2E, a11y, responsif, keamanan, performa + feedback mentor.

| ID | Judul | Owner | P | Est | Depends | Definition of Done |
|---|---|---|---|---|---|---|
| PM-30 | Triage feedback mentor (7 Nov) → tiket BE/FE | **PM** | P0 | 0,25 | — | Tiket dibuat hari yang sama |
| BE-30 | Rate limiter bersama di Mongo (`rate_limits` TTL, migrasi `009_rate_limits`) + set `TRUSTED_PROXIES` Vercel | **BE** | P0 | 1 | — | Limit konsisten lintas instance; test |
| BE-31 | Load test (k6/hey) endpoint publik + tuning index | **BE** | P1 | 0,5 | — | Laporan p50/p95 |
| BE-32 | Hardening: rotasi kredensial, keputusan `/docs` publik, catatan Atlas network | **BE** | P1 | 0,25 | PM-01 | — |
| FE-30 | Audit a11y (axe + keyboard + screen reader) & perbaikan | **FE** | P0 | 1 | — | 0 pelanggaran axe kritis |
| FE-31 | Responsif 360/768/1440 + Chrome/Edge/Firefox | **FE** | P0 | 0,75 | — | Checklist terisi + screenshot |
| FE-32 | Performa: Lighthouse ≥ 90 di `/` & detail | **FE** | P1 | 0,5 | — | Laporan Lighthouse |
| X-30 | **E2E**: UI Playwright di repo FE (`tests/e2e`, 6 alur kritis) + API Playwright `qa/` di repo BE diperbaiki (hapus tes palsu-lulus) — keduanya jalan di CI | **FE** (UI) + **BE** (API) | P0 | 2 | — | 6/6 alur UI + suite API hijau |
| PM-31 | Bug bash & QA manual (`qa/CHECKLIST.md`) 9 Nov | **PM** | P0 | 0,5 | — | Checklist terisi; bug → tiket |
| X-31 | Perbaikan feedback mentor | per tiket | P0 | — | PM-30 | — |

**Alur kritis E2E (X-30):** (1) Pilih RS → hasil → detail; (2) cari + filter + paginasi; (3) bandingkan 3 RS; (4) lacak rujukan demo; (5) cek BPJS simulasi; (6) login operator → ubah status layanan → terlihat di publik.

---

## 5. v1.0.0 — Final Submission (code freeze 10 Nov 18.00 WIB, submit 11 Nov)

| ID | Judul | Owner | P | Est | DoD |
|---|---|---|---|---|---|
| BE-40 | Rilis production v1.0.0 + smoke test + tag | **BE** | P0 | 0,25 | Smoke lulus |
| FE-40 | Rilis production v1.0.0 + smoke test + tag | **FE** | P0 | 0,25 | Smoke lulus |
| PM-40 | Proposal ≤ 30 hal (template panitia), surat orisinalitas bermaterai, video YouTube ≤ 5 mnt, submit | **PM** | P0 | 3 | Terkirim 11 Nov |
| X-40 | Rekam demo video (FE+BE siapkan data & akun demo) | **BE+FE** (PM sutradara) | P0 | 0,5 | Footage siap 9 Nov |

> Hanya bug-fix setelah freeze. Setiap perubahan setelah freeze butuh persetujuan PM.

---

## 6. Phase 4 — v1.1.0 "Onsite Prep & Validasi" (12–28 Nov)

| ID | Judul | Owner | P | Est | Depends | DoD |
|---|---|---|---|---|---|---|
| PM-50 | Usability test 5 orang (skenario Rina & Pak Budi), catat waktu & task success | **PM** | P0 | 1 | v1.0 | Laporan + angka untuk pitch |
| FE-50 | Perbaikan UX dari usability test | **FE** | P0 | 2 | PM-50 | — |
| FE-51 | Mode demo/presentasi (skenario terpandu, fallback statis bila API gagal) | **FE** | P1 | 1 | — | Demo jalan tanpa internet stabil |
| BE-50 | Stabilitas demo: monitoring uptime (cron ping `/ready`), alert, warm-up sebelum demo | **BE** | P0 | 0,5 | — | — |
| BE-51 | Perbaikan dari usability (mis. bobot skor) | **BE** | P1 | 1 | PM-50 | — |
| PM-51 | Pitch deck ≤ 15 slide, latihan, mentoring public speaking 22 Nov | **PM** | P0 | 2 | — | — |
| X-50 | Dry-run demo lengkap 27 Nov (laptop, backup offline, akun) | **Semua** | P0 | 0,25 | — | Lulus tanpa intervensi |

---

## 7. Phase 5 — Pasca-lomba (Des 2026+)

| Versi | Tema | BE | FE | PM |
|---|---|---|---|---|
| v1.2 | Kualitas produk | Sync MSI terjadwal, deteksi RS nonaktif, `$toLower` Unicode, sort jarak di DB | Peta Leaflet/MapLibre + tile provider produksi, PWA (offline daftar RS tersimpan), favorit lokal | Wawancara 10 pengguna |
| v1.3 | Data sah | Akses **SATUSEHAT produksi** resmi (Organization ID sendiri), sync nasional | Cakupan nasional, filter wilayah skala besar | Kemitraan dinkes/RS |
| v1.4 | Operator nyata | Onboarding operator RS (verifikasi), update kapasitas oleh RS | Panel operator multi-RS | SOP verifikasi |
| v2.0 | Platform | API publik ber-kunci untuk pihak ketiga, webhook | Multi-bahasa (ID/EN), aplikasi mobile (opsional) | Model keberlanjutan |

---

## 8. Matriks RACI

R = Responsible (mengerjakan) · A = Accountable (memutuskan) · C = Consulted · I = Informed

| Area | BE (Akmal) | FE (Tauriq) | PM (Radja) |
|---|---|---|---|
| Kontrak API / OpenAPI | **R/A** | C | I (approve perubahan scope) |
| Algoritma skor & kualitas data | **R** | C | **A** |
| Database, migrasi, seed | **R/A** | I | I |
| Data kurasi (sumber) | C | I | **R/A** |
| Data kurasi (import) | **R** | I | A |
| UI/UX, design system, copy teknis | I | **R/A** | C (copy final) |
| Integrasi FE ↔ API | C | **R/A** | I |
| E2E UI | C | **R/A** | C |
| E2E API (`qa/`) | **R/A** | I | C |
| QA manual & bug bash | C | C | **R/A** |
| Deploy BE / FE | **R/A** (BE) | **R/A** (FE) | I (Go/No-Go: **A**) |
| Keamanan & privasi | **R/A** | R (sisi klien) | C |
| Dokumen lomba, video, pitch | C | C | **R/A** |

## 9. Board per orang

### Yang dikerjakan BE — Akmal
| Versi | Tiket |
|---|---|
| v0.3.1 | BE-01 BPJS tanpa NIK mentah · BE-02 rilis prod · BE-03 kode wilayah · BE-04 CI · BE-05 cron data simulasi · BE-06 kontrak · BE-07 docs · BE-08 `hospital_name` · X-01 kontrak v0.4 · bantu PM-01 rotasi |
| v0.4.0 | BE-10 `/recommendations` · BE-11 `data_quality` · BE-12 markers bbox · BE-13 rilis · X-10 |
| v0.5.0 | BE-20 insights · BE-21 import kurasi · BE-22 audit curate · BE-23 riwayat BPJS · X-20 |
| v0.6.0 | BE-30 rate limiter bersama · BE-31 load test · BE-32 hardening · X-30 (API) |
| v1.0.0 | BE-40 rilis · X-40 |
| v1.1.0 | BE-50 monitoring · BE-51 tuning · X-50 |

### Yang dikerjakan FE — Tauriq
| Versi | Tiket |
|---|---|
| v0.3.1 | FE-01 versi & docs · FE-02 cek BPJS live · FE-03 CI · FE-04 quick fixes · FE-05 operator · X-01 review kontrak |
| v0.4.0 | FE-10 wizard · FE-11 hasil rekomendasi · FE-12 badge kualitas · FE-13 compare keputusan · FE-14 landing · FE-15 peta markers · X-10 |
| v0.5.0 | FE-20 `/wawasan` · FE-21 SSR + bagikan · FE-22 riwayat BPJS · FE-23 tentang data · X-20 |
| v0.6.0 | FE-30 a11y · FE-31 responsif · FE-32 performa · X-30 (UI) |
| v1.0.0 | FE-40 rilis · X-40 |
| v1.1.0 | FE-50 perbaikan UX · FE-51 mode demo · X-50 |

### Yang dikerjakan PM — Radja
| Versi | Tiket |
|---|---|
| v0.3.1 | PM-01 audit secret & repo publik · PM-02 pertanyaan panitia · PM-03 kickoff & board · approve X-01 |
| v0.4.0 | PM-10 First Draft · PM-11 riset pembanding · pimpin X-10 |
| v0.5.0 | PM-20 sumber kurasi · PM-21 materi mentor · copy FE-23 |
| v0.6.0 | PM-30 triage feedback · PM-31 bug bash |
| v1.0.0 | PM-40 proposal + video + submit · sutradara X-40 |
| v1.1.0 | PM-50 usability test · PM-51 pitch · pimpin X-50 |

## 10. Dependensi kritis FE ↔ BE

| FE butuh | Dari BE | Paling lambat |
|---|---|---|
| FE-02 cek BPJS | BE-02 prod 0.3.1 | 28 Okt |
| FE-10/11 rekomendasi | X-01 kontrak (FE boleh mulai pakai fixture), BE-10 di staging | kontrak 28 Okt, staging 30 Okt |
| FE-12 badge | BE-11 | 30 Okt |
| FE-15 peta | BE-12 | 31 Okt (P1, boleh geser ke v0.5) |
| FE-20 wawasan | BE-20 di staging | 4 Nov |
| FE-22 riwayat BPJS | BE-23 | 5 Nov |

> **Aturan anti-blokir:** begitu kontrak dibekukan, BE menaruh contoh respons di `docs/fixtures.json`; FE membangun UI terhadap fixture dan tidak menunggu endpoint live.
