# Identity, Membership, and Permissions

## Groups and hierarchy

### Group organization

Groups bring members together and determine the permissions they can obtain. Each group has a position in an ordered hierarchy: a higher-priority group is above a lower-priority one. The system permits at most 50 active groups. When a group is deleted, it no longer counts toward the limit, and its record is later purged according to the retention policy.

New groups are placed at the bottom of the hierarchy, below existing groups. They may subsequently be moved according to the ordering and authority rules. There is no base group equivalent to `@everyone`: Member status does not itself grant administrative permissions.

Hierarchy and permissions serve different purposes. Permissions determine what type of operation a person may perform; hierarchy determines which groups and members may be targeted by operations subject to hierarchical restrictions. Consequently, two groups with the same permissions do not necessarily have the same authority.

### A member's hierarchical level

A Member may belong to several groups. Their hierarchical level is determined by their highest-priority group. Permissions, by contrast, come from all their groups, not just the group determining their level.

For example, a person may belong to a high-priority group that grants Manage Users and a lower-priority group that grants Manage Permissions and Groups. Their level is that of the higher group, and their permissions include both grants. The lower group's permissions are not disregarded because of its position.

Two members whose highest group is the same have the same hierarchical level, even if their other groups or permissions differ. A Member without groups is at the base level and is not above a member who belongs to a group.

### Managing groups

A Member with Manage Permissions and Groups or Administrator may manage groups below their own level. They cannot modify a group at the same or a higher level. The functional permission is necessary but does not replace the hierarchy check.

If three groups are ordered from highest to lowest priority, a member whose highest group is the first may manage the second and third, provided they have the corresponding permission. A member whose highest group is the second may manage the third, but not the first or second. A member whose highest group is the third cannot manage either of the other two groups because both are above them.

A lower group having the same permissions as a higher group does not change this rule. A person in the higher group may manage the lower one if they have the corresponding permission; a person in the lower group cannot manage the higher one, even when both grant exactly the same permissions.

### Group order

The order determines which groups are above or below others and therefore affects their members' authority. Reordering does not directly grant or remove a functional permission, but it may change the authority relationships between members.

A Member with Manage Permissions and Groups or Administrator may change the relative order of groups strictly below their highest group. They cannot move their highest group, change the position of equal or higher groups, or place a lower group above their own level. Administrator does not remove these restrictions. The Owner may reorder the entire hierarchy and remains above all groups.

For example, a person whose highest group has priority 2 may swap groups with priorities 3 and 4, but cannot move them above group 2 or move the group with priority 1. The new order may change the relative authority of members of the lower groups without placing the actor above their own level.
