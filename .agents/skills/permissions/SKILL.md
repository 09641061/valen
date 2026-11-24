---
name: permissions
description: Apply Cynthia's IAM business rules when analyzing, designing, implementing, reviewing, or testing members, invitations, group permissions, authorization, or hierarchy. Distinguish the agreed target behavior from the existing backend and identify unresolved rules. Catalog structure belongs to the catalog skill.
---

# Cynthia IAM permissions

Read [scope and sources](references/status-and-sources.md) and the relevant functional references before working on IAM authorization:

- [Identity and invitations](references/identity-and-invitations.md): Owner, Member, invitations, and member deletion.
- [Groups and hierarchy](references/groups-and-hierarchy.md): active-group limits, ranking, group administration, and reordering.
- [Permissions](references/permissions.md): functional permissions, Administrator, and permission changes.
- [Memberships](references/memberships.md): assignment, self-modification, shared groups, and indirect effects.
- [Scheduling authorization](references/scheduling.md): explicit appearance grant, operational permissions, and Casbin boundaries.
- [Users, groups, and group queries](references/access-and-queries.md): what Manage Users and Manage Permissions and Groups allow, and how the group list is loaded.

Read all relevant references together when a task crosses topics; hierarchy, permissions, memberships, and resource access are interdependent.

Treat the reference as the intended functional model, not proof that a feature has already been implemented. Inspect the relevant current code and tests before making claims about actual behavior. Do not infer a rule where the reference says it is unresolved; ask for a decision when it affects the requested work.

## Authorization implementation

Use [Apache Casbin](https://casbin.apache.org/) for backend permission enforcement when designing or implementing the authorization system. This is an implementation decision, not a claim that Casbin is already integrated. Evaluate the Go implementation and select the simplest model and policy-loading approach compatible with the existing backend; do not introduce an adapter, policy store, watcher, or other dependency without a demonstrated need.

IAM remains the owner of authorization rules and the authoritative user, group, membership, and permission state. Define how Casbin obtains current permissions, how changes become effective across instances, and how failures deny access. Do not rely on stale JWT claims or maintain an unsynchronized second source of truth. Keep framework and Casbin details outside the domain, enforce hierarchy and other business invariants in IAM use cases, and make sensitive authorization checks consistent with their mutations. Test the Casbin integration alongside hierarchy, shared-group, revocation, and concurrency rules.

Keep functional permissions separate from hierarchy. Preserve the distinction between Owner, Member, Administrator, group permission changes, direct membership changes, and the indirect effects of shared groups. Apply the reference's protection against losing one's own effective group-management capability when editing a shared group. Do not substitute assumptions about Discord for Cynthia's explicitly documented rules. Do not add employee, HR, or certificate rules; Cynthia does not have those domains. Catalog category and service order belongs to the catalog skill, not to these references.

For organization and integration settings, consult the organization skill. Keep authority to administer the organization, configure integrations, manage appointments, and appear in Scheduling independent; a personal calendar connection is controlled by its owner. For cross-context work, preserve the distinction between reference reads needed by an authorized workflow and authority to administer the referenced resource. Identify the precise reads required rather than granting broad access by assumption.

When implementation or review is requested, follow the repository's `AGENTS.md` and applicable `go-ddd` and `git-workflow` skills. Preserve existing contracts unless changes are explicitly agreed, enforce authorization on the backend, and test the relevant functional and hierarchy boundaries. Do not modify documentation or implement changes unless requested.