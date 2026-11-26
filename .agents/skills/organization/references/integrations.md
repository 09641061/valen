# Integrations

## Google Calendar

Each member may connect or disconnect their own Google Calendar, not another member's. Scheduling is authoritative; synchronization is one-way from appointments to the assigned person's connected calendar. Scheduling works without a connection. Create an event on booking, update the same event on modification, and delete only the associated event on cancellation or deletion. A reassignment must remove the old associated event and synchronize the new person's event if connected. Never delete unrelated personal events.

Persist the association between appointment, connection/calendar and external event; make retries and duplicate delivery safe, and reconcile uncertain results. Record synchronization failures and retry without rolling back or duplicating the authoritative appointment. Define reconnect, revocation, backfill, retention and deletion cleanup policies before implementation. Treat tokens as secrets: least-privilege OAuth scopes, secure storage, no tokens in UI, logs or responses; validate OAuth state and enforce ownership on the backend. Test disconnects, retries, concurrent changes, reassignment and remote errors.

Official references: [Calendar API overview](https://developers.google.com/workspace/calendar/api/guides/overview), [create events](https://developers.google.com/workspace/calendar/api/guides/create-events), [delete event](https://developers.google.com/workspace/calendar/api/v3/reference/events/delete), and [Google Tasks overview](https://developers.google.com/workspace/tasks/overview). Google Tasks is distinct and is not required for appointments.

## WhatsApp Business

Settings configures the organization's official Meta Cloud API connection: business number, WhatsApp Business Account ID, Phone Number ID, credentials, webhook configuration and verification, connection status, verification and connect/disconnect. CRM owns customer matching and message history. Never expose stored credentials in UI or responses; protect secrets, authenticate webhook requests and enforce permissions server-side. Respect current Meta policies for customer contact, service windows and templates. Follow the CRM WhatsApp reference for messaging behavior.

Use only official Meta sources: [platform overview](https://developers.facebook.com/documentation/business-messaging/whatsapp/overview/), [webhooks](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-whatsapp/), [phone numbers](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account/phone_numbers/), [number registration](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account-to-number-current-status/register/), and [message templates](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account/message_templates/). Verify current documentation and API version before implementation.
