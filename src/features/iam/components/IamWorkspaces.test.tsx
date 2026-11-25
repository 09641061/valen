import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as actions from "../actions";
import type { ActorDto, RoleDto } from "../schemas";
import { AccountSettingsForm } from "./AccountSettingsForm";
import { MembersWorkspace } from "./MembersWorkspace";
import { RolesWorkspace } from "./RolesWorkspace";

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock("../actions", () => ({
  updateMeAction: vi.fn(),
  createRoleAction: vi.fn(),
  updateRoleAction: vi.fn(),
  deleteRoleAction: vi.fn(),
  reorderRolesAction: vi.fn(),
  assignMemberRolesAction: vi.fn(),
  deleteMemberAction: vi.fn(),
  createInvitationAction: vi.fn(),
}));

const roleAdmin: RoleDto = {
  id: "role-1",
  name: "Managers",
  position: 1,
  permissions: ["calendar.manage"],
};

const ownerActor: ActorDto = {
  id: "user-owner",
  email: "owner@takodu.test",
  first_name: "Ana",
  last_name: "Owner",
  type: "owner",
  level: 0,
  roles: [],
  effective_permissions: ["iam.manage_roles", "iam.manage_users"],
};

const staffMember: ActorDto = {
  id: "user-1",
  email: "luis@takodu.test",
  first_name: "Luis",
  last_name: "Staff",
  type: "user",
  level: 1,
  roles: [roleAdmin],
  effective_permissions: ["calendar.manage"],
};

const unassignedMember: ActorDto = {
  id: "user-2",
  email: "sofia@takodu.test",
  first_name: "Sofia",
  last_name: "Perez",
  type: "user",
  level: 2,
  roles: [],
  effective_permissions: [],
};

describe("IAM simplified workspaces", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("switches to Members tab in RolesWorkspace and adds/removes a member", async () => {
    const user = userEvent.setup();
    vi.mocked(actions.assignMemberRolesAction).mockResolvedValue({
      ok: true,
      data: { ...unassignedMember, roles: [roleAdmin] },
    });

    render(
      <RolesWorkspace
        actor={ownerActor}
        initialRoles={[roleAdmin]}
        initialMembers={[ownerActor, staffMember, unassignedMember]}
      />,
    );

    expect(screen.queryByLabelText("Group name")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Members (1)" }));
    expect(screen.getByText("Luis Staff")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add member" }));
    expect(screen.queryByRole("button", { name: /Ana Owner/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Sofia Perez/i }));

    await waitFor(() => {
      expect(actions.assignMemberRolesAction).toHaveBeenCalledWith({
        member_id: "user-2",
        role_ids: ["role-1"],
      });
    });

    vi.mocked(actions.assignMemberRolesAction).mockResolvedValue({
      ok: true,
      data: { ...staffMember, roles: [] },
    });
    await user.click(screen.getByRole("button", { name: "Remove Luis Staff from Managers" }));
    await waitFor(() => {
      expect(actions.assignMemberRolesAction).toHaveBeenCalledWith({
        member_id: "user-1",
        role_ids: [],
      });
    });
  });

  it("creates a group with name only and selects it", async () => {
    const user = userEvent.setup();
    const createdRole: RoleDto = {
      id: "role-2",
      name: "Reception",
      position: 2,
      permissions: [],
    };
    vi.mocked(actions.createRoleAction).mockResolvedValue({
      ok: true,
      data: createdRole,
    });

    render(
      <RolesWorkspace
        actor={ownerActor}
        initialRoles={[roleAdmin]}
        initialMembers={[ownerActor]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Create group" }));
    await user.type(screen.getByLabelText("Name"), "Reception");
    await user.click(screen.getAllByRole("button", { name: "Create group" }).at(-1)!);

    await waitFor(() => {
      expect(actions.createRoleAction).toHaveBeenCalledWith({
        name: "Reception",
        permissions: [],
      });
    });
    expect(screen.getByRole("button", { name: "Members (0)" })).toBeInTheDocument();
  });

  it("renders simplified MembersWorkspace without role badges or summary", () => {
    render(
      <MembersWorkspace
        actor={ownerActor}
        initialMembers={[ownerActor, staffMember]}
      />,
    );

    expect(screen.getByText("Owner")).toBeInTheDocument();
    expect(screen.getAllByText("Member")).toHaveLength(2);
    expect(screen.queryByText(/Owner · account/)).not.toBeInTheDocument();
    expect(screen.queryByText("Managers")).not.toBeInTheDocument();
  });

  it("submits AccountSettingsForm with first and last name only", async () => {
    const user = userEvent.setup();
    vi.mocked(actions.updateMeAction).mockResolvedValue({
      ok: true,
      data: { ...ownerActor, first_name: "Maria" },
    });

    render(<AccountSettingsForm initialActor={ownerActor} />);

    expect(screen.getByText("Update your personal details.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email address")).toBeDisabled();
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();

    const firstInput = screen.getByLabelText("First name");
    await user.clear(firstInput);
    await user.type(firstInput, "Maria");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(actions.updateMeAction).toHaveBeenCalledWith({
        first_name: "Maria",
        last_name: "Owner",
      });
    });
  });
});
