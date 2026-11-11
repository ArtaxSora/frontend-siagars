# 00 — Audit Kondisi Saat Ini (per 26 Oktober 2026)

| | |
|---|---|
| Versi dokumen | 1.0 · 26 Okt 2026 |
| Owner | Radja Admiral (PM) |
| Sumber | Analisa kode & dokumen repo `siagars-backend` (branch `develop`) dan `frontend-siagars` (branch `develop`) |

## 1. Ringkasan eksekutif

| Area | Status | Catatan |
|---|---|---|
| Backend API | 🟢 Kuat | 22 operasi terimplementasi (bukan stub), 140 test Go, migrasi berurutan + checksum |
| Frontend | 🟢 Lengkap terhadap API 0.2.1 | Semua 19 operasi terhubung, tanpa mock; `/cek-bpjs` menunggu BE 0.3.0 di production |
| Data | 🟡 Sebagian nyata | 516 RS nyata (identitas, SATUSEHAT MSI Sandbox) + 30 RS simulasi; fasilitas/bed/BPJS RS nyata = **dummy simulasi**; 0 RS kurasi |
| Sub-tema lomba | 🔴 → 🟢 | Sebelumnya belum dipilih; **diputuskan 26 Okt: Data-Driven Decision Support** |
| Fitur pendukung keputusan | 🔴 Belum ada | Sort `match` ada tapi tidak dijelaskan; tidak ada rekomendasi, insight, atau skor kualitas data |
| QA | 🔴 Lemah | FE: 51 unit test `lib/` saja; tidak ada E2E/CI; Playwright `qa/` belum pernah dijalankan; checklist QA kosong |
| Dokumentasi | 🟡 Banyak tapi bertentangan | Lihat §6 |
| Deploy | 🟢 Online | FE `frontend-siagars.vercel.app`, BE `siagars-backend.vercel.app` (prod 0.2.1), staging BE 0.3.0 |

## 2. Backend (`siagars-backend`)

**Stack:** Go 1.27.1, `net/http` (tanpa framework), MongoDB Atlas (driver v2.9.2, replica set untuk transaksi), deploy Vercel Serverless (`sin1`). Docker/Caddy/nginx disiapkan tapi **belum teruji**.

**Struktur:** `cmd/{api,manage}`, `internal/{app,config,domain,http,integrations/satusehat,repository,service}`, `migrations/001–005`, `seed/`, `serverless/` (shim Vercel), `docs/openapi.yaml` (v0.3.0).

**Endpoint (prefix `/api/v1`):**

| # | Method | Path | Prod (0.2.1) | Staging (0.3.0) | Dipakai FE |
|---|---|---|---|---|---|
| 1 | GET | /health | ✅ | ✅ | ✅ `/status` |
| 2 | GET | /ready | ✅ | ✅ | ✅ `/status` |
| 3 | GET | /services | ✅ | ✅ | ✅ |
| 4 | GET | /hospitals | ✅ | ✅ | ✅ |
| 5 | GET | /hospitals/{id} | ✅ | ✅ | ✅ |
| 6 | GET | /hospitals/compare | ✅ | ✅ | ✅ |
| 7 | POST | /referrals/lookup | ✅ | ✅ | ✅ |
| 8–11 | POST/GET/GET/POST | /auth/login, /me, /csrf, /logout | ✅ | ✅ | ✅ |
| 12 | GET | /admin/referrals | ✅ | ✅ | ✅ |
| 13 | PATCH | /admin/referrals/{id}/status | ✅ | ✅ | ✅ (belum diuji di prod) |
| 14 | PATCH | /admin/hospitals/{id}/services/{slug} | ✅ | ✅ | ✅ (409 belum diuji di prod) |
| 15 | PATCH | /admin/hospitals/{id}/beds/{category} | ✅ | ✅ | ✅ |
| 16 | GET | /regions | ✅ | ✅ | ✅ |
| 17 | GET | /hospitals/suggest | ✅ | ✅ | ✅ |
| 18 | GET | /admin/hospitals | ✅ | ✅ | ✅ |
| 19 | GET | /admin/hospitals/{id} | ✅ | ✅ | ✅ |
| 20 | POST | /bpjs/check | ❌ | ✅ | ✅ (UI siap, fallback "belum tersedia") |
| 21 | GET | /admin/bpjs-checks | ❌ | ✅ | ❌ |
| 22 | POST | /admin/bpjs-checks/{id}/reveal | ❌ | ✅ | ❌ — **akan dihapus** (keputusan D-03) |

**Data model:** koleksi `regions, services, hospitals (services[] & beds[] embedded + provenance per item + version), operators, sessions, referrals, referral_status_history, audit_logs, bpjs_participants, bpjs_check_history (TTL 30 hari, raw_enc AES-GCM)`.

**Keamanan:** session cookie HttpOnly + hash SHA-256, CSRF per sesi, Origin allowlist, bcrypt 12, rate limit **in-memory per instance**, scope operator di server, audit transaksional.

**Test:** 140 fungsi test/benchmark; integrasi opt-in via `TEST_MONGODB_URI`. Race detector belum pernah jalan. Playwright `qa/` 5 spec / 13 skenario API — **belum pernah dijalankan**; spec UI kosong dan palsu-lulus (review P2 #5).

## 3. Frontend (`frontend-siagars`)

**Stack:** Next.js 16.4.3 (App Router, `cacheComponents`, `proxy.ts`), React 19.3, TypeScript strict, Tailwind v4 (`@theme` di `app/globals.css`), font Plus Jakarta Sans, **tanpa** library UI/state/map (peta tile Mercator custom), test `node:test`.

**Halaman:**

| Route | Status |
|---|---|
| `/` | ✅ Hero cari, quick filter, cakupan live, penjelasan cara membaca |
| `/rumah-sakit` | ✅ Cari + autocomplete, filter (layanan AND, wilayah, BPJS, bed, dataset, sort), peta/list, paginasi, compare tray |
| `/rumah-sakit/[id]` | ✅ Profil, kontak, rute Maps, layanan/bed + provenance per nilai |
| `/bandingkan` | ✅ 2–3 RS side-by-side (tidak ada di nav) |
| `/lacak-rujukan` | ✅ Lookup kode demo `SR-DEMO-001`, timeline, 429 countdown |
| `/cek-bpjs` | 🟡 UI siap, endpoint belum di prod |
| `/tentang-data` | 🟡 Statis, masih tertulis "Versi 0.1" |
| `/status` | ✅ Health/ready + label environment |
| `/operator/*` | ✅ Login, kelola rujukan, kelola layanan/bed |

**Desain:** token "Civic Transparency" (teal `#0d7a75`, trust blue `#1e40af`, pasangan status ok/warn/bad/unk, asal data kurasi/simulasi(dashed amber)/sandbox, titik kesegaran). Aturan: status = ikon+teks+warna; null = "Belum diketahui"; waktu WIB; jarak "garis lurus". Aksesibilitas baik (skip link, focus ring, ARIA combobox, 44px target).

**Kelemahan:** semua fetch client-side (tidak ada SSR/SEO untuk halaman RS), N+1 `GET /hospitals/{id}` untuk nama RS di operator, `NOTE_MAX=280` vs API 500, `package.json` 0.1.0 vs commit "Release v1.0", tanpa tag git, tanpa CI, aset bawaan create-next-app di `public/`.

## 4. Data

| Sumber | Isi | Status kejujuran |
|---|---|---|
| SATUSEHAT MSI **Sandbox** | 516 RS Jabodetabek (nama, alamat, kelas, jenis, koordinat) | Nyata (sandbox), `freshness=unknown` |
| `dummy-facilities` | Layanan/bed/BPJS untuk 516 RS di atas | **Simulasi**, berlabel; stale 24 jam setelah ditulis |
| Seed | 30 "RS Simulasi Siaga", rujukan `SR-DEMO-001`, 5 peserta BPJS sintetis (NIK `9999…`) | Simulasi |
| Kurasi (`curate`) | Pipeline siap (dry-run default) | **0 data** — target 30–50 RS belum tersentuh |

Masalah data: kode wilayah ganda (`31.71` seed vs `3171` MSI), data dummy sudah stale saat ini, MSI tidak memberi ICU/bed/BPJS.

## 5. Kesiapan terhadap rubrik penyisihan

| Kriteria | Bobot | Kondisi | Yang kurang → ditutup di versi |
|---|---|---|---|
| Orisinalitas | 20% | Provenance per nilai sudah unik | Fitur keputusan + riset pembanding → v0.4/v0.5 |
| Fungsionalitas | 25% | Fitur jalan, belum ada bukti E2E/responsif | E2E, CI, uji 3 breakpoint & 3 browser → v0.6 |
| Desain | 20% | Sistem desain konsisten | Landing baru, wizard, dashboard visual → v0.4/v0.5 |
| Konten | 20% | Label asal & kesegaran jelas | Data kurasi 30–50 RS, halaman wawasan → v0.5 |
| Tema | 15% | Belum ada sub-tema | DDDS + fitur rekomendasi/insight → v0.4/v0.5 |

## 6. Inkonsistensi & utang yang harus dibereskan

| # | Temuan | Owner | Tiket |
|---|---|---|---|
| 1 | Simpan NIK mentah terenkripsi + reveal (risiko UU PDP) | BE | BE-01 |
| 2 | 0.3.0 belum di production | BE | BE-02 |
| 3 | Kode wilayah ganda `31.71` vs `3171` | BE | BE-03 |
| 4 | Data dummy stale → buruk saat dinilai | BE | BE-05 |
| 5 | Rate limit per instance, `TRUSTED_PROXIES` belum di-set di Vercel | BE | BE-04, BE-30 |
| 6 | Enum `bpjs_data_origin` di changelog vs OpenAPI berbeda; `csrf_token` belum optional | BE | BE-06 |
| 7 | PRD BE §11 & DECISIONS masih menyebut isu `$` terbuka; README BE versi campur | BE | BE-07 |
| 8 | `/tentang-data` "Versi 0.1", `package.json` 0.1.0, dokumen FE lama bertentangan | FE | FE-01 |
| 9 | `NOTE_MAX` 280 vs 500; `/bandingkan` tidak di nav | FE | FE-04 |
| 10 | N+1 nama RS di operator | BE+FE | BE-08, FE-05 |
| 11 | Playwright UI palsu-lulus, `qa/` tak pernah jalan | X | X-30 |
| 12 | Repo BE private, kredensial mungkin ada di riwayat git | PM | PM-01 |
| 13 | Pertanyaan panitia A1/A3/A4/A6 belum dikirim | PM | PM-02 |
