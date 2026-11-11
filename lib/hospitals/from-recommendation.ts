import { EMPTY_QUERY, serializeHospitalQuery } from "./query.ts";
import type { WizardState } from "../recommendations/wizard.ts";

export function searchHrefFromRecommendation(state: WizardState): string {
  return `/rumah-sakit?${serializeHospitalQuery({
    ...EMPTY_QUERY,
    services: state.services,
    bpjs: state.bpjs === "required",
    dataset: state.dataset,
    province_code: state.province_code,
    city_code: state.city_code,
    lat: state.lat,
    lng: state.lng,
    sort: state.lat !== null && state.lng !== null ? "distance" : "match",
  })}`;
}
