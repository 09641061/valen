# Eligibility and availability

Only people with an explicit `scheduling.appear` authorization and an active Scheduling state appear as bookable columns, including Owner and Administrator. No account, group, role, wildcard or administrative privilege implies appearance. Authorization to view, manage or configure is separate from appearance and from time availability. Follow the permissions skill's Scheduling reference for grant and revocation rules. Define separately how historical appointments remain accessible after revocation or deactivation.

Never allow overlapping bookings for one person, including concurrent creates or moves: enforce atomically in persistence, not only by checking the UI. Time zones, daylight-saving transitions and interval boundaries require explicit decisions.

Test missing grants for every user including Owner, grant and revoke, deactivation, time availability and concurrent conflicts.
