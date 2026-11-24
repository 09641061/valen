# Identity, Membership, and Permissions

## Permissions

### Functional permissions

The intended functional permissions are Manage Users, Manage Permissions and Groups, and Administrator. These permissions are independent of each other, except for the Administrator grant defined below. Each permission is an on/off value on a group. An enabled permission grants the ability it names; a disabled permission does not grant it through that group. There is no Manage Employees, Manage Certificates, or other HR permission.

A Member's permissions are combined from all their groups. If at least one group grants a permission, the Member has it. Another group having the same permission disabled does not cancel that grant. A Member without groups receives none of these administrative permissions.

Hierarchy does not replace permissions. Being above another group does not permit managing it without Manage Permissions and Groups or Administrator. Likewise, holding the functional permission does not permit acting on a group of equal or higher priority.

### Administrator

Administrator is an advanced permission that grants access to all application resources and functionality. A Member obtains it through a group with Administrator enabled; it is not a third member type and does not make the person an Owner.

Administrator grants all functional permissions but does not remove hierarchical restrictions. Scheduling appearance is an explicit eligibility grant, not implied by Administrator or any general access permission; see [Scheduling authorization](scheduling.md). If two administrators are at different levels, the higher one may modify the lower one's groups and permissions, subject to the other applicable rules. The lower administrator cannot directly modify the higher one's memberships. If they are at the same level, neither can directly modify the other's memberships. Effective permissions may be affected indirectly by changes to shared groups, according to the rules for that functionality.

The Owner retains the highest authority even over a Member with Administrator. Full functional access does not place an Administrator above the Owner.

### Granting permissions

To modify the permissions of a lower group, a Member must have Manage Permissions and Groups or Administrator. They may only enable or disable permissions they themselves hold. Permissions they do not hold remain locked, whether currently enabled or disabled. This does not prevent changes to other permissions they do hold, provided the operation respects the other applicable rules.

For example, a Member who can manage permissions and groups but does not have Administrator cannot turn the Administrator permission on or off within a group, even if that group is below their level. They also cannot turn Manage Users on or off if they do not hold Manage Users. The Owner may manage all permissions.

The interface should reflect unavailable options, but visual controls do not replace enforcement by the system. The restriction on switches concerns changes to group permissions; assigning an existing group to another person follows the membership rules.
