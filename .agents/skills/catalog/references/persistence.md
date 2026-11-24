# Catalog of categories and services

## Persistence

Each completed drag is saved to the database. Update the rows whose `sort_order` changed. When a service changes category, update that service's `category_id` as well. Do not update any `id`.

The category change and the renumbering of every affected list happen in one transaction. If the transaction fails, the previous categories and positions remain. A service must not be left with a `category_id` that no longer matches the list it was renumbered into.

Concurrent moves must not leave duplicate or gapped positions. The transaction that commits second must base its rewrite on the order already stored by the first.

The database order is the source of truth. Loading the catalog shows categories by their `sort_order`, and under each category only the services whose `category_id` is that category, sorted by their own `sort_order`.

## Not decided here

Do not fill these in unless the task asks for a decision:

- names, descriptions, prices, duration, or publication state
- who may edit the catalog
- soft delete versus hard delete, beyond the renumber that follows a removal
- what happens to services when their category is deleted
- nesting a category inside another category
- one global order that mixes services from different categories
