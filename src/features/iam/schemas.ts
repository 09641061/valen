import { z } from "zod";

export const RoleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  position: z.number().int(),
  permissions: z.array(z.string()),
});

export type RoleDto = z.infer<typeof RoleSchema>;

export const ActorSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  type: z.enum(["owner", "user"]),
  level: z.number().int(),
  roles: z.array(RoleSchema),
  effective_permissions: z.array(z.string()),
});

export type ActorDto = z.infer<typeof ActorSchema>;

export const AuthTokensSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  token_type: z.string().min(1),
  expires_in: z.number().int(),
  user: ActorSchema.optional(),
});

export type AuthTokensDto = z.infer<typeof AuthTokensSchema>;

export const InvitationSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  created_at: z.string(),
  expires_at: z.string(),
});

export type InvitationDto = z.infer<typeof InvitationSchema>;

export const LoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const AcceptInviteSchema = z.object({
  token: z.string().min(1, "Invitation token is required"),
  first_name: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(80, "First name must be 80 characters or fewer"),
  last_name: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(80, "Last name must be 80 characters or fewer"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be 128 characters or fewer"),
});

export const UpdateMeSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(80, "First name must be 80 characters or fewer"),
  last_name: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(80, "Last name must be 80 characters or fewer"),
  password: z
    .string()
    .refine(
      (val) => val.length === 0 || (val.length >= 8 && val.length <= 128),
      "New password must be between 8 and 128 characters",
    )
    .optional(),
});

export const AssignRolesSchema = z.object({
  member_id: z.string().min(1),
  role_ids: z.array(z.string().min(1)),
});

export const DeleteMemberSchema = z.object({
  member_id: z.string().min(1),
});

export const CreateRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Group name is required")
    .max(80, "Group name must be 80 characters or fewer"),
  permissions: z.array(z.string().min(1)),
});

export const UpdateRoleSchema = z.object({
  role_id: z.string().min(1),
  name: z
    .string()
    .trim()
    .min(1, "Group name is required")
    .max(80, "Group name must be 80 characters or fewer"),
  permissions: z.array(z.string().min(1)),
});

export const DeleteRoleSchema = z.object({
  role_id: z.string().min(1),
});

export const ReorderRolesSchema = z.object({
  ordered_ids: z.array(z.string().min(1)).min(1),
});

export const CreateInvitationSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type AcceptInviteInput = z.infer<typeof AcceptInviteSchema>;
export type UpdateMeInput = z.infer<typeof UpdateMeSchema>;
export type AssignRolesInput = z.infer<typeof AssignRolesSchema>;
export type DeleteMemberInput = z.infer<typeof DeleteMemberSchema>;
export type CreateRoleInput = z.infer<typeof CreateRoleSchema>;
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>;
export type DeleteRoleInput = z.infer<typeof DeleteRoleSchema>;
export type ReorderRolesInput = z.infer<typeof ReorderRolesSchema>;
export type CreateInvitationInput = z.infer<typeof CreateInvitationSchema>;
