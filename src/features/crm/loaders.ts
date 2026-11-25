import "server-only";

import { cache } from "react";
import {
  fetchCustomer,
  fetchCustomers,
  type FetchCustomersParams,
} from "./data-access";
import type { CustomerDto, CustomerPageDto } from "./schemas";

export const getCustomers = cache(
  async (params: FetchCustomersParams = {}): Promise<CustomerPageDto> => {
    return fetchCustomers(params);
  },
);

export const getCustomer = cache(
  async (id: string): Promise<CustomerDto> => {
    return fetchCustomer(id);
  },
);
