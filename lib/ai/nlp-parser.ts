/**
 * Client-side NLP parser deterministik untuk Asisten AI SiagaRS.
 * Menerjemahkan kalimat bebas pengguna menjadi parameter pencarian terstruktur
 * (services, province_code, city_code, bpjs, dataset) serta mendeteksi
 * kondisi gawat darurat (emergency triage red flags).
 * Fungsi murni, tanpa efek samping.
 */
import type { BpjsPreference, Province } from "../contracts/types.ts";

export interface ParsedAssistantQuery {
  rawPrompt: string;
  isEmergency: boolean;
  emergencyKeywords: string[];
  services: string[];
  bpjs: BpjsPreference;
  dataset: "real" | "all";
  province_code: string;
  city_code: string;
  locationLabel: string | null;
  explanation: string;
  isDefaultService: boolean;
}

const EMERGENCY_PATTERNS: ReadonlyArray<{ keyword: string; label: string }> = [
  { keyword: "tidak sadar", label: "Penurunan kesadaran / pingsan" },
  { keyword: "hilang kesadaran", label: "Hilang kesadaran" },
  { keyword: "pingsan", label: "Pingsan" },
  { keyword: "koma", label: "Koma" },
  { keyword: "kejang", label: "Kejang" },
  { keyword: "henti napas", label: "Henti napas" },
  { keyword: "tidak bernapas", label: "Tidak bernapas" },
  { keyword: "gagal napas", label: "Gagal napas akut" },
  { keyword: "sesak parah", label: "Sesak napas parah" },
  { keyword: "sesak berat", label: "Sesak napas berat" },
  { keyword: "sesak hebat", label: "Sesak napas hebat" },
  { keyword: "pendarahan hebat", label: "Pendarahan hebat" },
  { keyword: "perdarahan hebat", label: "Perdarahan hebat" },
  { keyword: "pendarahan", label: "Pendarahan aktif" },
  { keyword: "perdarahan", label: "Perdarahan aktif" },
  { keyword: "muntah darah", label: "Muntah darah" },
  { keyword: "nyeri dada hebat", label: "Nyeri dada akut" },
  { keyword: "serangan jantung", label: "Dugaan serangan jantung" },
  { keyword: "stroke", label: "Gejala stroke" },
  { keyword: "lemah separuh badan", label: "Kelemahan separuh badan" },
  { keyword: "tersedak", label: "Tersedak jalan napas" },
  { keyword: "keracunan", label: "Keracunan akut" },
];

const SERVICE_KEYWORDS: ReadonlyArray<{ slug: string; keywords: string[] }> = [
  {
    slug: "nicu",
    keywords: ["nicu", "neonatal", "bayi prematur", "bayi baru lahir", "perinatologi", "perina"],
  },
  {
    slug: "picu",
    keywords: ["picu", "pediatrik", "anak kritis", "anak intensif", "pediatric"],
  },
  {
    slug: "icu",
    keywords: ["icu", "intensif", "intensive care"],
  },
  {
    slug: "igd-24h",
    keywords: ["igd", "ugd", "gawat darurat", "darurat", "emergency", "24 jam"],
  },
  {
    slug: "ambulance",
    keywords: ["ambulans", "ambulance"],
  },
  {
    slug: "rawat-inap",
    keywords: ["rawat inap", "ranap", "kamar inap", "inap", "ruang rawat"],
  },
  {
    slug: "isolasi",
    keywords: ["isolasi", "ruang isolasi", "airborne"],
  },
  {
    slug: "hemodialisis",
    keywords: ["hemodialisis", "hemodialisa", "cuci darah"],
  },
];

interface KnownRegion {
  name: string;
  keywords: string[];
  province_code: string;
  city_code: string;
}

const STATIC_REGIONS: ReadonlyArray<KnownRegion> = [
  // DKI Jakarta
  { name: "Jakarta Selatan", keywords: ["jakarta selatan", "jaksel"], province_code: "31", city_code: "3174" },
  { name: "Jakarta Timur", keywords: ["jakarta timur", "jaktim"], province_code: "31", city_code: "3175" },
  { name: "Jakarta Pusat", keywords: ["jakarta pusat", "jakpus"], province_code: "31", city_code: "3171" },
  { name: "Jakarta Barat", keywords: ["jakarta barat", "jakbar"], province_code: "31", city_code: "3173" },
  { name: "Jakarta Utara", keywords: ["jakarta utara", "jakut"], province_code: "31", city_code: "3172" },
  { name: "Kepulauan Seribu", keywords: ["kepulauan seribu"], province_code: "31", city_code: "3101" },
  { name: "DKI Jakarta", keywords: ["dki jakarta", "jakarta", "dki"], province_code: "31", city_code: "" },

  // Jawa Barat
  { name: "Kota Bekasi", keywords: ["kota bekasi", "bekasi"], province_code: "32", city_code: "3275" },
  { name: "Kabupaten Bekasi", keywords: ["kabupaten bekasi", "kab bekasi"], province_code: "32", city_code: "3216" },
  { name: "Kota Bogor", keywords: ["kota bogor", "bogor"], province_code: "32", city_code: "3271" },
  { name: "Kabupaten Bogor", keywords: ["kabupaten bogor", "kab bogor"], province_code: "32", city_code: "3201" },
  { name: "Kota Depok", keywords: ["kota depok", "depok"], province_code: "32", city_code: "3276" },
  { name: "Kota Bandung", keywords: ["kota bandung", "bandung"], province_code: "32", city_code: "3273" },
  { name: "Kabupaten Bandung", keywords: ["kabupaten bandung", "kab bandung"], province_code: "32", city_code: "3204" },
  { name: "Jawa Barat", keywords: ["jawa barat", "jabar"], province_code: "32", city_code: "" },

  // Banten
  { name: "Kota Tangerang Selatan", keywords: ["tangerang selatan", "tangsel"], province_code: "36", city_code: "3674" },
  { name: "Kota Tangerang", keywords: ["kota tangerang", "tangerang kota", "tangerang"], province_code: "36", city_code: "3671" },
  { name: "Kabupaten Tangerang", keywords: ["kabupaten tangerang", "kab tangerang"], province_code: "36", city_code: "3603" },
  { name: "Banten", keywords: ["banten"], province_code: "36", city_code: "" },

  // Jawa Timur
  { name: "Kota Surabaya", keywords: ["kota surabaya", "surabaya"], province_code: "35", city_code: "3578" },
  { name: "Jawa Timur", keywords: ["jawa timur", "jatim"], province_code: "35", city_code: "" },

  // Jawa Tengah
  { name: "Kota Semarang", keywords: ["kota semarang", "semarang"], province_code: "33", city_code: "3374" },
  { name: "Jawa Tengah", keywords: ["jawa tengah", "jateng"], province_code: "33", city_code: "" },
];

export function parseAssistantQuery(
  prompt: string,
  dynamicProvinces?: Province[],
): ParsedAssistantQuery {
  const raw = prompt.trim();
  const lower = raw.toLowerCase();

  // 1. Deteksi kondisi gawat darurat
  const emergencyKeywords: string[] = [];
  for (const item of EMERGENCY_PATTERNS) {
    if (lower.includes(item.keyword)) {
      emergencyKeywords.push(item.label);
    }
  }
  const isEmergency = emergencyKeywords.length > 0;

  // 2. Deteksi layanan
  const detectedServices: string[] = [];
  for (const item of SERVICE_KEYWORDS) {
    for (const kw of item.keywords) {
      // Kata utuh atau token
      const re = new RegExp(`\\b${kw}\\b`, "i");
      if (re.test(lower)) {
        detectedServices.push(item.slug);
        break;
      }
    }
  }

  // Jika tidak menyebutkan layanan sama sekali, gunakan fallback default
  let isDefaultService = false;
  let services = [...new Set(detectedServices)];
  if (services.length === 0) {
    // Jika ada sinyal gawat darurat tapi tak ada layanan khusus -> IGD 24 jam
    if (isEmergency) {
      services = ["igd-24h"];
    } else {
      services = ["igd-24h", "rawat-inap"];
    }
    isDefaultService = true;
  }

  // 3. Deteksi preferensi BPJS
  let bpjs: BpjsPreference = "any";
  const hasBpjsMention = /\bbpjs\b|\bkis\b/.test(lower);
  const hasNegativeBpjs = /\b(tanpa|bukan|tidak|non)\s+(pakai\s+)?(bpjs|kis)\b/.test(lower);

  if (hasBpjsMention && !hasNegativeBpjs) {
    bpjs = "required";
  }

  // 4. Deteksi dataset (simulasi vs data riil)
  const dataset: "real" | "all" = /\bsimulasi\b|\bfiktif\b|\bsemua dataset\b/.test(lower)
    ? "all"
    : "real";

  // 5. Deteksi wilayah (Kota / Provinsi)
  let matchedRegion: { name: string; province_code: string; city_code: string } | null = null;

  // Coba dynamic provinces dulu jika tersedia
  if (dynamicProvinces && dynamicProvinces.length > 0) {
    // Cari kota yang lebih spesifik lebih dulu
    for (const prov of dynamicProvinces) {
      for (const city of prov.cities) {
        const cLower = city.name.toLowerCase();
        const stripped = cLower.replace(/^(kota|kabupaten|kab\.)\s+/i, "");
        if (
          lower.includes(cLower) ||
          (stripped.length >= 4 && lower.includes(stripped))
        ) {
          matchedRegion = {
            name: city.name,
            province_code: prov.code,
            city_code: city.code,
          };
          break;
        }
      }
      if (matchedRegion) break;
    }

    if (!matchedRegion) {
      for (const prov of dynamicProvinces) {
        const pLower = prov.name.toLowerCase();
        if (lower.includes(pLower)) {
          matchedRegion = {
            name: prov.name,
            province_code: prov.code,
            city_code: "",
          };
          break;
        }
      }
    }
  }

  // Fallback ke static regions jika belum cocok
  if (!matchedRegion) {
    for (const r of STATIC_REGIONS) {
      for (const kw of r.keywords) {
        if (lower.includes(kw)) {
          matchedRegion = {
            name: r.name,
            province_code: r.province_code,
            city_code: r.city_code,
          };
          break;
        }
      }
      if (matchedRegion) break;
    }
  }

  const province_code = matchedRegion?.province_code ?? "";
  const city_code = matchedRegion?.city_code ?? "";
  const locationLabel = matchedRegion?.name ?? null;

  // 6. Buat penjelasan bahasa manusia
  const serviceLabels: Record<string, string> = {
    nicu: "NICU",
    picu: "PICU",
    icu: "ICU",
    "igd-24h": "IGD 24 Jam",
    ambulance: "Ambulans",
    "rawat-inap": "Rawat Inap",
    isolasi: "Ruang Isolasi",
    hemodialisis: "Hemodialisis",
  };

  const serviceNames = services.map((s) => serviceLabels[s] ?? s.toUpperCase()).join(" + ");
  const parts: string[] = [];
  if (isDefaultService) {
    parts.push(`Layanan: ${serviceNames} (bawaan pencarian)`);
  } else {
    parts.push(`Layanan: ${serviceNames}`);
  }

  if (locationLabel) {
    parts.push(`Wilayah: ${locationLabel}`);
  } else {
    parts.push("Wilayah: Semua wilayah data pilot");
  }

  if (bpjs === "required") {
    parts.push("BPJS: Menerima BPJS");
  }

  if (dataset === "all") {
    parts.push("Dataset: Sertakan simulasi");
  }

  const explanation = parts.join(" · ");

  return {
    rawPrompt: raw,
    isEmergency,
    emergencyKeywords,
    services,
    bpjs,
    dataset,
    province_code,
    city_code,
    locationLabel,
    explanation,
    isDefaultService,
  };
}
