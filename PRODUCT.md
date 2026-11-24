# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js App Router, React, TypeScript strict, and Bun. The user explicitly selected Next.js; the existing repository had no application scaffold.

## Users

Owners and authorized staff of small service businesses who manage bookable services and categories. End customers discover and book those services through the broader Takodu product; customer-facing booking is outside this Valen implementation.

## Product Purpose

Takodu helps small service businesses organize appointments and customer operations. The Valen web application gives staff a responsive interface for maintaining the service catalog used by scheduling.

## Positioning

A business-facing workspace centered on appointments and service operations, with customer booking supported through WhatsApp in the broader product. This implementation covers the catalog surface only.

## Operating Context

Staff may manage a service catalog from a desktop or mobile browser. The first Valen increment fully implements Catálogo; the other navigation destinations are simple title-only placeholders, not partial implementations.

## Capabilities and Constraints

- Categories and services are separate catalog entities; each service belongs to exactly one category, and identity, category membership, and visual order remain independent.
- Catalog scope includes category and service CRUD, search, and ordering. IAM and other bounded contexts are outside the current frontend scope.
- Service duration is required by the existing backend API, but the Doop reference marks its duration as undecided. Service status is shown in Doop but is not present in the current backend contract. These are unresolved integration decisions, not permission to invent persistence behavior.
- The API has no authentication implementation in the inspected code. This implementation does not add IAM; deployment must not treat the catalog as protected until authentication and authorization are provided by the platform.

## Brand Commitments

- Product name: Takodu (also shown as `takodu` in the provided application reference).
- Preserve and use the existing Kodu assets in `assets/`.
- The user selected the Takodu Doop application canvas as the binding visual and interaction reference for the application shell and Catalog.

## Evidence on Hand

- Brand assets: `assets/kodu-full.svg`, `assets/kodu-head.svg`, and `assets/favicon.svg`.
- Visual and flow reference: Doop canvas `wug3TkRiMh`, application page `Ek_c7HZyoc`; Catalog list frame `XH1BzGAFjM` and mobile navigation frame `b02kNs7RG2`.
- Doop’s salon names and prices are sample design content, not verified business data. Do not present them as real organization records or persist them as seed data.

## Product Principles

- Preserve catalog identity independently from its category and sort order.
- Keep every catalog-changing flow explicit and recoverable; confirm destructive changes.
- Keep the mobile and desktop experiences within the same navigation and task model.
- Keep future bounded contexts separate; title-only routes do not imply implemented capabilities.

## Accessibility & Inclusion

Navigation, forms, menus, dialogs, and ordering controls must be keyboard operable and have accessible names and visible focus. No formal conformance target has been specified.
