# Validation and duplicates

Normalize and validate the phone before comparing or storing it. The default region for a number without an international prefix is undecided; do not guess. One normalized number must not be assigned to two customers. On manual creation, show the existing customer instead of creating a duplicate. On update, reject a number belonging to another customer; the customer's own number is not a conflict.

Enforce uniqueness even under concurrent writes. A name match alone is not enough to merge customers. Scope of uniqueness across businesses, and handling ambiguous or shared numbers, require explicit decisions.
