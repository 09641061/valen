# Catalog of categories and services

## Drag and drop

Order is changed by dragging. The drop result is the order that must be stored. A client-only arrangement is not done until it has been persisted.

### Reorder categories

Dropping a category among the other categories changes its global position. The other categories shift so the category list stays consecutive. Services stay in their categories, with their relative order unchanged.

### Reorder a service inside its category

Dropping a service among the other services of the same category changes only that list. `category_id` stays the same. Other categories and their services stay untouched.

### Move a service to another category

A service may be dragged onto another category, or into a position in that category's service list. This is one operation, not a delete followed by a create.

The operation:

- keeps the service's `id`
- sets `category_id` to the destination category, which must exist
- inserts the service at the dropped position in the destination
- renumbers the source category's remaining services and the destination category's services

After the move, the service still belongs to exactly one category: the destination. It must not remain listed under the source.

There is no uncategorized drop target. A drag that does not land on a category or on a position inside a category does not change the service.
