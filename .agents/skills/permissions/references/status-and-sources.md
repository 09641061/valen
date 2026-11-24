# Identity, Membership, and Permissions

## Scope

These references describe the intended functional rules for identity and access management in Cynthia. They explain how members, invitations, groups, permissions, and hierarchy relate to one another. Cynthia's IAM covers invitations and group permissions. It has no employee, HR, or certificate domain.

The references describe intended behavior, not proof of what is implemented. Verify the current behavior before making implementation claims. Rules that remain undefined must not be treated as decided behavior.

## External reference

Discord's role model informed the distinction between permissions, hierarchy, and the ability to grant permissions. Cynthia retains its own decisions: it limits active groups to 50, does not offer Owner transfer within the application, and prevents Members from assigning groups to themselves. It also has no base group equivalent to `@everyone`. Its rules are therefore not a complete reproduction of Discord. For the official sources, see [Discord Roles and Permissions](https://support.discord.com/hc/en-us/articles/214836687-Discord-Roles-and-Permissions) and the [Discord developer documentation on permissions](https://docs.discord.com/developers/topics/permissions).
