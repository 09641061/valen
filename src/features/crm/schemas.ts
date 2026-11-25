import { z } from "zod";

export const E164_PHONE_REGEX = /^\+[1-9][0-9]{6,14}$/;

const PhoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s\-()]/g, ""))
  .pipe(
    z
      .string()
      .regex(
        E164_PHONE_REGEX,
        "Enter a valid international phone number starting with + (e.g. +573001234567)",
      ),
  );

const CustomerNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(160, "Name must be 160 characters or fewer");

export const UuidSchema = z.string().uuid();

export const CustomerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  phone: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CustomerPageSchema = z.object({
  items: z.array(CustomerSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  page_size: z.number().int().min(1),
});

export const ConversationStatusSchema = z.enum(["open", "closed"]);

export const ConversationSchema = z.object({
  id: z.string().uuid(),
  customer_id: z.string().uuid(),
  channel: z.string(),
  status: ConversationStatusSchema,
  last_message_at: z.string().optional(),
  last_message_preview: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ConversationPageSchema = z.object({
  items: z.array(ConversationSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  page_size: z.number().int().min(1),
});

export const MessageDirectionSchema = z.enum(["inbound", "outbound"]);

export const MessageStatusSchema = z.enum([
  "received",
  "pending",
  "sent",
  "delivered",
  "failed",
  "uncertain",
]);

export const MessageSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  external_id: z.string().optional(),
  idempotency_key: z.string().optional(),
  direction: MessageDirectionSchema,
  content: z.string(),
  status: MessageStatusSchema,
  created_at: z.string(),
});

export const MessageListSchema = z.object({
  items: z.array(MessageSchema),
});

export const CreateCustomerSchema = z.object({
  name: CustomerNameSchema,
  phone: PhoneSchema,
});

export const UpdateCustomerSchema = z.object({
  id: z.string().uuid(),
  name: CustomerNameSchema,
  phone: PhoneSchema,
});

export const DeleteCustomerSchema = z.object({
  id: z.string().uuid(),
});

export const SendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  idempotencyKey: z.string().trim().min(1, "Idempotency key is required").max(128),
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(4096, "Message must be 4096 characters or fewer"),
});

export const UpdateConversationStatusSchema = z.object({
  conversationId: z.string().uuid(),
  status: ConversationStatusSchema,
});

export type CustomerDto = z.infer<typeof CustomerSchema>;
export type CustomerPageDto = z.infer<typeof CustomerPageSchema>;
export type ConversationDto = z.infer<typeof ConversationSchema>;
export type ConversationPageDto = z.infer<typeof ConversationPageSchema>;
export type MessageDto = z.infer<typeof MessageSchema>;
export type CreateCustomerInput = z.input<typeof CreateCustomerSchema>;
export type UpdateCustomerInput = z.input<typeof UpdateCustomerSchema>;
export type DeleteCustomerInput = z.input<typeof DeleteCustomerSchema>;
export type SendMessageInput = z.input<typeof SendMessageSchema>;
export type UpdateConversationStatusInput = z.input<
  typeof UpdateConversationStatusSchema
>;

export interface HydratedConversation {
  conversation: ConversationDto;
  customer: CustomerDto | null;
}
