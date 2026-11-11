import { Suspense } from "react";
import { redirect } from "next/navigation";
import { parseWizardState } from "@/lib/recommendations/wizard";
import { searchHrefFromRecommendation } from "@/lib/hospitals/from-recommendation";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

async function LegacySearch({ searchParams }: Props) {
  const params = await searchParams;
  const state = parseWizardState({ get: (key) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] ?? null : value ?? null;
  } });
  return redirect(searchHrefFromRecommendation(state));
}

export default function PilihRsPage(props: Props) {
  return <Suspense fallback={<p>Membuka pencarian rumah sakit…</p>}><LegacySearch {...props} /></Suspense>;
}
