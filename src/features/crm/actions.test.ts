import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCustomerAction,
  deleteCustomerAction,
  loadConversationMessagesAction,
  loadCustomerConversationsAction,
  updateCustomerAction,
} from "./actions";
import {
  CrmApiError,
  createCustomer,
  deleteCustomer,
  fetchConversationMessages,
  fetchConversations,
  updateCustomer,
} from "./data-access";

const { revalidatePathMock } = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("./data-access", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./data-access")>();
  return {
    ...actual,
    createCustomer: vi.fn(),
    updateCustomer: vi.fn(),
    deleteCustomer: vi.fn(),
    fetchConversations: vi.fn(),
    fetchConversationMessages: vi.fn(),
    fetchCustomer: vi.fn(),
  };
});

const CUSTOMER = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Jane Doe",
  phone: "+573001234567",
  version: 1,
  created_at: "2026-01-01T10:00:00Z",
  updated_at: "2026-01-01T10:00:00Z",
};

describe("crm actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns validation error for invalid phone without calling API", async () => {
    const result = await createCustomerAction({
      name: "Jane Doe",
      phone: "3001234567",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("VALIDATION_ERROR");
      expect(result.fieldErrors?.phone).toBeDefined();
    }
    expect(createCustomer).not.toHaveBeenCalled();
  });

  it("returns typed existingCustomer on 409 conflict", async () => {
    vi.mocked(createCustomer).mockRejectedValueOnce(
      new CrmApiError("CONFLICT", "Phone already exists", 409, undefined, CUSTOMER),
    );

    const result = await createCustomerAction({
      name: "Jane Doe",
      phone: "+573001234567",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("CONFLICT");
      expect(result.existingCustomer).toEqual(CUSTOMER);
    }
  });

  it("revalidates /customers on create, update, and delete", async () => {
    vi.mocked(createCustomer).mockResolvedValueOnce(CUSTOMER);
    vi.mocked(updateCustomer).mockResolvedValueOnce({ ...CUSTOMER, version: 2 });
    vi.mocked(deleteCustomer).mockResolvedValueOnce(undefined);

    const created = await createCustomerAction({
      name: "Jane Doe",
      phone: "+573001234567",
    });
    expect(created.ok).toBe(true);

    const updated = await updateCustomerAction({
      id: CUSTOMER.id,
      version: 1,
      name: "Jane Updated",
      phone: "+573001234567",
    });
    expect(updated.ok).toBe(true);

    const deleted = await deleteCustomerAction({ id: CUSTOMER.id });
    expect(deleted.ok).toBe(true);
    expect(revalidatePathMock).toHaveBeenCalledTimes(3);
    expect(revalidatePathMock).toHaveBeenCalledWith("/customers");
  });

  it("loads customer conversations and messages", async () => {
    vi.mocked(fetchConversations).mockResolvedValueOnce({
      items: [],
      total: 0,
      page: 1,
      page_size: 50,
    });
    vi.mocked(fetchConversationMessages).mockResolvedValueOnce([]);

    const convs = await loadCustomerConversationsAction(CUSTOMER.id);
    const msgs = await loadConversationMessagesAction(
      "22222222-2222-4222-8222-222222222222",
    );
    expect(convs.ok).toBe(true);
    expect(msgs.ok).toBe(true);
  });

  it("rejects invalid UUIDs in loadCustomerConversationsAction and loadConversationMessagesAction", async () => {
    const convs = await loadCustomerConversationsAction("not-a-uuid");
    const msgs = await loadConversationMessagesAction("../other");

    expect(convs.ok).toBe(false);
    if (!convs.ok) expect(convs.code).toBe("VALIDATION_ERROR");

    expect(msgs.ok).toBe(false);
    if (!msgs.ok) expect(msgs.code).toBe("VALIDATION_ERROR");

    expect(fetchConversations).not.toHaveBeenCalled();
    expect(fetchConversationMessages).not.toHaveBeenCalled();
  });
});
