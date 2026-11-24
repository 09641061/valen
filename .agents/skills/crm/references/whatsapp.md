# WhatsApp channel

## Official Meta references

Consult the current documentation before designing or changing the integration; provider requirements and API versions can change:

- [WhatsApp Business Platform overview](https://developers.facebook.com/documentation/business-messaging/whatsapp/overview): platform and Cloud API.
- [Get started](https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started): setup, test messages and webhooks.
- [WhatsApp webhooks](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview): incoming events and status notifications.
- [Service messages](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/send-messages): sending replies and customer service window restrictions.
- [Template fundamentals](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview): provider requirements outside the service window; this reference does not expand CRM scope to campaigns.
- [Meta's WhatsApp Cloud API Postman collection](https://www.postman.com/meta/whatsapp-business-platform/collection/wlk6lh4/whatsapp-cloud-api): official request examples.

Settings owns business connection configuration; consult the organization skill for credentials, webhook setup and official integration references. AI instructions do not override CRM, authorization or safety rules.

## CRM behavior

On an incoming message, validate the provider notification, normalize its phone, find the customer or create one using available data, create or recover the appropriate conversation, and store the message without duplicates. Reopen a closed conversation. An existing manually registered customer with a matching number is reused.

A user replies from an available conversation. Request delivery through WhatsApp and record the result, retaining failed messages. Provider restrictions and uncertain outcomes must be handled explicitly; never assume a retry is safe without reconciliation or a supported idempotency mechanism.

When WhatsApp is unavailable, customers can still be registered, searched and edited, and stored conversations can be consulted. Sending and receiving depend on the channel recovering. Do not make WhatsApp the source of truth for customer identity or stored history.
