# SiagaRS — Paket Re-scoping v1 (folder `new/`)

| | |
|---|---|
| Versi dokumen | 1.0 |
| Tanggal | 26 Oktober 2026 |
| Owner | Radja Admiral (PM / Ketua Tim MalasNgoding) |
| Status | **Berlaku** — menggantikan PRD v0.1 (23 Okt 2026) sebagai acuan kerja FE & BE |
| Lomba | MIA 2026 — Web In Action (WIA) |

> **Satu kalimat:** SiagaRS membantu keluarga pasien **memutuskan rumah sakit yang tepat** dengan data fasilitas yang transparan — setiap angka punya sumber, umur, dan tingkat kepastian.
>
> **Sub-tema resmi:** **Data-Driven Decision Support**.

## Cara membaca paket ini

| Urutan | Dokumen | Untuk siapa | Isi |
|---|---|---|---|
| 1 | [00_AUDIT_KONDISI_SAAT_INI.md](00_AUDIT_KONDISI_SAAT_INI.md) | Semua | Hasil analisa FE & BE per 26 Okt 2026: apa yang sudah ada, gap, kesiapan terhadap rubrik |
| 2 | [01_SCOPE_SIAGARS_A-Z.md](01_SCOPE_SIAGARS_A-Z.md) | Semua | Scope lengkap versi baru: visi, fitur, out-of-scope, data, NFR, tim, proses |
| 3 | [02_ROADMAP_PHASE_VERSI.md](02_ROADMAP_PHASE_VERSI.md) | Semua | Phase + versi + tanggal + **tiket per owner (BE / FE / PM / bersama)** |
| 4 | [03_KONTRAK_API_v1.md](03_KONTRAK_API_v1.md) | BE + FE | Kontrak API target v1.0, algoritma skor rekomendasi, kualitas data, insights |
| 5 | [04_RISIKO_DAN_KEPUTUSAN.md](04_RISIKO_DAN_KEPUTUSAN.md) | Semua | Decision log & risk register |
| 6 | [PRD.md](PRD.md) · [AGENTS.md](AGENTS.md) | Tim FE | Requirement & aturan kerja **repo ini** |

> Dokumen bersama (README, 00–04) identik di kedua repo. PRD & AGENTS untuk Backend ada di folder `new/` repo `siagars-backend`.

## Ringkasan 1 halaman

**Posisi sekarang (v0.3.0 staging / v0.2.1 production):** fondasi kuat — 22 operasi API Go + MongoDB, 516 RS nyata (SATUSEHAT MSI Sandbox, Jabodetabek) + 30 RS simulasi, FE Next.js 16 sudah terhubung ke semua endpoint. Kelemahan: belum ada fitur yang benar-benar "membantu memutuskan", data fasilitas RS nyata masih simulasi, tidak ada E2E/CI, dokumen saling bertentangan, sub-tema belum dipilih.

**Arah baru:** dari "direktori RS + tracking" menjadi **sistem pendukung keputusan**:
1. **Asisten Pilih RS** (`/pilih-rs`) — wizard kebutuhan → rekomendasi dengan **skor kecocokan yang bisa dijelaskan**.
2. **Bandingkan berbasis keputusan** — pemenang per baris + alasan.
3. **Wawasan Data** (`/wawasan`) — dashboard cakupan RS, kesenjangan layanan, kesegaran data.
4. **Skor Kualitas Data** di setiap RS.

**Timeline versi:**

| Versi | Tanggal (2026) | Milestone |
|---|---|---|
| v0.3.1 | 26–28 Okt | Stabilisasi (BPJS tanpa NIK mentah, CI, docs bersih) |
| v0.4.0 | 28–31 Okt | Decision Core → **First Draft 1 Nov** |
| v0.5.0 | 2–6 Nov | Insights & data kurasi |
| v0.6.0 | 7–10 Nov | Hardening + feedback mentor |
| **v1.0.0** | **11 Nov** | **Final Submission** |
| v1.1.0 | 12–28 Nov | Persiapan **Final Onsite 28 Nov** |
| v1.2+ / v2.0 | Des 2026+ | Produk pasca-lomba |

**Pembagian kerja:** Backend — Akmal Bariq Yonanda · Frontend — M. Tauriq Arya · PM/QA/Docs/Pitch — Radja Admiral. Detail tiket per orang ada di [02_ROADMAP_PHASE_VERSI.md §9](02_ROADMAP_PHASE_VERSI.md#9-board-per-orang).

## Aturan emas (berlaku untuk semua)

1. Dokumen di folder `new/` adalah **sumber kebenaran**. Dokumen lama (handover, PRD v0.1, API_FRONTEND v0.1) hanya arsip.
2. **Versi produk tunggal:** FE & BE dirilis berpasangan dengan tag `vX.Y.Z` yang sama. Versi produk = versi API (`info.version` OpenAPI).
3. Kontrak API berubah → update OpenAPI + `03_KONTRAK_API_v1.md` + CHANGELOG **sebelum** FE mengonsumsi.
4. Setiap nilai punya sumber & umur; "Belum diketahui" ≠ 0; data simulasi selalu dilabeli.
5. SiagaRS **bukan** layanan gawat darurat — darurat: **112**.
