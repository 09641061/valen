# Customer data

The minimal customer has `id`, `name`, `phone`, and `created_at`. Phone is one field, not separate country-code and local-number fields; normalize the full number with its international prefix when applicable. Manual registration requires name and phone. Automatic registration uses the received number and available name; behavior when no name is available remains undecided and must not block design by assuming an invented name or mandatory field.

Email, postal code and identity documents are not customer requirements in this CRM. Do not add them without an explicit scope decision.
