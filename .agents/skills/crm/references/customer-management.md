# Customer management

Register customers manually without requiring WhatsApp or creating a conversation. List and search customers by name or phone, view their conversations, and edit name and phone while preserving the UUID. Apply normalization and duplicate checks on creation and update. Persist accepted changes; rejected changes must not overwrite the existing customer.

Prevent accidental loss of conversations and customer information when deleting a customer. The specific deletion, archival and retention policy is undecided. The handling of old phone numbers after a change also needs a decision; do not silently reassign historical messages.
