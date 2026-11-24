# Scope and model

Scheduling is the agenda domain; an appointment is a scheduled meeting, and booking is the act of reserving a time. Scheduling manages appointments per person, not payments, invoicing, inventory, campaigns or analytics.

An appointment references an existing CRM customer, a catalog service and a person, with its own identity, time interval and status. Model person activation and availability separately from IAM grants; no separate employee domain is implied. Define availability data only as needed. Service duration source and historical snapshots are undecided: do not assume catalog already provides duration.
