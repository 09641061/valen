import "server-only";

import {
  CynthiaApiError,
  cynthiaFetch,
  formatIfMatchHeader,
  type ApiErrorCode,
} from "@/lib/cynthia-client";
import {
  OrganizationSchema,
  type BusinessHours,
  type OrganizationDto,
} from "./schemas";

export { CynthiaApiError as OrganizationApiError };
export type OrganizationErrorCode = ApiErrorCode;

export async function fetchOrganization(): Promise<OrganizationDto> {
  const response = await cynthiaFetch("/v1/organization");
  return OrganizationSchema.parse(await response.json());
}

export type OrganizationPatchPayload = {
  name?: string;
  contact_email?: string;
  timezone?: string;
  currency_code?: string;
  business_hours?: BusinessHours;
  ai_instructions?: string;
  whatsapp_phone_number?: string;
  whatsapp_phone_number_id?: string;
  whatsapp_enabled?: boolean;
};

export async function patchOrganization(
  version: number,
  payload: OrganizationPatchPayload,
): Promise<OrganizationDto> {
  const response = await cynthiaFetch("/v1/organization", {
    method: "PATCH",
    headers: { "If-Match": formatIfMatchHeader(version) },
    body: JSON.stringify(payload),
  });
  return OrganizationSchema.parse(await response.json());
}
