import "server-only";

import { cache } from "react";
import { fetchOrganization } from "./data-access";
import type { OrganizationDto } from "./schemas";

/**
 * Request-memoized loader for the singleton organization profile.
 */
export const getOrganization = cache(async (): Promise<OrganizationDto> => {
  return fetchOrganization();
});
