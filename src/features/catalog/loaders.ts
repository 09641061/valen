import "server-only";

import { cache } from "react";
import { fetchCatalog } from "./data-access";
import type { CategoryDto } from "./schemas";

/**
 * Request-memoized loader for the full ordered catalog.
 */
export const getCatalog = cache(async (): Promise<CategoryDto[]> => {
  return fetchCatalog();
});
