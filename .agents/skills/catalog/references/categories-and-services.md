# Catalog of categories and services

## Categories

Categories are a single ordered list. A category is not nested inside another category. Its place in the catalog is its global `sort_order`, not a parent.

A category contains zero or more services. Those services are ordered independently of the category list and independently of the services in every other category.

## Services belong to one category

A service belongs to exactly one category. `category_id` is required. A service without a category is invalid and must not be stored.

Creating a service requires the category it belongs to. Moving a service changes which category that is; it does not leave the service unassigned. Deleting a service removes it from its category. Deleting a category is undefined here when the category still has services; do not invent a cascade or a reassignment.

The category decides where the service is shown. The service's own `sort_order` decides its place among the services of that category only.
