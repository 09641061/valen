# Organization and Settings

The system has one organization and one Owner; do not create multi-company functionality. The organization centralizes its name, business description, time zone, business hours, integration and AI configuration, and member/permission administration. IAM owns users and permissions; Scheduling owns appointments and CRM owns customer conversations.

Settings has only General, Integrations, AI Agent, and Members and permissions. Each member manages their own Google Calendar connection under Integrations; My agenda is for viewing their appointments, not configuring integrations.

Keep organization administration, integration configuration, appointment management and appearance authorization independent. Owner administers configuration and permissions; any delegated access requires an explicit policy decision. Apply the permissions skill and enforce authorization server-side. Being a member or Owner does not make anyone bookable. Organization business hours and personal availability are different; how they interact requires a decision.
