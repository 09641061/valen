import "server-only";

import { cynthiaFetch as baseCynthiaFetch } from "@/lib/cynthia-client";

export {
  CynthiaApiError as CatalogApiError,
  formatIfMatchHeader,
  type ApiErrorCode as CatalogErrorCode,
  type ProblemDetails,
} from "@/lib/cynthia-client";

export function cynthiaFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return baseCynthiaFetch(path, init, "CatalogApiError");
}
