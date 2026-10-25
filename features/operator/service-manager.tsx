"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiError, toApiError } from "@/lib/api/client";
import { getHospital, patchHospitalBeds, patchHospitalService } from "@/lib/api/endpoints";
import { SERVICE_STATUS_LABEL, bedCategoryLabel } from "@/lib/contracts/labels";
import {
  SERVICE_STATUSES,
  type HospitalBed,
  type HospitalService,
  type ServiceStatus,
} from "@/lib/contracts/types";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { SourceLine, StatusBadge } from "@/components/ui/badges";
import { useOperator } from "@/features/operator/operator-shell";
import { mutationMessage } from "@/features/operator/mutation-errors";
import { Button } from "@/components/ui/button";
import { Field, inputClasses } from "@/components/ui/field";
import { SimulationNotice } from "@/components/ui/notices";
import { useHospitalNames } from "@/features/operator/use-hospital-names";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/ui/states";

interface RowCallbacks {
  hospitalId: string;
  onSaved: (key: string) => void;
  onConflict: (key: string) => void;
}

function RowError({ error }: { error: ApiError }) {
  return (
    <p role="alert" className="rounded-md bg-bad-bg px-3 py-2 text-bad-fg">
      {mutationMessage(error)}
      {error.requestId && (
        <span className="mt-1 block text-[12px] text-muted">
          Kode referensi: <code className="font-mono">{error.requestId}</code>
        </span>
      )}
    </p>
  );
}

function ServiceRow({
  service,
  hospitalId,
  onSaved,
  onConflict,
}: RowCallbacks & { service: HospitalService }) {
  const { handleAuthError } = useOperator();
  const [status, setStatus] = useState<ServiceStatus>(service.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const key = `svc:${service.slug}`;
  const id = `service-${service.slug}`;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await patchHospitalService(hospitalId, service.slug, {
        status,
        version: service.version,
      });
      onSaved(key);
    } catch (err) {
      const apiError = toApiError(err);
      if (handleAuthError(apiError)) return;
      if (apiError.status === 409) {
        setSaving(false);
        onConflict(key);
        return;
      }
      setError(apiError);
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 rounded-md border border-line bg-surface p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[16px] font-semibold">{service.name}</h3>
        <StatusBadge status={service.status} />
      </div>
      <SourceLine source={service} compact />
      <Field id={id} label="Status layanan">
        <select
          id={id}
          className={inputClasses}
          value={status}
          onChange={(e) => setStatus(e.target.value as ServiceStatus)}
        >
          {SERVICE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {SERVICE_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </Field>
      {error && <RowError error={error} />}
      <div>
        <Button
          type="submit"
          loading={saving}
          loadingLabel="Menyimpan…"
          disabled={status === service.status}
        >
          Simpan
        </Button>
      </div>
    </form>
  );
}

/** "" = belum diketahui (null); angka tidak valid = undefined. */
function parseCount(raw: string): number | null | undefined {
  const t = raw.trim();
  if (t === "") return null;
  if (!/^\d+$/.test(t)) return undefined;
  const n = Number.parseInt(t, 10);
  return Number.isSafeInteger(n) ? n : undefined;
}

function BedRow({
  bed,
  hospitalId,
  onSaved,
  onConflict,
}: RowCallbacks & { bed: HospitalBed }) {
  const { handleAuthError } = useOperator();
  const [total, setTotal] = useState(bed.total === null ? "" : String(bed.total));
  const [available, setAvailable] = useState(
    bed.available === null ? "" : String(bed.available),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const key = `bed:${bed.category}`;
  const label = bedCategoryLabel(bed.category);

  const totalN = parseCount(total);
  const availableN = parseCount(available);
  const validation =
    totalN === undefined || availableN === undefined
      ? "Isi dengan bilangan bulat ≥ 0, atau kosongkan bila belum diketahui."
      : totalN !== null && availableN !== null && availableN > totalN
        ? "Tersedia tidak boleh melebihi total."
        : null;
  const unchanged = totalN === bed.total && availableN === bed.available;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving || validation || totalN === undefined || availableN === undefined) return;
    setSaving(true);
    setError(null);
    try {
      await patchHospitalBeds(hospitalId, bed.category, {
        total: totalN,
        available: availableN,
        version: bed.version,
      });
      onSaved(key);
    } catch (err) {
      const apiError = toApiError(err);
      if (handleAuthError(apiError)) return;
      if (apiError.status === 409) {
        setSaving(false);
        onConflict(key);
        return;
      }
      setError(apiError);
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 rounded-md border border-line bg-surface p-4"
    >
      <h3 className="text-[16px] font-semibold">{label}</h3>
      <SourceLine source={bed} compact />
      {bed.available === null && (
        <p className="text-unk-fg">
          Saat ini belum diketahui (bukan nol). Kosongkan kolom bila belum
          diketahui; isi hanya bila Anda memastikannya.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id={`bed-total-${bed.category}`} label="Total tempat tidur">
          <input
            id={`bed-total-${bed.category}`}
            type="number"
            inputMode="numeric"
            min={0}
            className={inputClasses}
            value={total}
            onChange={(e) => setTotal(e.target.value)}
          />
        </Field>
        <Field id={`bed-available-${bed.category}`} label="Tersedia">
          <input
            id={`bed-available-${bed.category}`}
            type="number"
            inputMode="numeric"
            min={0}
            className={inputClasses}
            value={available}
            onChange={(e) => setAvailable(e.target.value)}
          />
        </Field>
      </div>
      {!unchanged && validation && (
        <p role="alert" className="text-[12px] font-semibold text-bad-fg">
          {validation}
        </p>
      )}
      {error && <RowError error={error} />}
      <div>
        <Button
          type="submit"
          loading={saving}
          loadingLabel="Menyimpan…"
          disabled={unchanged || validation !== null}
        >
          Simpan
        </Button>
      </div>
    </form>
  );
}

function HospitalEditor({ hospitalId }: { hospitalId: string }) {
  const { handleAuthError } = useOperator();
  const res = useApiResource(`hospital:${hospitalId}`, (signal) =>
    getHospital(hospitalId, signal),
  );
  const [notices, setNotices] = useState<Record<string, string>>({});

  useEffect(() => {
    if (res.error) handleAuthError(res.error);
  }, [res.error, handleAuthError]);

  if (res.error) {
    if (res.error.status === 401) {
      return <LoadingBlock label="Mengalihkan ke halaman login…" rows={1} />;
    }
    if (res.error.status === 403) {
      return (
        <EmptyState
          title="Tidak berwenang"
          description="Akun ini tidak berwenang untuk rumah sakit tersebut."
        />
      );
    }
    return (
      <ErrorState
        error={res.error}
        onRetry={res.reload}
        title="Data rumah sakit tidak dapat dimuat"
      />
    );
  }
  const hospital = res.data?.data.id === hospitalId ? res.data.data : null;
  if (!hospital) return <LoadingBlock label="Memuat data rumah sakit…" />;

  const callbacks: RowCallbacks = {
    hospitalId,
    onSaved: (key) => {
      setNotices((p) => ({ ...p, [key]: "Perubahan tersimpan di server." }));
      res.reload();
    },
    onConflict: (key) => {
      setNotices((p) => ({
        ...p,
        [key]:
          "Data telah diubah pihak lain, jadi dimuat ulang. Tinjau lagi sebelum menyimpan.",
      }));
      res.reload();
    },
  };

  const notice = (key: string) =>
    notices[key] ? (
      <p role="status" className="rounded-md bg-ok-bg px-3 py-2 text-ok-fg">
        {notices[key]}
      </p>
    ) : null;

  return (
    <div className="flex flex-col gap-6">
      {hospital.data_origin === "simulation" && <SimulationNotice />}
      <section className="flex flex-col gap-3">
        <h2 className="text-[18px] font-semibold leading-[26px]">Layanan</h2>
        <ul className="grid gap-3 lg:grid-cols-2">
          {hospital.services.map((svc) => (
            <li key={`${svc.slug}-${svc.version}`} className="flex flex-col gap-2">
              {notice(`svc:${svc.slug}`)}
              <ServiceRow service={svc} {...callbacks} />
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-[18px] font-semibold leading-[26px]">Tempat tidur</h2>
        {hospital.beds.length === 0 ? (
          <p className="text-muted">Belum ada kategori tempat tidur yang dilacak.</p>
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {hospital.beds.map((bed) => (
              <li key={`${bed.category}-${bed.version}`} className="flex flex-col gap-2">
                {notice(`bed:${bed.category}`)}
                <BedRow bed={bed} {...callbacks} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function ServiceManager() {
  const { operator } = useOperator();
  const [hospitalId, setHospitalId] = useState(operator.hospital_ids[0] ?? "");
  const names = useHospitalNames(operator.hospital_ids);

  if (operator.hospital_ids.length === 0) {
    return (
      <EmptyState
        title="Belum ada rumah sakit yang ditugaskan"
        description="Akun operator ini belum ditugaskan ke rumah sakit mana pun."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[24px] font-bold leading-8">Layanan &amp; tempat tidur</h1>
      <div className="max-w-md">
        <Field id="operator-hospital" label="Rumah sakit">
          <select
            id="operator-hospital"
            className={inputClasses}
            value={hospitalId}
            onChange={(e) => setHospitalId(e.target.value)}
          >
            {operator.hospital_ids.map((id) => (
              <option key={id} value={id}>
                {names[id] ?? id}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <HospitalEditor key={hospitalId} hospitalId={hospitalId} />
    </div>
  );
}
