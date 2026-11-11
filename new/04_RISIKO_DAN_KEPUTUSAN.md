# 04 — Keputusan & Risiko

| | |
|---|---|
| Versi dokumen | 1.0 · 26 Okt 2026 |
| Owner | Radja Admiral (PM) |

## 1. Decision log

| ID | Tanggal | Keputusan | Alasan | Konsekuensi | Diputuskan |
|---|---|---|---|---|---|
| D-01 | 23 Okt | MongoDB Atlas (bukan PostgreSQL) | Sudah berjalan, transaksi via replica set | PRD lama yang menyebut PostgreSQL = arsip | BE |
| D-02 | 26 Okt | Sub-tema **Data-Driven Decision Support** | Bobot tema 15%; menambah orisinalitas; memanfaatkan data provenance yang sudah ada | Fitur baru: rekomendasi, kualitas data, wawasan | PM + tim |
| D-03 | 26 Okt | **Tidak menyimpan NIK mentah**; hapus `raw_enc` & endpoint reveal | Risiko UU PDP; konsisten dengan permintaan FE; lebih aman saat dinilai juri | Riwayat operator hanya tersamar + HMAC; menggantikan keputusan owner 25 Okt | PM + BE |
| D-04 | 26 Okt | **Versi produk tunggal** FE = BE = OpenAPI | Menghilangkan kebingungan 0.1/0.2.1/0.3.0/"v1.0" | Tag di kedua repo setiap rilis | PM |
| D-05 | 26 Okt | Skor rekomendasi dihitung **di BE**, dapat dijelaskan per komponen | Satu sumber kebenaran; FE tetap tipis | FE hanya menampilkan `components` | PM + BE |
| D-06 | 26 Okt | Data simulasi diregenerasi harian lewat cron, bukan "dipoles" timestamp-nya | Kejujuran: simulasi tetap simulasi, tetapi tidak tampak basi saat dinilai | BE-05 | BE |
| D-07 | 26 Okt | Peta custom dipertahankan sampai v1.0; Leaflet/MapLibre di v1.2 | Risiko regresi mendekati deadline | Tile OSM hanya untuk demo | FE |
| D-08 | 26 Okt | Grafik `/wawasan` memakai SVG ringan buatan sendiri (tanpa lib chart berat) | Konsisten dengan FE tanpa dependensi UI; ukuran bundle | Bila waktu habis, FE boleh memakai satu lib ringan dengan persetujuan PM | FE |
| D-09 | 26 Okt | E2E UI di repo FE (`tests/e2e`), E2E API tetap di repo BE (`qa/`) | Kepemilikan jelas | X-30 | PM |
| D-10 | 26 Okt | Dua repo publik terpisah (FE & BE), setelah audit secret | Kepemilikan per tim; syarat repo publik | PM-01 | PM |

Keputusan baru ditambahkan di tabel ini (ID berurutan) via PR.

## 2. Risk register

Skala: Probabilitas (P) & Dampak (D) 1–3. Skor = P×D.

| ID | Risiko | P | D | Skor | Mitigasi | Owner |
|---|---|---|---|---|---|---|
| R-01 | Waktu sempit: 6 hari ke draft, 16 hari ke final | 3 | 3 | 9 | Prioritas P0 ketat, anti-blokir via fixture, freeze 10 Nov | PM |
| R-02 | Data kurasi 30 RS tidak tercapai | 2 | 3 | 6 | Mulai 2 Nov, batch harian 6–10 RS, minimal 10 lengkap | PM |
| R-03 | Juri menilai data simulasi = data palsu | 2 | 3 | 6 | Label konsisten, penalti skor, halaman metodologi, narasi jujur di pitch | PM + FE |
| R-04 | Kredensial bocor di riwayat git saat repo dipublikasi | 2 | 3 | 6 | PM-01 scan gitleaks + rotasi sebelum publik | PM + BE |
| R-05 | Rate limit per instance mudah ditembus | 2 | 2 | 4 | BE-30 rate limiter bersama | BE |
| R-06 | Cold start Vercel memperlambat demo | 2 | 2 | 4 | Warm-up & monitoring BE-50 | BE |
| R-07 | Single point of failure (1 orang per repo) | 2 | 3 | 6 | AGENTS.md + PRD lengkap, PR review lintas tim, handover di setiap PR | PM |
| R-08 | Jadwal/aturan panitia ambigu (A1, A3, A4, A6) | 2 | 2 | 4 | PM-02 tanya panitia; submit draft 31 Okt malam | PM |
| R-09 | Kebijakan tile OSM untuk trafik publik | 1 | 2 | 2 | Atribusi benar, `NEXT_PUBLIC_TILE_URL` dapat diganti | FE |
| R-10 | Algoritma skor dianggap menyesatkan secara medis | 2 | 3 | 6 | Disclaimer: skor = kecocokan dengan kebutuhan & kepastian data, **bukan** kualitas klinis; banner 112 | PM + FE |
| R-11 | Internet venue final tidak stabil | 2 | 3 | 6 | FE-51 mode demo + video cadangan | FE + PM |
