# Identity, Membership, and Permissions

## Managing members and memberships

### Changes affecting other members

Authority to directly modify a member's memberships is determined by comparing the actor's level with the affected person's highest level. A Member with the corresponding permission may modify those memberships only if the target is strictly below their level. They cannot do so when the target is at the same or a higher level.

For example, if a person belongs to the first and third groups, their level is that of the first group. An administrator whose highest group is the second cannot directly assign or remove groups for that person, even if both share the third group. The comparison considers the affected member's highest level, not only the group being assigned or removed.

Assigning or removing a group affects the member's membership and is distinct from modifying the group's internal permissions. A Member with Manage Permissions and Groups or Administrator may manage another member's memberships only when that member is below their level and only for groups below their own highest group. They cannot modify the memberships of an equal- or higher-level member or act on the Owner.

A person with Manage Permissions and Groups may assign or remove any group below their own level for a lower-level member, even if the group grants permissions they do not themselves hold. For example, they may assign Juan, who is below them, a lower group with Administrator enabled, even though they do not have Administrator. Juan then obtains the group's effective permissions, including Administrator.

Likewise, that person may remove the group from Juan or delete a lower group that grants Administrator. These actions differ from changing the group's permission switches: if the person does not have Administrator, they cannot enable or disable that switch. Nor can they assign the group to themselves or directly modify the memberships of an equal- or higher-level member.

### Changes affecting one's own account

A Member cannot directly assign groups to or remove groups from themselves, even if those groups are below their highest group. This restriction also applies to a Member with Administrator. Consequently, a Member cannot obtain Administrator by assigning themselves a lower group that already grants it.

Editing a shared group is a different action and may indirectly affect the editor's effective permissions, according to the shared-group rules. Reordering lower groups is also not equivalent to assigning oneself a group, although it may change the relative authority of their members.

Changes to personal information are not necessarily equivalent to changes to groups or permissions. The restriction above concerns direct management of one's own memberships and permissions; it does not by itself define the rules for editing a personal profile.

### Effects on members of multiple groups

A Member with Manage Permissions and Groups or Administrator may edit a lower group even if they also belong to it or it is assigned to equal- or higher-level members. Authorization to edit the group is determined by its position and by the permissions the actor may modify, not by the individual hierarchy of each member.

For example, a person whose highest group is Group 1 also belongs to Group 3, as does Juan. That person may edit Group 3 because it is below their level, but may only enable or disable permissions they themselves hold. The change applies to the group and may indirectly modify the effective permissions of all its members, including the editor or equal- or higher-level members. This differs from directly assigning or removing a group for a protected person.

When a Member modifies the permissions of a lower group to which they also belong, they cannot remove a permission if the change would eliminate their own effective ability to manage permissions and groups. For example, if they obtain that ability only from the shared group, they cannot disable it in that group. If they retain the ability through another group or Administrator, they may make the change subject to the other restrictions. This protection also applies when disabling Administrator would cause them to lose that ability.

The prohibition on directly modifying one's own groups and the protection against direct changes to equal- or higher-level members do not, by themselves, prevent the indirect effects of editing a shared group. The exception is the protection of one's own ability to manage permissions and groups described above. These distinctions must be considered when granting group-management capability.
