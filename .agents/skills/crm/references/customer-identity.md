# Customer identity

Each customer has a unique immutable internal UUID. A change of phone or name does not change it. The phone is a contact and matching key, not proof of legal identity.

Match an incoming WhatsApp number against the normalized phone of an existing customer. An exact unambiguous match uses that customer, including one registered manually before their first message. If no match exists, create a customer. Never merge records automatically on a doubtful match. Phone reassignment and changes can make a match unreliable; the policy for handling those cases is not yet defined.
