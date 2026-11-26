---
name: crm
description: Apply Cynthia's minimalist CRM rules when analyzing, designing, implementing, reviewing, or testing customers, phone matching, conversations, messages, or WhatsApp integration. Customers exist independently of WhatsApp; internal identity, contact data, and conversation history remain distinct.
---

# Cynthia CRM

Read [scope](references/scope.md), then the relevant references:

- [Customer identity](references/customer-identity.md): UUID and phone matching.
- [Customer data](references/customer-data.md): minimal customer fields.
- [Validation and duplicates](references/validation-and-duplicates.md): normalization and uniqueness.
- [Customer management](references/customer-management.md): registration, search, updates and preservation.
- [Conversations and messages](references/conversations-messages.md): history, statuses and deduplication.
- [WhatsApp integration](references/whatsapp.md): inbound and outbound channel behavior.

These references describe intended behavior, not proof of implementation. Inspect code and tests before making claims about current behavior. Do not invent unresolved rules; ask when a decision affects the work. Preserve existing contracts unless changes are agreed.

Customers are not system members or catalog services. Authorization belongs to the permissions skill; categories and services belong to the catalog skill. Follow repository instructions and applicable engineering skills. Do not implement changes unless requested.
