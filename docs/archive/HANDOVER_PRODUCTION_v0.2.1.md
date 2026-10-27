# Serah Terima Production Backend SiagaRS v0.2.1 untuk Frontend

Untuk: M. Tauriq Arya dan tim frontend. Dari: Akmal Bariq Yonanda (backend). Tanggal: 25 Oktober 2026. Versi API production: **0.2.1**.

Production kini sama dengan staging 0.2.x, jadi FE bisa menembak production **tanpa secret bypass dan tanpa proxy khusus**. Rujukan lain: [`HANDOVER_v0.2.md`](HANDOVER_v0.2.md) (aturan tampilan, bentuk data, daftar periksa), [`CHANGELOG.md`](CHANGELOG_API.md), [`API_FRONTEND.md`](API_FRONTEND.md), [`openapi.yaml`](openapi.yaml). Bila dokumen berbeda dengan OpenAPI, ikuti OpenAPI.

## 1. Alamat

| | |
|---|---|
| Base URL | `https://siagars-backend.vercel.app` |
| API | `https://siagars-backend.vercel.app/api/v1` |
| Dokumentasi interaktif (Scalar) | `https://siagars-backend.vercel.app/docs` |
| Kontrak JSON | `https://siagars-backend.vercel.app/docs/openapi.json` |

Staging (`develop`) tetap ada untuk mencoba perubahan berikutnya; production hanya berubah saat `main` dirilis.

## 2. Menghubungkan FE (Next.js)

Pakai rewrite biasa. Browser hanya bicara ke origin FE, jadi tidak perlu CORS (backend memang tidak membuka CORS).

```ts
// next.config.ts
async rewrites() {
  return [{ source: '/api/v1/:path*', destination: `${process.env.API_BASE_URL}/api/v1/:path*` }];
}
```

```text
# .env.local (atau env Vercel milik FE)
API_BASE_URL=https://siagars-backend.vercel.app
```

Cek cepat: `GET /api/v1/health` -> `{"data":{"status":"ok"}}`, lalu `GET /api/v1/hospitals?limit=3`.

Route handler proxy dengan header bypass di `API_FRONTEND.md` bagian 2a **hanya untuk staging**; jangan dipakai untuk production.

## 3. Data di production

- 516 RS nyata Jabodetabek dari SATUSEHAT sandbox (`dataset=real`, default), 30 RS simulasi (`dataset=simulation`), keduanya (`dataset=all`, total 546).
- SATUSEHAT sandbox tidak menyediakan ICU/NICU/PICU/bed/rawat inap/BPJS. Karena itu RS nyata diberi **data contoh (dummy)**: `facility_summary.data_origin == "simulation"`, `bpjs_data_origin == "simulation"`, dan tiap item `services`/`beds` berlabel `data_origin: "simulation"`. **Wajib tampilkan label "Simulasi"**; jangan sajikan sebagai fakta RS.
- Sebagian RS sengaja tanpa bed (`null`) agar jalur "belum diketahui" teruji. `null`/`unknown` = belum diketahui, bukan "tidak ada". Bed `0` adalah angka nyata.
- `freshness` dihitung dari `source_updated_at`. Data contoh ditempel pada 25 Okt 2026, jadi akan tampil `stale` setelah 24 jam. Itu perilaku benar, bukan bug; backend dapat menyegarkannya bila diminta.
- Compare dan detail menerima UUID **atau** kode SATUSEHAT (`external_id`), campuran boleh: `/hospitals/compare?ids=1004673817,<uuid>`.
- Tracking demo publik sintetis: `POST /referrals/lookup` dengan `{"tracking_code":"SR-DEMO-001"}` (field-nya `tracking_code`).

## 4. Endpoint publik yang siap dipakai

`GET /health`, `/ready`, `/services`, `/regions`, `/hospitals` (filter, `services` bersifat AND, `limit` maks 50, parameter tak dikenal 422), `/hospitals/suggest?q=`, `/hospitals/{id|kode}`, `/hospitals/compare?ids=`, `POST /referrals/lookup`. Detailnya ada di `/docs`.

## 5. Login operator di production

Origin FE yang diterima backend: **`https://frontend-siagars.vercel.app`** (`PUBLIC_ORIGIN`, persis, tanpa slash akhir). Login dari origin lain (termasuk `http://localhost:3000`) ditolak 403; untuk uji lokal dengan login, pakai staging (`HANDOVER_v0.2.md`). Bila FE pindah domain, kabari Akmal agar `PUBLIC_ORIGIN` diubah dan backend di-redeploy.

| | |
|---|---|
| Email | `admin@gmail.com` |
| Password | dikirim Akmal lewat kanal privat (tidak disimpan di git) |
| Scope RS | satu RS: `RS Simulasi Siaga 01`, id `10000000-0000-4000-8000-000000000001` |

Alur:
1. `POST /auth/login` `{ "email", "password" }` dengan `Content-Type: application/json`. Browser mengirim `Origin` sendiri; respons berisi cookie `siagars_session` (HttpOnly, Secure, SameSite=Lax, Path=/api/v1, 8 jam) dan `csrf_token` bila tersedia. Bila tidak, ambil dengan `GET /auth/csrf`.
2. Kirim cookie otomatis lewat rewrite same-origin (`fetch('/api/v1/...', { credentials: 'include' })`).
3. Semua mutasi (`PATCH`/`POST`) wajib header `X-CSRF-Token`. Tanpa atau salah token -> 403.
4. `GET /admin/hospitals` (RS dalam scope, lengkap dengan `version`), `GET /admin/hospitals/{id}`, `PATCH /admin/hospitals/{id}/services/{slug}` dan `.../beds/{category}` dengan `version` terakhir. `version` basi -> 409: ambil ulang lalu coba lagi.
5. RS di luar scope -> 403. `POST /auth/logout` mencabut sesi (setelah itu 401).
6. Gagal login berulang kena rate limit (429). Pesan galat sama untuk email salah dan password salah.

Catatan: `ICU` pada `RS Simulasi Siaga 01` sudah pernah diubah saat uji (versi 2, status `available`); itu data simulasi.

## 6. Daftar periksa FE

- [ ] `API_BASE_URL` menunjuk production, tanpa header bypass di kode apa pun.
- [ ] Label "Simulasi" tampil bila `facility_summary.data_origin` atau `bpjs_data_origin` bernilai `simulation`.
- [ ] `unknown`/`null` tampil sebagai "Belum diketahui", bukan merah/"tidak tersedia".
- [ ] Compare memakai `external_id ?? id`.
- [ ] Filter wilayah memakai `code` dari `GET /regions` apa adanya.
- [ ] Login operator diuji dari `https://frontend-siagars.vercel.app` (bukan localhost) dengan password dari Akmal.

## 7. Hasil uji production (25 Okt 2026)

Dijalankan terhadap `https://siagars-backend.vercel.app`.
- **Publik, 32 pemeriksaan lulus:** health/ready, 6 layanan, regions, 516 RS nyata dengan label simulasi, detail via UUID dan kode, compare (campuran, duplikat 422, hilang 404), validasi parameter, filter AND, jarak, dataset, suggest, lookup (demo 200, acak 404), admin tanpa sesi 401, tanpa CORS, header keamanan, `/docs` dan OpenAPI 0.2.1 dengan 19 path.
- **Operator, 15 pemeriksaan lulus** dari origin FE: password salah 401, origin salah 403, login 200 dengan cookie HttpOnly/Secure/SameSite=Lax/Path=/api/v1, daftar RS dalam scope (1), RS lain 403, mutasi tanpa CSRF dan CSRF salah 403, mutasi RS lain 403, logout lalu 401. Ditambah mutasi sah 200 dan tulis ulang `version` basi 409.
- Belum diuji di production: transisi status rujukan (tidak ada rujukan yang bisa diubah operator ini selain data demo) dan rate limit login berantai (limiter per instance di Vercel).
