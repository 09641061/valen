# Identity, Membership, and Permissions

## Identity and membership

### Owner

The Owner is the system's highest authority. There is a single primary Owner, identified by a crown in the member list. Owner status belongs to the user account and is not represented by a group; consequently, Owner does not appear in the group list.

The Owner has full access to application functionality and permissions, except that being an eligible Scheduling resource requires an explicit appearance grant even for the Owner; see [Scheduling authorization](scheduling.md). Their authority is above all groups and members, including those with the Administrator permission. The hierarchical restrictions applicable to Members do not limit the Owner's ability to manage groups, permissions, and members.

The system will not provide functionality to transfer Owner status. If the person holding this position must change, the change will be made through an administrative procedure outside the application's ordinary functionality.

### Member

Everyone other than the Owner is a Member. Invited users always join as Members and cannot become Owner by accepting an invitation.

A Member has no administrative permissions of their own. Their permissions come exclusively from the groups to which they belong. A Member without groups receives no administrative permissions and occupies the base level of the hierarchy, always below the Owner.

Member status is independent of Administrator. A Member may have the Administrator permission through a group, but remains a Member and is subject to the corresponding hierarchical restrictions.

## Invitations and member lifecycle

### Creating an invitation

Creating an invitation allows a person to be invited by email. Until the invitation is accepted, the associated account is pending. The invitee completes onboarding by accepting the invitation and providing the information required for their account.

A person who accepts an invitation joins as a Member. The invitation itself does not grant Owner status or administrative permissions. Any permissions subsequently obtained depend on the groups to which the Member belongs.

Invitations have a limited validity period. Whether groups may be assigned before acceptance and the specific handling of expired invitations remain undefined.

### Deleting an invitation

Deleting an invitation is distinct from deleting a member. Its purpose is to prevent a person whose onboarding is still pending from completing it through that invitation. A deleted invitation must not allow the associated pending account to be activated.

Invitation deletion concerns onboarding that has not yet been completed. If the invitation has already been accepted and the person is an active member, the member-deletion rules apply instead. If acceptance and deletion occur concurrently, the outcome must be coherent: either onboarding completes or the invitation is deleted, but a deleted invitation must not permit subsequent onboarding.

The exact behavior for a new invitation to the same email after deletion and for repeated deletion attempts remains undefined.

### Deleting a member

Deleting a member concerns a person who already belongs to the system. It is distinct from deleting a pending invitation. The Owner remains above all other members, and a Member cannot alter their status as the highest authority.

Member administration is subject to both the applicable permission and the hierarchy. The intended rule is that a Member may act only on members below their own level. A Member therefore cannot delete an equal- or higher-level member or the Owner, even with Administrator.

Manage Users permits creating invitations, deleting pending invitations, and deleting active members. The Owner and Members with Administrator also have these capabilities. To delete an active member, a Member must additionally respect the hierarchy. Manage Users alone does not grant the ability to assign or remove groups.
