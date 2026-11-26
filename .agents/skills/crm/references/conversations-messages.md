# Conversations and messages

A conversation belongs to one customer and has an ID, status and creation time. A customer may have conversations but does not need one until communicating. Conversations are open or closed; an inbound message reopens a closed conversation. Closing never deletes history. How to select a conversation when several exist remains undecided.

A message belongs to one conversation and has an ID, external ID when available, direction, content, status and creation time. Display messages chronologically. Inbound messages must not be stored twice when the provider repeats delivery. Outbound attempts must not create duplicate sends; retain failures with an error status. Do not equate an accepted send request with delivery. Handle uncertain outcomes and retries without assuming the provider guarantees exactly-once delivery.

Preserve history and test duplicate inbound events, concurrent requests, failed and uncertain sends, closing and reopening. Message status vocabulary, ordering ties and reconciliation policy remain to be decided.
