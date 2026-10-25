"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiError, toApiError } from "@/lib/api/client";
import { listAdminReferrals, patchReferralStatus } from "@/lib/api/endpoints";
import { REFERRAL_STATUS_LABEL, isRedirect } from "@/lib/contracts/labels";
import {
  ALLOWED_TRANSITIONS,
  type Referral,
  type ReferralStatus,
} from "@/lib/contracts/types";
import { formatWib } from "@/lib/format/time";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { ReferralStatusBadge } from "@/features/referrals/referral-status-badge";
import { useHospitalNames } from "@/features/operator/use-hospital-names";
import { useOperator } from "@/features/operator/operator-shell";
import { mutationMessage } from "@/features/operator/mutation-errors";
import { Button } from "@/components/ui/button";
import { Field, describedBy, inputClasses } from "@/components/ui/field";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/ui/states";

const NOTE_MAX = 280;

function ReferralRow({
  referral,
  names,
  onSaved,
  onConflict,
}: {
  referral: Referral;
  names: Record<string, string>;
  onSaved: (id: string) => void;
  onConflict: (id: string) => void;
}) {
  const { handleAuthError } = useOperator();
  const [status, setStatus] = useState<ReferralStatus | "">("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const transitions = ALLOWED_TRANSITIONS[referral.status];
  const terminal = transitions.length === 0;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving || status === "") return;
    setSaving(true);
    setError(null);
    try {
      // Tanpa retry otomatis: satu klik = satu permintaan.
      await patchReferralStatus(referral.id, {
        status,
        public_note: note.trim(),
        version: referral.version,
      });
      onSaved(referral.id);
    } catch (err) {
      const apiError = toApiError(err);
      if (handleAuthError(apiError)) return;
      if (apiError.status === 409) {
        setSaving(false);
        onConflict(referral.id);
        return;
      }
      setError(apiError);
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-md border border-line bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-semibold">
            Rujukan <span className="font-mono">{referral.id.slice(0, 8)}</span>
          </h2>
          <p className="text-muted">
            Dari: {names[referral.owner_hospital_id] ?? referral.owner_hospital_id}
          </p>
          {referral.destination_hospital_id && (
            <p className="text-muted">
              Tujuan:{" "}
              {names[referral.destination_hospital_id] ??
                referral.destination_hospital_id}
            </p>
          )}
          <p className="text-[12px] text-muted tabular-nums">
            Diperbarui {formatWib(referral.updated_at) ?? "—"} · versi {referral.version}
          </p>
        </div>
        <ReferralStatusBadge status={referral.status} />
      </div>

      {referral.public_note && (
        <p className="whitespace-pre-wrap break-words rounded-md bg-well p-3">
          <span className="text-[11px] font-semibold tracking-[0.02em] text-faint">
            CATATAN PUBLIK SAAT INI
          </span>
          <br />
          {referral.public_note}
        </p>
      )}

      {terminal ? (
        <p className="text-muted">
          Status akhir — tidak ada perubahan yang dapat dilakukan.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
          <Field
            id={`status-${referral.id}`}
            label="Ubah status ke"
            hint="Server tetap memvalidasi transisi; yang tidak sah ditolak."
          >
            <select
              id={`status-${referral.id}`}
              className={inputClasses}
              value={status}
              onChange={(e) => setStatus(e.target.value as ReferralStatus | "")}
              aria-describedby={describedBy(`status-${referral.id}`, {
                hint: true,
              })}
            >
              <option value="">Pilih status…</option>
              {transitions.map((s) => (
                <option key={s} value={s}>
                  {isRedirect(referral.status, s)
                    ? `${REFERRAL_STATUS_LABEL[s]} (dialihkan)`
                    : REFERRAL_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>

          <Field
            id={`note-${referral.id}`}
            label="Catatan publik (terlihat oleh pemegang kode; wajib alasan bila dialihkan)"
            hint={`Wajib. Jangan tulis nama, NIK, diagnosis, atau data pasien. ${note.length}/${NOTE_MAX}`}
          >
            <textarea
              id={`note-${referral.id}`}
              rows={3}
              maxLength={NOTE_MAX}
              className={`${inputClasses} py-2`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              aria-describedby={describedBy(`note-${referral.id}`, {
                hint: true,
              })}
            />
          </Field>

          {error && (
            <p role="alert" className="rounded-md bg-bad-bg px-3 py-2 text-bad-fg">
              {mutationMessage(error)}
              {error.requestId && (
                <span className="mt-1 block text-[12px] text-muted">
                  Kode referensi: <code className="font-mono">{error.requestId}</code>
                </span>
              )}
            </p>
          )}

          <div>
            <Button
              type="submit"
              loading={saving}
              loadingLabel="Menyimpan…"
              disabled={status === "" || note.trim().length === 0}
            >
              Simpan perubahan
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export function ReferralManager() {
  const { handleAuthError } = useOperator();
  const list = useApiResource("admin:referrals", (signal) =>
    listAdminReferrals(signal),
  );
  const [notices, setNotices] = useState<Record<string, string>>({});

  useEffect(() => {
    if (list.error) handleAuthError(list.error);
  }, [list.error, handleAuthError]);

  const referrals = list.data?.data ?? [];
  const names = useHospitalNames(
    referrals.flatMap((r) =>
      r.destination_hospital_id
        ? [r.owner_hospital_id, r.destination_hospital_id]
        : [r.owner_hospital_id],
    ),
  );

  function setNotice(id: string, message: string) {
    setNotices((prev) => ({ ...prev, [id]: message }));
  }

  if (list.error) {
    if (list.error.status === 401) {
      return <LoadingBlock label="Mengalihkan ke halaman login…" rows={1} />;
    }
    if (list.error.status === 403) {
      return (
        <EmptyState
          title="Tidak berwenang"
          description="Akun ini tidak memiliki akses ke daftar rujukan."
        />
      );
    }
    return (
      <ErrorState
        error={list.error}
        onRetry={list.reload}
        title="Daftar rujukan tidak dapat dimuat"
      />
    );
  }

  if (list.data === null) return <LoadingBlock label="Memuat rujukan…" />;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[24px] font-bold leading-8">Rujukan simulasi</h1>
      <p className="text-muted">
        Hanya rujukan untuk rumah sakit yang ditugaskan kepada Anda. Semua data
        bersifat simulasi.
      </p>
      {referrals.length === 0 ? (
        <EmptyState title="Belum ada rujukan" description="Tidak ada rujukan simulasi untuk rumah sakit Anda." />
      ) : (
        <ul className="flex flex-col gap-4">
          {referrals.map((r) => (
            <li key={`${r.id}-${r.version}`} className="flex flex-col gap-2">
              {notices[r.id] && (
                <p
                  role="status"
                  className="rounded-md bg-ok-bg px-3 py-2 text-ok-fg"
                >
                  {notices[r.id]}
                </p>
              )}
              <ReferralRow
                referral={r}
                names={names}
                onSaved={(id) => {
                  setNotice(id, "Perubahan tersimpan di server.");
                  list.reload();
                }}
                onConflict={(id) => {
                  setNotice(
                    id,
                    "Data telah diubah pihak lain, jadi dimuat ulang. Tinjau lagi sebelum menyimpan.",
                  );
                  list.reload();
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
