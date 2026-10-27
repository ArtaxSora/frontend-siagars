# SiagaRS API v0.1 — Panduan Integrasi Frontend

Dokumen ini ditujukan untuk **M. Tauriq Arya / tim frontend**. Isinya menjelaskan cara memakai API versi saat ini tanpa perlu membaca kode Go.

Sumber kontrak resmi tetap [`openapi.yaml`](openapi.yaml). Bila dokumen ini berbeda dengan OpenAPI, ikuti OpenAPI dan koordinasikan perubahan dengan pemilik backend. Contoh respons lengkap tersedia di [`fixtures.json`](fixtures.json).

## 1. Ringkasan cepat

- Base URL development langsung: `http://localhost:8080/api/v1`
- Rekomendasi Next.js: panggil path relatif `/api/v1/...` melalui rewrite ke backend.
- Format: JSON `snake_case`, waktu RFC3339 UTC, UUID lowercase.
- Semua respons memakai `Cache-Control: no-store` dan header `X-Request-ID`.
- Semua request dengan body wajib memakai `Content-Type: application/json`.
- Body maksimal 64 KB. Field JSON yang tidak dikenal ditolak.
- Daftar RS default memakai `dataset=real`; gunakan `dataset=simulation` untuk demo seed.
- Tidak ada CORS wildcard. Alur browser dirancang memakai satu origin/rewrite.
- Session operator disimpan dalam cookie `HttpOnly`; frontend tidak membaca token session.

Dokumentasi interaktif tersedia ketika backend berjalan:

- Swagger UI: `http://localhost:8080/docs`
- OpenAPI runtime: `http://localhost:8080/docs/openapi.json`
- Liveness: `http://localhost:8080/api/v1/health`
- Readiness: `http://localhost:8080/api/v1/ready`

## 2. Setup Next.js

Contoh `next.config.ts` untuk development:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8080/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
```

Backend development harus memakai:

```text
PUBLIC_ORIGIN=http://localhost:3000
```

Gunakan wrapper fetch berikut agar cookie operator selalu ikut dan error API memiliki bentuk yang konsisten:

```ts
export type ApiErrorBody = {
  error: { code: string; message: string };
  request_id: string;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public requestId: string,
    message: string,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    ...init,
    credentials: 'include',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  const body = await response.json();
  if (!response.ok) {
    const failure = body as ApiErrorBody;
    throw new ApiError(
      response.status,
      failure.error.code,
      failure.request_id,
      failure.error.message,
    );
  }
  return body as T;
}
```

## 3. Bentuk data utama

```ts
export type DataOrigin =
  | 'curated'
  | 'simulation'
  | 'satusehat_sandbox'
  | 'satusehat_production';

export type Freshness = 'fresh' | 'aging' | 'stale' | 'unknown';
export type ServiceStatus =
  | 'available'
  | 'limited'
  | 'unavailable'
  | 'unknown';
export type BedCategory = 'icu' | 'nicu' | 'picu' | 'general';
export type ReferralStatus =
  | 'submitted'
  | 'verified'
  | 'searching'
  | 'confirmed'
  | 'completed'
  | 'rejected';

export interface Provenance {
  data_origin: DataOrigin;
  source_url: string | null;
  source_updated_at: string | null;
  synced_at: string | null;
  verified_at: string | null;
  freshness: Freshness;
}

export interface HospitalService extends Provenance {
  slug: string;
  name: string;
  status: ServiceStatus;
  version: number;
}

export interface HospitalBed extends Provenance {
  category: BedCategory;
  total: number | null;
  available: number | null;
  version: number;
}

export interface Hospital extends Provenance {
  id: string;
  name: string;
  address: string | null;
  city_code: string;
  city_name: string;
  province_code: string;
  province_name: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  bpjs: boolean | null;
  distance_km: number | null;
  services: HospitalService[];
  beds: HospitalBed[];
}
```

Aturan tampilan penting:

- `null` berarti belum diketahui. Jangan ubah menjadi `false`, `0`, atau teks yang menyatakan tidak tersedia.
- `available: 0` berarti jumlah diketahui dan sedang nol. Ini berbeda dari `available: null`.
- `bpjs: null` berarti status BPJS belum diketahui, bukan berarti tidak menerima BPJS.
- `latitude` dan `longitude` selalu sama-sama terisi atau sama-sama `null`.
- `freshness` dihitung dari `source_updated_at`: kurang dari 1 jam `fresh`, 1–24 jam `aging`, lebih dari 24 jam `stale`, sedangkan waktu kosong/masa depan `unknown`.
- `synced_at` adalah waktu sinkronisasi, bukan bukti bahwa fakta masih baru.
- `verified_at: null` berarti belum ada verifikasi manusia yang direkam.
- `data_origin=simulation` harus diberi label **Simulasi** di UI. Data ini bukan fakta layanan RS nyata.

## 4. Endpoint publik

### `GET /health`

Liveness proses API. Tidak memeriksa database.

```json
{ "data": { "status": "ok" } }
```

### `GET /ready`

Memeriksa koneksi database dan migration. `200` berarti siap; `503 not_ready` berarti frontend sebaiknya menampilkan layanan belum tersedia.

```json
{ "data": { "status": "ready" } }
```

### `GET /services`

Mengambil master layanan untuk filter. Panggil endpoint ini agar frontend tidak meng-hardcode slug dan label.

```ts
type ServicesResponse = {
  data: Array<{ slug: string; name: string; category: string }>;
};
```

### `GET /hospitals`

Daftar dan pencarian rumah sakit. Respons list sudah berisi DTO `Hospital` lengkap, termasuk layanan dan bed; kartu daftar boleh memakai subset field tersebut.

| Query | Aturan |
|---|---|
| `q` | Substring pada gabungan nama, kota, dan provinsi; maksimal 100 karakter |
| `province_code` | Filter kode provinsi |
| `city_code` | Filter kode kota/kabupaten |
| `services` | Slug dipisah koma, memakai logika **AND**; setiap layanan harus berstatus `available` atau `limited` |
| `bpjs` | `true` atau `false`; nilai `null` tidak cocok dengan keduanya |
| `has_available_beds` | `true` hanya cocok bila ada bed `available > 0`, `fresh`, dan bukan simulasi; `false` tidak menambah filter |
| `lat`, `lng` | Harus hadir berpasangan; latitude -90..90, longitude -180..180 |
| `sort` | `name` (default), `distance`, atau `match` |
| `dataset` | `real` (default), `simulation`, atau `all` |
| `page` | Default 1 |
| `limit` | Default 20, maksimum 50 |

`sort=distance` wajib disertai `lat` dan `lng`. `distance_km` adalah jarak Haversine garis lurus, bukan waktu tempuh atau ukuran kualitas klinis. Koordinat yang tidak diketahui ditempatkan terakhir.

`sort=match` memberi urutan deterministik berdasarkan kecocokan layanan dan freshness. Nilainya tidak dikirim sebagai skor dan tidak boleh ditampilkan sebagai skor kualitas klinis.

Contoh untuk data demo:

```ts
const params = new URLSearchParams({
  dataset: 'simulation',
  services: 'nicu,icu',
  page: '1',
  limit: '20',
});

const result = await apiFetch<{
  data: Hospital[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    as_of: string;
    data_scope: 'pilot';
    dataset?: 'real' | 'simulation' | 'all';
  };
}>(`/hospitals?${params}`);
```

Parameter yang tidak dikenal, kosong, atau dikirim berulang menghasilkan `422 validation_error`. Frontend sebaiknya tidak mengirim query dengan string kosong; hapus parameter tersebut dari URL.

Catatan kode wilayah versi ini: data seed memakai contoh bertitik seperti `31.71`, sedangkan data MSI Sandbox memakai kode tanpa titik seperti `3171`. Kirim kembali kode yang diperoleh dari API; jangan menebak atau mengubah formatnya di frontend.

### `GET /hospitals/{id}`

Mengambil detail satu RS. ID harus UUID lowercase.

```ts
type HospitalDetailResponse = {
  data: Hospital;
  meta: { as_of: string };
};
```

RS simulasi tetap dapat dibuka melalui detail meskipun daftar default menggunakan `dataset=real`.

### `GET /hospitals/compare`

Query: `ids=<id1>,<id2>[,<id3>]`.

Membandingkan 2–3 RS. Urutan respons sama dengan urutan `ids`. Campuran RS real dan simulasi diperbolehkan.

```ts
const ids = selectedHospitals.map((item) => item.id).join(',');
const comparison = await apiFetch<{
  data: Hospital[];
  meta: { as_of: string; count: number };
}>(`/hospitals/compare?ids=${encodeURIComponent(ids)}`);
```

Aturan:

- Harus berisi 2 atau 3 UUID lowercase yang unik.
- Jangan kirim parameter lain, termasuk `dataset`.
- Bila satu ID tidak ditemukan, seluruh request menghasilkan `404`; tidak ada hasil parsial.

### `POST /referrals/lookup`

Lookup tracking publik sintetis. Contoh demo: `SR-DEMO-001`.

```ts
export interface TrackingHistory {
  from_status: ReferralStatus | null;
  to_status: ReferralStatus;
  public_note: string;
  created_at: string;
}

export interface TrackingResult {
  public_status: ReferralStatus;
  public_note: string;
  next_step: string;
  destination: Hospital | null;
  updated_at: string;
  history: TrackingHistory[];
}

const result = await apiFetch<{ data: TrackingResult }>(
  '/referrals/lookup',
  {
    method: 'POST',
    body: JSON.stringify({ tracking_code: 'SR-DEMO-001' }),
  },
);
```

Kode tidak dikenal menghasilkan `404 not_found`. Endpoint dibatasi 10 request/menit/IP. Jangan log atau simpan kode tracking selain yang memang diperlukan untuk alur pengguna.

## 5. Autentikasi operator

### Alur sesi

1. `POST /auth/login` dengan email/password dan header `Origin` yang sesuai `PUBLIC_ORIGIN`.
2. Browser menyimpan cookie `siagars_session` secara otomatis karena fetch memakai `credentials: 'include'`.
3. Simpan `csrf_token` dari respons login di memory aplikasi. Token juga dapat diminta ulang melalui `GET /auth/csrf` selama session masih aktif.
4. Panggil `GET /auth/me` untuk memperoleh operator dan `hospital_ids` yang menjadi scope-nya.
5. Setiap `PATCH` dan `POST /auth/logout` harus membawa `Origin` dan `X-CSRF-Token`.
6. Bila menerima `401`, hapus state login frontend dan arahkan ke halaman login.

Cookie bersifat `HttpOnly`, `SameSite=Lax`, `Path=/api/v1`, serta `Secure` pada HTTPS. Frontend tidak boleh mencoba membaca cookie lewat JavaScript.

Di browser, header `Origin` dikirim otomatis. Jangan mencoba menetapkannya secara manual melalui `fetch`; browser melarangnya. Backend mencocokkan Origin browser dengan `PUBLIC_ORIGIN`.

### `POST /auth/login`

```ts
const login = await apiFetch<{
  data: { csrf_token: string; expires_at: string };
}>('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});

setCsrfToken(login.data.csrf_token);
```

Login gagal memakai `401 unauthorized`. Batasnya 5 kegagalan/15 menit untuk pasangan IP+akun, dengan batas umum 100 request/15 menit/IP. `429` menyertakan header `Retry-After`.

### `GET /auth/me`

```ts
export interface Operator {
  id: string;
  email: string;
  hospital_ids: string[];
}

const me = await apiFetch<{ data: Operator }>('/auth/me');
```

`hospital_ids` hanya untuk menentukan UI yang relevan. Backend tetap memeriksa scope pada setiap read/write admin; frontend tidak mengirim `hospital_id` sebagai bukti otorisasi.

### `GET /auth/csrf`

```ts
const csrf = await apiFetch<{ data: { csrf_token: string } }>('/auth/csrf');
```

### `POST /auth/logout`

```ts
await apiFetch<{ data: { logged_out: boolean } }>('/auth/logout', {
  method: 'POST',
  headers: { 'X-CSRF-Token': csrfToken },
});
```

Logout mencabut session di server dan menghapus cookie.

## 6. Endpoint operator

Semua endpoint pada bagian ini memerlukan cookie session. Semua mutasi juga memerlukan header `X-CSRF-Token`.

### `GET /admin/referrals`

Mengambil rujukan dalam scope RS operator.

```ts
export interface Referral {
  id: string;
  owner_hospital_id: string;
  destination_hospital_id: string | null;
  status: ReferralStatus;
  public_note: string;
  next_step: string;
  version: number;
  is_demo: true;
  updated_at: string;
}

const referrals = await apiFetch<{ data: Referral[] }>('/admin/referrals');
```

### `PATCH /admin/referrals/{id}/status`

```ts
const updated = await apiFetch<{ data: Referral }>(
  `/admin/referrals/${referral.id}/status`,
  {
    method: 'PATCH',
    headers: { 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({
      status: 'confirmed',
      public_note: 'Konfirmasi simulasi diterima',
      version: referral.version,
    }),
  },
);
```

State machine:

```text
submitted → verified → searching → confirmed → completed
                    ↘ rejected  ↗
verified → rejected
confirmed → searching (wajib public_note/alasan)
completed dan rejected adalah status terminal
```

Transisi tidak valid dan versi basi menghasilkan `409 conflict`. Bila ini terjadi, refetch daftar/detail terbaru lalu minta pengguna mengulangi tindakan berdasarkan data baru. Jangan menaikkan `version` sendiri.

`public_note` maksimum 500 karakter dan dapat muncul pada lookup publik. UI harus memperingatkan operator agar tidak memasukkan data pasien, diagnosis, identitas internal, atau catatan sensitif.

### `PATCH /admin/hospitals/{id}/services/{slug}`

Memperbarui item layanan yang sudah ada pada RS dalam scope operator.

```ts
const service = await apiFetch<{ data: HospitalService }>(
  `/admin/hospitals/${hospitalId}/services/${slug}`,
  {
    method: 'PATCH',
    headers: { 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ status: 'limited', version: currentVersion }),
  },
);
```

Status valid: `available`, `limited`, `unavailable`, `unknown`.

### `PATCH /admin/hospitals/{id}/beds/{category}`

Memperbarui kategori bed yang sudah ada. Kategori: `icu`, `nicu`, `picu`, `general`.

```ts
const bed = await apiFetch<{ data: HospitalBed }>(
  `/admin/hospitals/${hospitalId}/beds/icu`,
  {
    method: 'PATCH',
    headers: { 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({
      total: 10,
      available: 0,
      version: currentVersion,
    }),
  },
);
```

`total` dan `available` wajib hadir, tetapi masing-masing boleh `null`. Bila keduanya angka: `0 <= available <= total`. Versi basi menghasilkan `409 conflict`.

## 7. Error handling frontend

Semua error JSON menggunakan bentuk berikut:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Pesan aman untuk pengguna"
  },
  "request_id": "request-id-example"
}
```

| HTTP | Kode umum | Tindakan frontend |
|---|---|---|
| 400 | `invalid_json` | Periksa payload/tipe/field yang dikirim; ini umumnya bug frontend |
| 401 | `unauthorized` | Hapus state sesi dan arahkan ke login |
| 403 | `invalid_origin`, `invalid_csrf`, `forbidden` | Refresh CSRF/session bila sesuai; untuk `forbidden`, jangan ulangi otomatis |
| 404 | `not_found` | Tampilkan resource/kode tidak ditemukan |
| 405 | `method_not_allowed` | Bug integrasi; periksa method |
| 409 | `conflict` | Refetch data karena version/transisi sudah berubah |
| 413 | `body_too_large` | Batasi input; body maksimum 64 KB |
| 422 | `validation_error` | Tampilkan validasi yang relevan dan periksa query/body |
| 429 | `rate_limited` | Hormati `Retry-After`; nonaktifkan submit sementara |
| 500 | `internal_error` | Tampilkan galat umum dan catat `request_id` untuk backend |
| 503 | `not_ready` | Tampilkan layanan sementara belum siap |

Jangan menampilkan raw stack trace atau mengandalkan teks `message` untuk logika aplikasi. Gunakan HTTP status dan `error.code`; tampilkan `request_id` saat meminta bantuan backend.

## 8. Urutan implementasi halaman frontend

### Daftar dan detail RS

1. Ambil `GET /services` untuk opsi filter.
2. Ambil `GET /hospitals?dataset=simulation` untuk demo atau `dataset=real` untuk data non-simulasi.
3. Render daftar dan marker peta dari halaman respons yang sama.
4. Jangan membuat marker bila koordinat `null`; daftar harus tetap berfungsi bila peta gagal.
5. Buka `GET /hospitals/{id}` saat pengguna memilih RS.

### Perbandingan RS

1. Simpan maksimal tiga ID unik.
2. Aktifkan tombol bandingkan ketika jumlah pilihan 2 atau 3.
3. Panggil `/hospitals/compare` dan pertahankan urutan yang dikembalikan.
4. Tampilkan `unknown`, `0`, provenance, dan freshness tanpa mengubah maknanya.

### Lacak rujukan

1. Kirim kode ke `POST /referrals/lookup`.
2. Tampilkan label jelas bahwa skenario saat ini sintetis/demo.
3. Render `history` sesuai urutan respons.
4. Jika `destination` null, tampilkan tujuan belum ditentukan.

### Dashboard operator

1. Login dan simpan CSRF token di memory.
2. Ambil `/auth/me`, lalu `/admin/referrals`.
3. Kirim `version` item saat melakukan PATCH.
4. Pada `409`, refetch sebelum menawarkan aksi berikutnya.
5. Setelah mutasi sukses, gunakan objek dalam respons sebagai state terbaru.

## 9. Batasan versi sekarang

- API beroperasi dalam `DEMO_MODE=true`; rujukan bukan transaksi medis produksi.
- Data MSI Sandbox dapat memiliki `bpjs: null`, `services: []`, `beds: []`, dan `freshness: unknown`.
- Data demo terdiri dari RS fiktif. Jangan menampilkan simulasi sebagai fakta RS nyata.
- Map memakai data dari halaman list aktif; belum ada endpoint bounding box.
- Rate limiter masih per instance backend.
- Pencarian `q` melakukan case folding ASCII. Hindari bergantung pada kecocokan huruf kapital non-ASCII.
- Query `q` yang diawali karakter `$` memiliki temuan backend terbuka pada review saat ini; frontend sebaiknya menolak/escape kasus tersebut sampai backend memperbaikinya.
- Endpoint dan contoh tersedia secara lokal, tetapi deployment publik belum dinyatakan siap.

## 10. Checklist integrasi Arya

- [ ] Semua fetch memakai path `/api/v1` dan `credentials: 'include'`.
- [ ] Filter demo mengirim `dataset=simulation`; jangan mengandalkan default.
- [ ] Query kosong dihapus, bukan dikirim sebagai `key=`.
- [ ] `null`, `false`, dan `0` dirender berbeda.
- [ ] Origin frontend sama dengan `PUBLIC_ORIGIN` backend.
- [ ] CSRF dikirim pada semua PATCH dan logout.
- [ ] `version` berasal dari respons terakhir; `409` memicu refetch.
- [ ] Error UI memakai status/`error.code`, sementara `request_id` dicatat untuk diagnosis.
- [ ] Data `simulation` dan status demo selalu diberi label yang jelas.
- [ ] Tidak ada credential SATUSEHAT, MongoDB, session token, atau password operator di bundle frontend.
