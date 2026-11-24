---
name: catalog
description: Apply Cynthia's catalog rules when analyzing, designing, implementing, reviewing, or testing categories, services, drag-and-drop ordering, sort order, or moving a service between categories. A service always belongs to one category. Identity, category, and visual order stay independent.
---

# Cynthia catalog

Read [scope](references/scope.md) and the relevant references before working on the catalog:

- [Categories and services](references/categories-and-services.md): a category owns an ordered list of services, and every service belongs to exactly one category.
- [Identity and order](references/identity-and-order.md): immutable UUID, `category_id`, and `sort_order` as three independent facts.
- [Drag and drop](references/drag-and-drop.md): reorder categories, reorder services inside a category, and move a service to another category.
- [Persistence](references/persistence.md): save affected positions, keep the order consecutive, and leave every UUID unchanged.

Read all relevant references together when a move changes both category and position. Category order and service order are independent, but a cross-category drop updates both the service's category and the two affected service lists.

Treat the references as the intended model, not proof that a feature has already been implemented. Inspect the current code and tests before making claims about actual behavior. Do not infer a rule that the references do not state; ask for a decision when it affects the requested work.

Do not treat catalog position as the permission hierarchy. Groups, invitations, and authorization belong to the permissions skill. Do not add employee, HR, or certificate rules.

When implementation or review is requested, follow the repository's `AGENTS.md` and applicable `go-ddd` and `git-workflow` skills. Preserve existing contracts unless changes are explicitly agreed. Do not modify documentation or implement changes unless requested.
