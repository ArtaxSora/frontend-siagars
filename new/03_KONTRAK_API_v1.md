# 03 — Kontrak API Target v1.0

| | |
|---|---|
| Versi dokumen | 1.0 · 26 Okt 2026 |
| Owner | Akmal Bariq Yonanda (BE) — **Accountable** |
| Reviewer | M. Tauriq Arya (FE), Radja Admiral (PM, approve perubahan scope) |
| Basis | OpenAPI `backend/docs/openapi.yaml` v0.3.0 |
| Status | §1–§2 berlaku; §3–§7 **draft untuk dibekukan di tiket X-01 (28 Okt)** |

## 1. Prinsip kontrak

1. `backend/docs/openapi.yaml` adalah **sumber kebenaran**. Dokumen ini adalah ringkasan & keputusan desainnya.
2. FE `lib/contracts/types.ts` wajib mengikuti OpenAPI versi yang sama; perbedaan = bug.
3. Prefix `/api/v1`, JSON `snake_case`, UUID lowercase, waktu RFC3339 UTC, semua response `Cache-Control: no-store` kecuali dinyatakan lain.
4. Parameter query tak dikenal/kosong/berulang → **422**; field body tak dikenal → **400**; body maks 64 KB.
5. `null` = **tidak diketahui**, tidak pernah berarti 0/false.
6. Setiap perubahan: update OpenAPI + `docs/fixtures.json` + `docs/CHANGELOG.md` + dokumen ini → umumkan di kanal tim → baru FE mengonsumsi.
7. Perubahan **breaking** hanya di MINOR sebelum v1.0 dan harus disetujui FE.

### Format error (seragam, BE-06)
```json
{ "error": { "code": "validation_error", "message": "Pesan dalam Bahasa Indonesia", "details": [{ "field": "services", "issue": "unknown_value" }] }, "request_id": "..." }
```
`code` ∈ `request_error, validation_error, unauthorized, forbidden, not_found, conflict, rate_limited, service_unavailable, not_implemented, internal_error`. `details` opsional. 429 selalu menyertakan header `Retry-After`.

## 2. Daftar endpoint v1.0

| # | Method | Path | Akses | Status | Versi |
|---|---|---|---|---|---|
| 1 | GET | /health | publik | ada | 0.1 |
| 2 | GET | /ready | publik | ada | 0.1 |
| 3 | GET | /services | publik | ada | 0.1 |
| 4 | GET | /regions | publik | ada (kode diunifikasi BE-03) | 0.2 → 0.3.1 |
| 5 | GET | /hospitals | publik | ada (+ `data_quality`) | 0.1 → 0.4 |
| 6 | GET | /hospitals/suggest | publik | ada | 0.2 |
| 7 | GET | /hospitals/{id} | publik | ada (+ `data_quality`) | 0.1 → 0.4 |
| 8 | GET | /hospitals/compare | publik | ada (+ `data_quality`) | 0.1 → 0.4 |
| 9 | GET | **/hospitals/markers** | publik | **baru** | 0.4 |
| 10 | GET | **/recommendations** | publik | **baru** | 0.4 |
| 11 | GET | **/insights/summary** | publik | **baru** | 0.5 |
| 12 | GET | **/insights/coverage** | publik | **baru** | 0.5 |
| 13 | GET | **/insights/service-gaps** | publik | **baru** | 0.5 |
| 14 | GET | **/insights/freshness** | publik | **baru** | 0.5 |
| 15 | POST | /referrals/lookup | publik, 10/mnt/IP | ada | 0.1 |
| 16 | POST | /bpjs/check | publik, 10/mnt/IP | ada (tanpa simpan NIK mentah) | 0.3 → 0.3.1 |
| 17–20 | POST/GET/GET/POST | /auth/login, /auth/me, /auth/csrf, /auth/logout | operator | ada (`csrf_token` optional) | 0.1 → 0.3.1 |
| 21 | GET | /admin/referrals | operator | ada (+ `hospital_name`) | 0.1 → 0.3.1 |
| 22 | PATCH | /admin/referrals/{id}/status | operator + CSRF | ada | 0.1 |
| 23 | GET | /admin/hospitals | operator | ada | 0.2 |
| 24 | GET | /admin/hospitals/{id} | operator | ada | 0.2 |
| 25 | PATCH | /admin/hospitals/{id}/services/{slug} | operator + CSRF | ada | 0.1 |
| 26 | PATCH | /admin/hospitals/{id}/beds/{category} | operator + CSRF | ada | 0.1 |
| 27 | GET | /admin/bpjs-checks | operator | ada (tersamar saja) | 0.3 |
| ~~—~~ | ~~POST~~ | ~~/admin/bpjs-checks/{id}/reveal~~ | — | **DIHAPUS** (keputusan D-03) | 0.3.1 |
| int | POST | /internal/jobs/refresh-simulation | header `X-Job-Secret` | **baru, di luar OpenAPI publik** | 0.3.1 |

## 3. Perubahan v0.3.1 (BE-01, BE-03, BE-06, BE-08)

- **BPJS:** `bpjs_check_history` tidak lagi menyimpan `raw_enc`. Field tersimpan: `nik_masked` (mis. `9999********0012`), `name_masked`, `birth_year`, `nik_hmac` (untuk deteksi pengecekan berulang), `result`, `created_at` (TTL 30 hari). Endpoint reveal dihapus. Copy publik: *"Kami tidak menyimpan NIK lengkap Anda. Riwayat pengecekan disimpan dalam bentuk tersamar selama 30 hari."*
- **Wilayah:** semua `province_code`/`city_code` memakai format Kemendagri tanpa titik (`31`, `3171`). Kode bertitik dimigrasikan; filter lama dengan titik → 422.
- **Enum:** `bpjs_data_origin` dan `facility_summary.data_origin` = `DataOrigin | null`.
- **Auth:** `csrf_token` di response login bersifat **optional**; FE memakai `GET /auth/csrf` bila tidak ada.
- **Admin referral DTO:** tambah `hospital_name: string`.

## 4. Algoritma skor rekomendasi

### 4.1 Endpoint
`GET /api/v1/recommendations`

| Param | Wajib | Tipe | Keterangan |
|---|---|---|---|
| `services` | ✔ | csv slug | min 1, dari `/services` |
| `lat`, `lng` | – | number | berpasangan; bila ada, `radius_km` berlaku |
| `radius_km` | – | 5 \| 10 \| 20 \| 50 | default 20; hanya dengan lat/lng |
| `province_code`, `city_code` | – | string | alternatif lokasi bila tanpa lat/lng |
| `bpjs` | – | `required` \| `any` | default `any` |
| `dataset` | – | `real` \| `simulation` \| `all` | default `real` |
| `limit` | – | 1–20 | default 10 |

Minimal salah satu: (`lat`+`lng`) atau `province_code`/`city_code`; jika tidak → 422.

### 4.2 Filter keras (RS dikeluarkan)
1. Salah satu layanan yang diminta berstatus **`unavailable`**.
2. `bpjs=required` dan `bpjs == false`.
3. Di luar radius (jika lat/lng) atau di luar wilayah (jika kode wilayah).
4. `source_active == false` / `operational` non-aktif.

### 4.3 Komponen skor (masing-masing 0..1)

| Key | Bobot | Rumus |
|---|---|---|
| `service_match` | 0,40 | rata-rata per layanan diminta: `available`=1,0 · `limited`=0,6 · `unknown`=0,2 |
| `bed_availability` | 0,20 | rata-rata per kategori bed relevan (icu→`icu`, nicu→`nicu`, picu→`picu`, rawat-inap→`general`): `available>0`=1,0 · `available==0`=0,0 · `null`=0,3. Jika tak ada kategori relevan → komponen **dihapus** |
| `distance` | 0,20 | `max(0, 1 − d_km / radius_km)` (Haversine garis lurus). Tanpa lat/lng → komponen **dihapus** |
| `bpjs` | 0,10 | hanya bila `bpjs=required`: `true`=1,0 · `null`=0,3. Bila `any` → komponen **dihapus** |
| `data_confidence` | 0,10 | `data_quality.score / 100` (lihat §5) |

**Renormalisasi:** bobot komponen yang dihapus dibagi proporsional ke komponen yang tersisa, sehingga total bobot = 1.

**Penalti simulasi:** jika nilai yang dipakai `service_match` atau `bed_availability` berasal dari `data_origin = simulation`, kontribusi komponen tersebut × **0,8**. (Simulasi tetap ditampilkan & dilabeli, tetapi tidak boleh mengalahkan data kurasi yang setara.)

`score = round(100 × Σ bobot_i × nilai_i × penalti_i)` → integer 0–100.
`level`: `high` ≥ 75 · `medium` 50–74 · `low` < 50.
Urutan: score desc → `distance_km` asc → `name` asc.

### 4.4 Contoh perhitungan
Permintaan: `services=nicu`, lat/lng ada, `radius_km=20`, `bpjs=required`. RS A: NICU `available` (kurasi), bed nicu available=2 (kurasi), jarak 6 km, bpjs=true, data_quality 80.
- service_match 1,0 × 0,40 = 0,40
- bed 1,0 × 0,20 = 0,20
- distance (1 − 6/20)=0,70 × 0,20 = 0,14
- bpjs 1,0 × 0,10 = 0,10
- confidence 0,80 × 0,10 = 0,08
→ **score 92, level high**. Jika NICU & bed berasal dari simulasi: 0,32 + 0,16 + 0,14 + 0,10 + 0,08 = **80**.

### 4.5 Response
```json
{
  "data": [{
    "hospital": { "id": "…", "name": "…", "city_name": "…", "phone": "…", "lat": -6.2, "lng": 106.9, "facility_summary": {}, "data_quality": {} },
    "score": 92,
    "level": "high",
    "distance_km": 6.0,
    "components": [
      { "key": "service_match", "label": "Layanan yang dibutuhkan", "weight": 0.4, "value": 1.0, "contribution": 40, "reason": "NICU tersedia (kurasi, 25 Okt 2026)" }
    ],
    "unknowns": ["bed_nicu"],
    "flags": ["contains_simulated_data"]
  }],
  "meta": { "total_considered": 37, "excluded": { "service_unavailable": 3, "bpjs_false": 1 }, "weights": { "service_match": 0.4, "bed_availability": 0.2, "distance": 0.2, "bpjs": 0.1, "data_confidence": 0.1 }, "generated_at": "…", "algorithm_version": "1" }
}
```
`reason` ditulis BE dalam Bahasa Indonesia, FE menampilkannya apa adanya. `algorithm_version` naik setiap rumus berubah.

## 5. Kualitas data (`data_quality`)

Ditambahkan ke DTO Hospital di list, detail, compare, rekomendasi, markers (ringkas).

```json
"data_quality": { "score": 72, "label": "cukup", "completeness": 0.8, "freshness": "aging", "primary_origin": "curated" }
```
- `completeness` = proporsi field kunci yang tidak null dari: `phone`, `lat/lng`, `bpjs`, status 6 layanan, 4 kategori bed (12 item).
- `freshness_factor`: fresh 1,0 · aging 0,7 · stale 0,3 · unknown 0,2 (memakai kesegaran **terburuk** dari layanan/bed yang ada).
- `origin_factor`: curated 1,0 · satusehat_* 0,8 · simulation 0,5 (origin mayoritas layanan/bed; bila kosong, origin RS).
- `score = round(100 × (0,5·completeness + 0,25·freshness_factor + 0,25·origin_factor))`.
- `label`: `baik` ≥ 75 · `cukup` 50–74 · `terbatas` < 50.

## 6. Insights (v0.5.0)

Semua mendukung `province_code` opsional dan `dataset` (default `real`). Response boleh di-cache 5 menit (`Cache-Control: public, max-age=300`). Setiap response punya `meta.generated_at` dan `meta.sources`.

| Endpoint | Response `data` |
|---|---|
| `GET /insights/summary` | `{ hospital_count, city_count, curated_count, simulated_facility_count, fresh_ratio, with_known_bpjs_ratio }` |
| `GET /insights/coverage` | `[{ city_code, city_name, hospital_count, by_class: {A,B,C,D,unknown}, curated_count }]` |
| `GET /insights/service-gaps?service=nicu` | `[{ city_code, city_name, available, limited, unavailable, unknown, gap: bool }]` — `gap = available+limited == 0` |
| `GET /insights/freshness` | `[{ data_origin, fresh, aging, stale, unknown }]` |

Catatan wajib di UI: gap berarti **"tidak ada RS dengan layanan tersebut yang tercatat tersedia di data kami"**, bukan klaim faktual tentang wilayah.

## 7. Markers peta (v0.4.0)

`GET /hospitals/markers?bbox=minLng,minLat,maxLng,maxLat&services=&bpjs=&dataset=` → maks 500:
```json
{ "data": [{ "id": "…", "name": "…", "lat": -6.2, "lng": 106.8, "match": "all|partial|none", "data_quality_label": "cukup", "has_simulated_data": true }], "meta": { "truncated": false } }
```
bbox tidak valid / luas > 2° × 2° → 422.

## 8. Kepatuhan FE

- Tipe di `lib/contracts/types.ts`, fungsi di `lib/api/endpoints.ts`, label di `lib/contracts/labels.ts`.
- FE **tidak** menghitung ulang skor rekomendasi atau kualitas data; hanya menampilkan. Pengecualian: penanda "unggul" di bandingkan (FE-13) dihitung FE dari data compare.
