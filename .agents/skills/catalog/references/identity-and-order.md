# Catalog of categories and services

## Three independent facts

Every category and every service keeps identity, placement, and visual position separate. Do not derive one from another.

| Fact | Field | Meaning |
|---|---|---|
| Identity | `id` | UUID. Names the row. Assigned once and never changed. |
| Category | `category_id` | Required on a service. The category the service belongs to. Absent on a category. |
| Position | `sort_order` | Positive integer, `1`, `2`, `3`… Visual position inside the relevant list. |

`sort_order` is not an identifier. Reordering, moving, adding, or deleting may change `sort_order`. Moving a service to another category changes `category_id`. None of these operations changes `id`.

## Two lists

Categories share one global sequence. `sort_order` `1` is the first category shown.

Services of one category share a second sequence, scoped to that `category_id`. Service `sort_order` `1` in one category is unrelated to service `sort_order` `1` in another. The same numeric position may exist in different categories because the sequences are different lists.

Moving a category does not reorder the services inside it. Moving or reordering a service does not change the category sequence.

## Consecutive positions

Each list is exactly `1` through `n` after every insert, delete, reorder, or cross-category move:

- no duplicate `sort_order` inside the category list
- no duplicate `sort_order` among the services of the same category
- no gaps; removing the item at `2` makes the old `3` become `2`, and so on

A new category is appended at `n + 1` unless the operation gives another position. A new service is appended at the end of its category unless the operation gives another position. The first service in an empty category receives `sort_order` `1`.

Rewrite only the lists the operation affects. A category move rewrites the category list. A service reorder inside one category rewrites that category's services. A move between categories rewrites the source list and the destination list.
