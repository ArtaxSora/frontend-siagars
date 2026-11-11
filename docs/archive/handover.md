# Serah Terima Frontend SiagaRS untuk Backend

Untuk: Akmal Bariq Yonanda (backend). Dari: M. Tauriq Arya (frontend). Tanggal: 25 Oktober 2026.
Menjawab: `HANDOVER_PRODUCTION_v0.2.1` dan `HANDOVER_v0.2.md`.

Ringkasnya: FE sudah menembak **backend production 0.2.1** lewat rewrite, tanpa secret bypass. Semua 19 operasi API sudah dipakai, termasuk alur operator yang sudah kami uji di production dengan akun `admin@gmail.com`.

## 1. Alamat FE

| | |
|---|---|
| Website production | `https://frontend-siagars.vercel.app` |
| Repo | `github.com/ArtaxSora/frontend-siagars`, branch `develop` |
| Hosting | Vercel, project `artax-sora/frontend-siagars` |
| Backend yang dipakai | `https://siagars-backend.vercel.app` (production, 0.2.1) di lokal, Preview, dan Production |

Origin yang dipakai login operator: `https://frontend-siagars.vercel.app` (sudah cocok dengan `PUBLIC_ORIGIN` di handover kalian). Bila domain FE berubah, kami akan mengabari.

## 2. Cara FE terhubung

Sesuai §2 handover production:

```ts
// next.config.ts
async rewrites() {
  return [{ source: "/api/v1/:path*", destination: `${API_BASE_URL}/api/v1/:path*` }];
}
```

- Env `API_BASE_URL=https://siagars-backend.vercel.app` (server-only) di Vercel Production dan Preview.
- Tidak ada header bypass di kode mana pun. Route handler proxy untuk staging sudah dihapus.
- Browser hanya bicara ke origin FE, jadi kami tidak butuh CORS. Cookie `siagars_session` (`Path=/api/v1`) ikut otomatis.
- Konsekuensi: staging yang terkunci Vercel Authentication **tidak bisa** dipakai FE lewat rewrite ini.

## 3. Pemakaian endpoint (19 operasi)

| Endpoint | Dipakai di FE |
|---|---|
| `GET /health`, `GET /ready` | Halaman `/status` (status server dan database) |
| `GET /services` | Chip filter layanan di `/rumah-sakit` |
| `GET /regions` | Dropdown provinsi → kota; `code` dikirim apa adanya |
| `GET /hospitals` | Daftar, filter, pagination, peta; `dataset`, `page`, `limit`, `sort` selalu dikirim eksplisit |
| `GET /hospitals/suggest` | Autocomplete kolom cari (debounce 300 ms, `limit=8`, minimal 2 karakter) |
| `GET /hospitals/{id}` | Halaman detail; link memakai UUID |
| `GET /hospitals/compare` | `/bandingkan`; menerima UUID atau `external_id`, menangani 404 dan 422 |
| `POST /referrals/lookup` | `/lacak-rujukan`; kode hanya di body `tracking_code` |
| `POST /auth/login`, `GET /auth/me`, `GET /auth/csrf`, `POST /auth/logout` | Panel operator; token CSRF hanya di memori |
| `GET /admin/hospitals`, `GET /admin/hospitals/{id}` | Pilih RS dan ambil `version` sebelum mengubah |
| `PATCH /admin/hospitals/{id}/services/{slug}`, `.../beds/{category}` | Ubah layanan dan bed; `409` → muat ulang lalu tinjau |
| `GET /admin/referrals`, `PATCH /admin/referrals/{id}/status` | Daftar dan transisi status rujukan (tombol hanya transisi yang sah) |

## 4. Aturan tampilan yang sudah diterapkan

- Label **Simulasi** muncul bila `data_origin`, `facility_summary.data_origin`, `bpjs_data_origin`, atau item `services`/`beds` bernilai `simulation`. Halaman dengan nilai simulasi juga menampilkan pemberitahuan "Data simulasi".
- BPJS dari data contoh ditulis "(data contoh)", tidak "menurut sumber".
- `unknown`/`null` tampil abu-abu "Belum diketahui". Bed `0` tampil "0 tersedia (nol menurut sumber)".
- `facility_class.name` null → tampilkan `code`.
- Jarak ditulis sebagai garis lurus, bukan waktu tempuh.

## 5. Hasil uji FE terhadap production (25 Okt 2026, lewat `https://frontend-siagars.vercel.app`)

| Pemeriksaan | Hasil |
|---|---|
| `GET /api/v1/health` | `{"data":{"status":"ok"}}` |
| `GET /hospitals?dataset=all` | total 546 |
| `GET /hospitals/compare?ids=1004673817,<uuid RS Simulasi Siaga 01>` | 200, dua RS |
| `POST /referrals/lookup` `SR-DEMO-001` | 200, status `searching` |
| `POST /auth/login` password salah, Origin website | `401` (origin diterima) |
| `POST /auth/login` dari `http://localhost:3000` | `403 invalid_origin` (sesuai handover) |
| `GET /auth/me` tanpa sesi | `401` |
| Halaman `/`, `/rumah-sakit`, `/bandingkan`, `/status`, `/operator/login` | 200 |

| Login `admin@gmail.com` → panel → beranda → kembali ke panel | Sesi tetap, panel tampil |
| Logout lalu login lagi (3 kali berturut-turut) | Berhasil setiap kali |
| `GET /admin/hospitals` di halaman layanan | 1 RS: RS Simulasi Siaga 01, beserta layanan dan bed |

**Belum diuji dari FE:** menyimpan perubahan layanan/bed (`PATCH`) dan `409`, karena kami tidak ingin mengubah data production tanpa kesepakatan. Kode penanganannya sudah ada.

## 6. Permintaan dan pertanyaan untuk backend

1. **Uji mutasi di production.** Bolehkah kami mengubah status layanan/bed RS Simulasi Siaga 01 untuk menguji `PATCH` dan `409`? Data itu simulasi, tapi kami ingin izin dulu.
2. **Staging membalas `503 service_unavailable`** saat kami cek tadi (dengan header bypass yang benar). Apakah memang sedang dimatikan? Kami tidak bergantung padanya sekarang, tapi butuh kabar bila staging dipakai lagi untuk uji login lokal.
3. **Uji login lokal.** Production hanya menerima origin website, dan staging tidak bisa dipakai lewat rewrite. Apakah `http://localhost:3000` bisa ditambahkan ke `PUBLIC_ORIGIN` production, atau ada cara lain yang kalian sarankan?
4. **Enum `bpjs_data_origin` dan `facility_summary.data_origin`.** CHANGELOG menulis `simulation | curated | null`, tetapi OpenAPI memakai seluruh enum `DataOrigin` (termasuk `satusehat_*`). FE menerima semua nilai `DataOrigin`. Mohon konfirmasi mana yang benar.
5. **`csrf_token` di respons login "bila tersedia".** FE sudah mengambil `GET /auth/csrf` bila token tidak ada. Bila memang bisa kosong, mohon tandai sebagai opsional di OpenAPI.
6. **Kesegaran data contoh.** Data contoh akan tampil `stale` setelah 24 jam sejak 25 Okt. Mohon disegarkan sebelum demo/penilaian bila memungkinkan.
7. **Nama kota ganda di `/regions`.** Wilayah seed (`36.71`) dan SATUSEHAT (`3671`) bisa bernama sama (mis. "Kota Tangerang"). FE menampilkan kode di samping nama yang bentrok. Bila ada cara yang lebih jelas (mis. label "simulasi" pada wilayah seed), kami siap menyesuaikan.

## 7. Catatan keamanan

- Secret bypass staging tidak lagi disimpan di env Vercel FE (sudah dihapus dari Production dan Preview) dan tidak pernah masuk git. Bila kalian ingin, secret itu bisa dirotasi.
- Semua env FE yang menyangkut backend bersifat server-only (tanpa `NEXT_PUBLIC_`).

## 8. Kontak

Frontend: M. Tauriq Arya. Saat melaporkan galat ke backend, kami menyertakan `request_id` dari respons.
