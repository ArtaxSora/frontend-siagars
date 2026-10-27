# Changelog API SiagaRS

> Salinan changelog **backend** (dari tim backend) sebagai rujukan frontend.
> Sumber aslinya `CHANGELOG.md` di repo backend.

Untuk tim frontend. Versi mengikuti `info.version` di [`openapi.yaml`](openapi.yaml) dan tampil di `/docs`. Selama masih 0.x, perubahan bersifat **aditif** kecuali dicatat sebagai "Perubahan perilaku".

## 0.2.1 (25 Okt 2026) - branch `develop` (staging)

### Baru: data contoh fasilitas untuk RS nyata
SATUSEHAT sandbox tidak menyediakan ICU/NICU/PICU/bed/rawat inap/BPJS, jadi RS nyata sebelumnya berisi `unknown`/`null` semua. Agar FE bisa membangun dan menguji UI dengan nama RS nyata, backend menempelkan **data contoh deterministik** (perintah `dummy-facilities`, hanya ke database dev/staging):
- Layanan `icu`, `nicu`, `picu`, `igd-24h`, `ambulance`, `rawat-inap`; bed `general`/`icu`/`nicu`/`picu` (sebagian RS sengaja tanpa bed -> `null`); dan `bpjs`.
- Peluang ketersediaan mengikuti kelas RS (A/B lebih lengkap), tetapi angkanya **bukan fakta**.
- Semua item: `data_origin: "simulation"`, `source_url: null`, `verified_at: null`. `data_origin` RS tetap `satusehat_sandbox`.
- Tidak menimpa data yang sudah ada (kurasi atau pembaruan operator). Mengulang perintah tidak mengubah apa pun.

### Field baru (aditif)
| Field | Isi |
|---|---|
| `bpjs_data_origin` (Hospital) | Asal nilai `bpjs`: `simulation`, `curated`, atau `null` bila `bpjs` null. |
| `facility_summary.data_origin` | `simulation` bila ada angka contoh di ringkasan; asal data bersumber bila tidak; `null` bila tidak ada data. |

### Yang harus dilakukan FE
- Tampilkan label **"Simulasi"** di badge/ringkasan bila `facility_summary.data_origin == "simulation"` dan di BPJS bila `bpjs_data_origin == "simulation"`. Jangan menyajikannya sebagai fakta RS.
- `freshness` data contoh dihitung dari `source_updated_at` seperti biasa, jadi berubah menjadi `stale` setelah 24 jam sejak data ditempel. Itu perilaku yang benar, bukan bug.
- Filter `services=icu` kini mengembalikan RS nyata berstatus contoh `available`/`limited`. Hasil ini tetap simulasi.
- Begitu backend mengkurasi data bersumber, nilai contoh diganti (field sama, `data_origin: "curated"`). Tidak perlu mengubah kode.

## 0.2.0 (25 Okt 2026) - branch `develop` (staging)

### Baru
| Endpoint | Fungsi |
|---|---|
| `GET /regions` | Provinsi + kota/kabupaten; pakai `code` apa adanya untuk `province_code`/`city_code`. |
| `GET /hospitals/suggest?q=&limit=&dataset=` | Autocomplete nama RS (maks 20 hasil). |
| `GET /admin/hospitals` | RS dalam scope operator (butuh login), lengkap dengan `version` layanan/bed. |
| `GET /admin/hospitals/{id}` | Detail satu RS dalam scope operator; di luar scope = 403. |

### Field baru pada objek `Hospital` (list, detail, compare, tracking)
| Field | Isi |
|---|---|
| `external_id`, `source_namespace` | Kode dari sumber (SATUSEHAT `kode_satusehat`); `null` untuk simulasi. |
| `facility_class`, `facility_subtype` | `{code, name}` atau `null` (kelas RS A/B/C/D, jenis RS). |
| `operational` | `true/false/null`. |
| `bpjs_source_url`, `bpjs_source_updated_at` | Sumber dan tanggal data BPJS; `null` bila belum dikurasi. |
| `facility_summary` | `{icu, nicu, picu, rawat_inap, bpjs, inpatient_beds{total,available,freshness}, last_source_updated_at}`. Pakai ini untuk badge/filter di UI. |

### Perubahan perilaku
- `GET /hospitals/{id}` dan `GET /hospitals/compare` menerima **UUID atau `external_id`**. Dua ID yang merujuk RS sama (UUID dan kodenya) ditolak `422`. ID yang bukan UUID dan bukan kode valid kini `404` (sebelumnya `422` pada compare).
- Parameter `q` berawalan `$` kini teks biasa (bug lama diperbaiki).
- Semua respons menambah header `X-Frame-Options: DENY` dan `Referrer-Policy: no-referrer`.
- Layanan baru `rawat-inap` muncul di `GET /services` dan di `services` RS simulasi. Bed rawat inap tetap kategori `general`.

### Yang harus diperhatikan FE
- **RS nyata dari SATUSEHAT belum punya data ICU/NICU/PICU/bed/BPJS.** `facility_summary` berisi `unknown`/`null`. Tampilkan sebagai "belum diketahui", bukan "tidak tersedia". Data lengkap untuk pengembangan UI ada di `dataset=simulation` (atau `all`).
- `facility_class.name` dan `facility_subtype.name` terisi di environment yang sudah sinkron ulang; bila `null`, tampilkan `code`.
- Tidak ada field yang dihapus atau diganti nama; kode FE 0.1.0 tetap jalan.

### Environment
- Staging (`develop`): URL Vercel Preview branch `develop`, database `siagars_dev`. Akun uji operator dibagikan terpisah oleh pemilik backend (bukan di repo).
- Production (`main`) tetap 0.1.0 sampai dirilis.

## 0.1.0 (24 Okt 2026)
Baseline: 15 operasi (health, layanan, daftar/detail/compare RS, lookup tracking, auth operator, admin referral/layanan/bed).
